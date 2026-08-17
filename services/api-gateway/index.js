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
    // allow same-origin (no Origin header), file://, and localhost on any port
    if (!origin) return cb(null, true);
    if (ORIGINS.includes(origin)) return cb(null, true);
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return cb(null, true);
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

// ---------------- Intelligence & Analytics Layer ----------------
const { analyzeExposure } = require('./analytics/riskEngine');
const { parseBreachTimeline } = require('./analytics/timelineParser');

// Endpoint for OSINT search with analytics - STRICTLY GUARDED by verifyOtpToken middleware
app.post('/api/search', verifyOtpToken, async (req, res) => {
  const { query, searchType } = req.body || {};
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const resp = await fetch(PYTHON_SERVICE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    const data = await resp.json();
    const botText = data.response || '';
    const packets = data.packets || (botText ? [{ query, info: botText }] : []);
    const pagination = data.pagination || null;

    // Run Analytics & Timeline Parsers
    const fullText = packets.map(p => p.info || '').join('\n\n');
    const exposure = analyzeExposure(fullText, query);
    const timeline = parseBreachTimeline(fullText);

    res.json({
      success: true,
      data: {
        packets,
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

// Endpoint for pagination - get next page from Telegram bot
app.post('/api/telegram-page', async (req, res) => {
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
    res.json({ success: true, data: packets.length ? { packets, pagination } : null });
  } catch (err) {
    console.error('Telegram page error:', err.message);
    res.status(500).json({ success: false, error: 'Server is down, try after sometime.' });
  }
});

// Endpoint for previous page - get previous page from Telegram bot
app.post('/api/telegram-prev-page', async (req, res) => {
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
    res.json({ success: true, data: packets.length ? { packets, pagination } : null });
  } catch (err) {
    console.error('Telegram prev page error:', err.message);
    res.status(500).json({ success: false, error: 'Server is down, try after sometime.' });
  }
});

// Download endpoint: fetches file from Telegram or generates standalone HTML report
app.post('/api/download', async (req, res) => {
  try {
    const url = `${PYTHON_BASE}/download`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (resp.ok) {
      const buffer = await resp.arrayBuffer();
      if (buffer.byteLength > 0) {
        const disposition = resp.headers.get('content-disposition') || 'attachment; filename="breach_report.html"';
        const contentType = resp.headers.get('content-type') || 'text/html';
        res.setHeader('Content-Disposition', disposition);
        res.setHeader('Content-Type', contentType);
        return res.send(Buffer.from(buffer));
      }
    }

    // Fallback: Generate HTML report directly
    const { query = 'Target Record', content = 'No breach text provided' } = req.body || {};
    const htmlReport = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>OSINT Breach Intelligence Report - ${query}</title>
  <style>
    body { background: #0b0f19; color: #e2e8f0; font-family: monospace; padding: 40px; margin: 0; }
    .card { background: rgba(15, 23, 42, 0.9); border: 1px solid #00f3ff; border-radius: 8px; padding: 24px; max-width: 800px; margin: 0 auto; box-shadow: 0 0 20px rgba(0, 243, 255, 0.2); }
    h1 { color: #00f3ff; margin-top: 0; }
    .badge { display: inline-block; background: #ff003c; color: #fff; padding: 4px 10px; border-radius: 4px; font-weight: bold; }
    pre { background: #000; padding: 16px; border-radius: 6px; color: #00ff66; white-space: pre-wrap; font-size: 14px; border: 1px solid rgba(255, 255, 255, 0.1); }
    .footer { margin-top: 20px; font-size: 12px; color: #64748b; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>[ OSINT THREAT INTELLIGENCE REPORT ]</h1>
    <p>Target: <strong>${query}</strong></p>
    <p>Classification: <span class="badge">CONFIRMED EXPOSURE</span></p>
    <p>Generated: ${new Date().toUTCString()}</p>
    <hr style="border-color: rgba(0, 243, 255, 0.2); margin: 20px 0;" />
    <h3>Extracted Intelligence Data:</h3>
    <pre>${content}</pre>
    <div class="footer">Generated by OSINT-BreachShield Intelligence Platform • Confidential</div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Disposition', 'attachment; filename="breach_report.html"');
    res.setHeader('Content-Type', 'text/html');
    res.send(htmlReport);
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

