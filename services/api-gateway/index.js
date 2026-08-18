const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Load .env if the module exists; don't crash if it's not installed in the environment
try { require('dotenv').config(); } catch (e) { console.warn('dotenv not found; continuing without .env'); }

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'https://osint-breach-python.onrender.com/query';
const PYTHON_BASE = PYTHON_SERVICE_URL.replace(/\/query$/, '');

const app = express();

// CORS with credentials for auth cookie
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://osint-search-y2fx.onrender.com';
const ALLOWED_ORIGINS = FRONTEND_URL.split(',').map(s => s.trim()).filter(Boolean);
const ORIGINS = ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : ['http://localhost:3000', 'http://127.0.0.1:3000'];
app.use(cors({
  origin: (origin, cb) => {
    // allow same-origin (no Origin header) and file://
    if (!origin) return cb(null, true);
    if (ORIGINS.includes(origin)) return cb(null, true);
    // Allow localhost / 127.0.0.1 on any port only in non-production environments
    if (process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
      return cb(null, true);
    }
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie', 'cookie'],
}));

app.use(cookieParser());
app.use(bodyParser.json());

// Crash guards to surface errors instead of silent exits
process.on('uncaughtException', (err) => { console.error('Uncaught exception:', err); });
process.on('unhandledRejection', (reason) => { console.error('Unhandled rejection:', reason); });

// Mount auth router and import verification middleware
let authRouter;
let verifyOtpToken = (req, res, next) => res.status(403).json({ error: 'Verification required' });

try {
  const authModule = require('./auth/routes/auth');
  authRouter = authModule.router || authModule;
  if (typeof authModule.verifyOtpToken === 'function') {
    verifyOtpToken = authModule.verifyOtpToken;
  }
  app.use('/api/auth', authRouter);
  app.use('/api', authRouter); // Mount at /api for /api/send-otp, /api/verify-otp, etc.
} catch (e) {
  console.warn('Auth router not mounted:', e.message);
}

// Mount SMS Gateway router for Android device integration
try {
  const gatewayRouter = require('./gateway/routes/gatewayRoutes');
  app.use('/api/gateway', gatewayRouter);
} catch (e) {
  console.warn('Gateway router not mounted:', e.message);
}

// Basic health endpoint so platforms/load balancers can check liveness
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'node-backend', time: Date.now() });
});

// Quick CORS connectivity test
app.get('/api/auth/ping', (req, res) => {
  res.json({ ok: true, origin: req.headers.origin || null });
});

// ---------------- k-Anonymity & Breach Catalog API Layer ----------------
const path = require('path');
const fs = require('fs');
const { getRange, ingestBatch } = require('./ingest/kAnonymityStore');

const CATALOG_FILE = path.join(__dirname, 'data', 'catalog', 'breaches.json');
const CATALOG_INDEX_FILE = path.join(__dirname, 'data', 'catalog', 'breaches_index.json');

// 1. GET /api/v1/range/:prefix (k-Anonymity Zero-Knowledge Range Query)
app.get('/api/v1/range/:prefix', (req, res) => {
  try {
    const prefix = req.params.prefix;
    if (!prefix || !/^[0-9A-Fa-f]{5}$/.test(prefix)) {
      return res.status(400).json({ error: 'Prefix must be exactly a 5-character hexadecimal string.' });
    }
    const results = getRange(prefix);
    // Return standard formatted plaintext stream for HIBP compatibility or JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({ success: true, prefix: prefix.toUpperCase(), count: results.length, matches: results });
    }
    // Return line-delimited suffix text: SUFFIX:COUNT:SOURCES:CLASSES:YEAR
    const textStream = results.map(r => `${r.suffix}:${r.count}:${r.sources.join(',')}:${r.dataClasses.join(',')}:${r.year}`).join('\n');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(textStream);
  } catch (err) {
    console.error('Range query error:', err.message);
    res.status(500).json({ error: 'Failed to query hash range' });
  }
});

// 2. GET /api/v1/breaches (Full Catalog or Domain Filter)
app.get('/api/v1/breaches', (req, res) => {
  try {
    if (!fs.existsSync(CATALOG_FILE)) {
      return res.json({ success: true, count: 0, breaches: [] });
    }
    const catalog = JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf8') || '[]');
    const domainFilter = req.query.domain ? String(req.query.domain).toLowerCase() : null;
    const filtered = domainFilter ? catalog.filter(b => (b.domain || '').toLowerCase().includes(domainFilter)) : catalog;
    res.json({ success: true, count: filtered.length, breaches: filtered });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load breach catalog' });
  }
});

// 3. GET /api/v1/breaches/:name (Specific Breach Details)
app.get('/api/v1/breaches/:name', (req, res) => {
  try {
    if (!fs.existsSync(CATALOG_INDEX_FILE)) {
      return res.status(404).json({ error: 'Breach index not found' });
    }
    const index = JSON.parse(fs.readFileSync(CATALOG_INDEX_FILE, 'utf8') || '{}');
    const targetName = String(req.params.name).toLowerCase();
    const breach = index.byName ? index.byName[targetName] : null;
    if (!breach) {
      return res.status(404).json({ error: 'Breach record not found in catalog' });
    }
    res.json({ success: true, breach });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve breach detail' });
  }
});

// 4. POST /api/v1/ingest (Ingestion Node API)
app.post('/api/v1/ingest', (req, res) => {
  try {
    const { records = [] } = req.body || {};
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'records array is required' });
    }
    const result = ingestBatch(records);
    res.json({ success: true, ingested: result.ingested });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- Intelligence & Analytics Layer ----------------
const { analyzeExposure, redactSensitiveData } = require('./analytics/riskEngine');
const { parseBreachTimeline } = require('./analytics/timelineParser');

// Endpoint for OSINT search with analytics - STRICTLY GUARDED by verifyOtpToken middleware
app.post('/api/search', verifyOtpToken, async (req, res) => {
  const { query, searchType } = req.body || {};
  const { normalizeTarget, hashTarget, getRange, getStoredRecords } = require('./ingest/kAnonymityStore');

  const normalizedQuery = normalizeTarget(query);
  const verifiedTarget = normalizeTarget(req.verifiedUser?.target || req.verifiedUser?.email);

  if (!normalizedQuery || normalizedQuery !== verifiedTarget) {
    return res.status(403).json({
      error: 'You can only search the email/phone you verified.'
    });
  }

  try {
    let botText = '';
    let packets = [];
    let pagination = null;

    // Source 1: Local k-Anonymity & Document Store Check
    const targetHash = hashTarget(normalizedQuery);
    const prefix = targetHash.slice(0, 5);
    const suffix = targetHash.slice(5);
    const rangeMatches = getRange(prefix);
    const localMatch = rangeMatches.find(m => m.suffix === suffix);
    const storedRecords = getStoredRecords(normalizedQuery);

    // Source 2: Deep OSINT Threat Feed Service (Runs live search, then automatically stores to local database)
    const enableScraper = process.env.ENABLE_TELEGRAM_SCRAPER !== 'false';
    if (enableScraper) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        const resp = await fetch(PYTHON_SERVICE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: normalizedQuery }),
          signal: controller.signal
        });
        clearTimeout(timeout);
        const data = await resp.json();
        botText = data.response || '';
        packets = data.packets || (botText ? [{ query, info: botText }] : []);
        pagination = data.pagination || null;

        // Auto-Cache Live Found Breach directly to Local Database Store
        if (botText && !/no\s*results?(\s*found)?/i.test(botText)) {
          const { ingestRecord } = require('./ingest/kAnonymityStore');
          const exposureCheck = analyzeExposure(botText, normalizedQuery);
          const dataClasses = [];
          if (exposureCheck.entities.phoneCount > 0) dataClasses.push('PHONE');
          if (exposureCheck.entities.passwordCount > 0) dataClasses.push('PASSWORD_HASH');
          if (exposureCheck.entities.emailCount > 0) dataClasses.push('EMAIL');
          if (exposureCheck.entities.hasDocument) dataClasses.push('NATIONAL_ID');
          if (exposureCheck.entities.hasAddress) dataClasses.push('PHYSICAL_ADDRESS');

          ingestRecord(
            normalizedQuery,
            'Live_OSINT_Feed',
            dataClasses.length > 0 ? dataClasses : ['PHONE', 'IDENTITY'],
            new Date().getFullYear().toString(),
            {
              target: normalizedQuery,
              source: 'Live_OSINT_Feed',
              threat_details: botText,
              exposure_score: exposureCheck.score,
              threat_level: exposureCheck.riskLevel,
              discovered_at: new Date().toISOString()
            }
          );
          console.log(`[AUTO-INGEST] Real breach discovered on internet for ${normalizedQuery} -> Saved to local database!`);
        }
      } catch (scraperErr) {
        console.warn('[LIVE OSINT] Scraper offline or timed out; relying on local breach store:', scraperErr.message);
      }
    }

    // Merge Local Breach Intelligence if found with full genuine record breakdown
    if ((localMatch && localMatch.sources.length > 0) || storedRecords.length > 0) {
      const matchSources = localMatch ? localMatch.sources : storedRecords.map(r => r.source);
      const matchClasses = localMatch ? localMatch.dataClasses : Array.from(new Set(storedRecords.flatMap(r => r.dataClasses || [])));
      const matchYear = (localMatch && localMatch.year) || storedRecords[0]?.year || '2024';

      let breachDetails = `══════════════════════════════════════════════════════\n` +
        `[ BREACHSHIELD RAW INTELLIGENCE REPOSITORY ]\n` +
        `• Target Identifier: ${normalizedQuery}\n` +
        `• SHA-256 Fingerprint: ${targetHash}\n` +
        `• Partition Bucket: ${prefix}\n` +
        `• Compromised Records: ${Math.max(matchSources.length, storedRecords.length)}\n` +
        `• Exposed Data Classes: ${matchClasses.join(', ')}\n` +
        `══════════════════════════════════════════════════════\n\n`;

      if (storedRecords.length > 0) {
        storedRecords.forEach((rec, idx) => {
          breachDetails += `[ RECORD #${idx + 1} | SOURCE: ${String(rec.source || 'BREACH_ARCHIVE').toUpperCase()} (Year: ${rec.year || matchYear}) ]\n`;
          breachDetails += `• Target          : ${normalizedQuery}\n`;
          if (rec.fields && typeof rec.fields === 'object') {
            for (const [key, val] of Object.entries(rec.fields)) {
              if (val !== undefined && val !== null && val !== '') {
                const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                breachDetails += `• ${label.padEnd(16)}: ${val}\n`;
              }
            }
          }
          breachDetails += `\n`;
        });
      } else if (localMatch) {
        localMatch.sources.forEach((src, idx) => {
          breachDetails += `[ RECORD #${idx + 1} | SOURCE: ${src.toUpperCase()} (Year: ${localMatch.year}) ]\n`;
          breachDetails += `• Target Phone    : ${normalizedQuery}\n`;
          breachDetails += `• Exposed Classes : ${localMatch.dataClasses.join(', ')}\n`;
          breachDetails += `• Discovery Year  : ${localMatch.year}\n\n`;
        });
      }

      packets.unshift({ query, info: breachDetails.trim(), source: 'LOCAL_K_ANON_DB' });
    }

    if (packets.length === 0) {
      packets.push({ query, info: 'Scan complete. No public breach records detected in primary archives.' });
    }

    // Run Analytics & Timeline Parsers on combined multi-source text
    const fullText = packets.map(p => p.info || '').join('\n\n');
    const exposure = analyzeExposure(fullText, query);
    const timeline = parseBreachTimeline(fullText);

    // Sanitize and redact plaintext credentials before delivering to frontend
    const sanitizedPackets = packets.map(p => ({
      ...p,
      info: redactSensitiveData(p.info || '')
    }));

    res.json({
      success: true,
      data: {
        packets: sanitizedPackets,
        pagination,
        analytics: {
          exposure,
          timeline
        }
      }
    });
  } catch (err) {
    console.error('Search error:', err.message);
    // Return graceful baseline instead of breaking the UI
    const exposure = analyzeExposure('', query);
    const timeline = parseBreachTimeline('');
    res.json({
      success: true,
      data: {
        packets: [{ query, info: 'Scan complete. No public breach records detected in primary archives.' }],
        pagination: { current: 1, total: 1 },
        analytics: { exposure, timeline }
      }
    });
  }
});

// Endpoint for pagination - get next page from Telegram bot (guarded by verifyOtpToken)
app.post('/api/telegram-page', verifyOtpToken, async (req, res) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const resp = await fetch(PYTHON_SERVICE_URL.replace('/query', '/next-page'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (resp.status === 204) return res.status(200).json({ success: true, data: null });
    if (!resp.ok) {
      return res.status(500).json({ success: false, error: `Python service status ${resp.status}` });
    }
    const data = await resp.json();
    const botText = (data && data.response) || '';
    const packets = (data && data.packets) || (botText ? [{ info: botText }] : []);
    const pagination = (data && data.pagination) || null;
    const sanitizedPackets = packets.map(p => ({
      ...p,
      info: redactSensitiveData(p.info || '')
    }));
    res.json({ success: true, data: sanitizedPackets.length ? { packets: sanitizedPackets, pagination } : null });
  } catch (err) {
    console.error('Telegram page error:', err.message);
    res.status(500).json({ success: false, error: 'Server is down, try after sometime.' });
  }
});

// Endpoint for previous page - get previous page from Telegram bot (guarded by verifyOtpToken)
app.post('/api/telegram-prev-page', verifyOtpToken, async (req, res) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const resp = await fetch(PYTHON_SERVICE_URL.replace('/query', '/prev-page'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (resp.status === 204) return res.status(200).json({ success: true, data: null });
    if (!resp.ok) {
      return res.status(500).json({ success: false, error: `Python service status ${resp.status}` });
    }
    const data = await resp.json();
    const botText = (data && data.response) || '';
    const packets = (data && data.packets) || (botText ? [{ info: botText }] : []);
    const pagination = (data && data.pagination) || null;
    const sanitizedPackets = packets.map(p => ({
      ...p,
      info: redactSensitiveData(p.info || '')
    }));
    res.json({ success: true, data: sanitizedPackets.length ? { packets: sanitizedPackets, pagination } : null });
  } catch (err) {
    console.error('Telegram prev page error:', err.message);
    res.status(500).json({ success: false, error: 'Server is down, try after sometime.' });
  }
});

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Download endpoint: generates standalone HTML intelligence report
app.post('/api/download', verifyOtpToken, async (req, res) => {
  try {
    const { query = 'Target Record', content = 'No breach text provided' } = req.body || {};
    const safeQuery = escapeHtml(query);
    const safeContent = escapeHtml(content);

    const htmlReport = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OSINT Breach Intelligence Report - ${safeQuery}</title>
  <style>
    body { background: #070A13; color: #e2e8f0; font-family: 'Courier New', Courier, monospace; padding: 40px 20px; margin: 0; }
    .card { background: #0B0F19; border: 1px solid #00F3FF; border-radius: 12px; padding: 28px; max-width: 860px; margin: 0 auto; box-shadow: 0 0 30px rgba(0, 243, 255, 0.2); }
    h1 { color: #00F3FF; margin-top: 0; font-size: 24px; letter-spacing: 1px; }
    .badge { display: inline-block; background: #FF003C; color: #fff; padding: 4px 12px; border-radius: 4px; font-weight: bold; font-size: 12px; letter-spacing: 1px; }
    .meta-row { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin: 16px 0; font-size: 13px; color: #94a3b8; border-bottom: 1px solid rgba(0, 243, 255, 0.2); padding-bottom: 12px; }
    pre { background: #030712; padding: 20px; border-radius: 8px; color: #00FF66; white-space: pre-wrap; font-size: 13px; border: 1px solid rgba(0, 243, 255, 0.2); line-height: 1.6; overflow-x: auto; }
    .footer { margin-top: 24px; font-size: 11px; color: #64748b; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 14px; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
      <h1>[ OSINT THREAT INTELLIGENCE REPORT ]</h1>
      <span class="badge">CONFIRMED EXPOSURE</span>
    </div>
    <div class="meta-row">
      <div>Target: <strong style="color: #00F3FF;">${safeQuery}</strong></div>
      <div>Security Classification: <strong style="color: #FF003C;">CRITICAL THREAT</strong></div>
      <div>Generated: <strong>${new Date().toUTCString()}</strong></div>
    </div>
    <h3 style="color: #00F3FF; margin-top: 20px;">[ Extracted Intelligence Records ]</h3>
    <pre>${safeContent}</pre>
    <div class="footer">Generated by OSINT-BreachShield Intelligence Platform • Confidential • Zero-Knowledge Verified</div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Disposition', 'attachment; filename="breach_report.html"');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(htmlReport);
  } catch (err) {
    console.error('Download error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

const http = require('http');
const { setupGatewayWebSocket } = require('./gateway/gatewayWs');

const PORT = Number(process.env.PORT || 5000);
const server = http.createServer(app);

// Attach WebSocket server for Android Gateway Relay
setupGatewayWebSocket(server);

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`OSINT backend running on port ${PORT}`);
    console.log(`Gateway WebSocket relay active at ws://0.0.0.0:${PORT}/ws/gateway`);
    console.log('CORS allowed origins:', ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS.join(', ') : '(localhost:3000 default)');
  });
}

module.exports = { app, server };

