const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');
// Load .env if the module exists; don't crash if it's not installed in the environment
try { require('dotenv').config(); } catch (e) { console.warn('dotenv not found; continuing without .env'); }
const nodemailer = require('nodemailer');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Load credentials from environment when possible. Avoid committing secrets.
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '409411e66ccb00968523f446d30cded9';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '28444606'; // Replace with your chat ID or logic to get it
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
// Preflight is handled by cors() above; no explicit OPTIONS routes needed
app.use(cookieParser());
app.use(bodyParser.json());

// Crash guards to surface errors instead of silent exits
process.on('uncaughtException', (err) => { console.error('Uncaught exception:', err); });
process.on('unhandledRejection', (reason) => { console.error('Unhandled rejection:', reason); });

// Mount auth router
try {
  const authRouter = require('./auth/routes/auth');
  app.use('/api/auth', authRouter);
  // convenience alias for GET /api/me
  app.get('/api/me', authMiddleware, async (req, res) => {
    // delegate to auth router handler using a simple fetch to same process
    // to avoid duplicating DB code, we reuse the auth router module
    try {
      const { query } = require('./auth/db');
      const rows = await query('SELECT id, username, email, created_at FROM users WHERE id = ?', [req.userId]);
      if (!rows.length) return res.status(404).json({ error: 'Not found' });
      res.json({ user: rows[0] });
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });
} catch (e) {
  console.warn('Auth router not mounted:', e.message);
}

function authMiddleware(req, res, next) {
  try {
    const token = req.cookies?.token || (req.headers.authorization?.split(' ')[1]);
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.userId = decoded.uid;
    next();
  } catch (e) { return res.status(401).json({ error: 'Unauthorized' }); }
}

// Basic health endpoint so platforms/load balancers can check liveness
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'node-backend', time: Date.now() });
});

// Quick CORS connectivity test
app.get('/api/auth/ping', (req, res) => {
  res.json({ ok: true, origin: req.headers.origin || null });
});

// ---------------- Real-time Dark Web monitoring (SSE) ----------------
const WATCH_JSON_DIR = path.join(__dirname, 'instance');
const WATCH_JSON = path.join(WATCH_JSON_DIR, 'watchlist.json');
function readWatchlist() {
  try {
    if (!fs.existsSync(WATCH_JSON)) return {};
    const buf = fs.readFileSync(WATCH_JSON, 'utf8');
    return JSON.parse(buf || '{}');
  } catch { return {}; }
}
function writeWatchlist(obj) {
  try {
    if (!fs.existsSync(WATCH_JSON_DIR)) fs.mkdirSync(WATCH_JSON_DIR, { recursive: true });
    fs.writeFileSync(WATCH_JSON, JSON.stringify(obj, null, 2));
    return true;
  } catch { return false; }
}
const watchlist = new Map(); // userId -> Set(keywords)
// load from disk on boot
try {
  const raw = readWatchlist();
  for (const [uid, arr] of Object.entries(raw)) {
    watchlist.set(String(uid), new Set((arr || []).map(s => String(s))));
  }
} catch {}

app.post('/api/darkweb/subscribe', authMiddleware, (req, res) => {
  const { keywords } = req.body || {};
  if (!Array.isArray(keywords) || !keywords.length) return res.status(400).json({ success: false, error: 'Provide keywords[]' });
  const set = watchlist.get(String(req.userId)) || new Set();
  keywords.forEach(k => { if (k) set.add(String(k).trim()); });
  watchlist.set(String(req.userId), set);
  // persist
  const obj = {}; for (const [k, v] of watchlist) obj[k] = Array.from(v);
  writeWatchlist(obj);
  res.json({ success: true, watchlist: Array.from(set) });
});

app.get('/api/darkweb/watchlist', authMiddleware, (req, res) => {
  const set = watchlist.get(String(req.userId)) || new Set();
  res.json({ success: true, watchlist: Array.from(set) });
});

// SSE stream per user connection; emits heartbeat and simulated alerts
app.get('/api/darkweb/stream', authMiddleware, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
  const uid = String(req.userId);

  const send = (event, data) => {
    try {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (_) {}
  };
  // initial state
  send('hello', { ok: true, watchlist: Array.from(watchlist.get(uid) || []) });
  // heartbeat every 20s
  const hb = setInterval(() => send('heartbeat', { t: Date.now() }), 20_000);
  // simulated alert generator every 35s
  const tick = setInterval(() => {
    const list = Array.from(watchlist.get(uid) || []);
    if (!list.length) return;
    const kw = list[Math.floor(Math.random() * list.length)];
    const sample = {
      id: crypto.randomBytes(6).toString('hex'),
      keyword: kw,
      source: ['Forum','Market','Paste','Leak site'][Math.floor(Math.random()*4)],
      risk: ['low','medium','high','critical'][Math.floor(Math.random()*4)],
      snippet: `Possible mention of "${kw}" on onion service—review details`,
      ts: Date.now(),
      url: 'darkweb://hidden-service',
    };
    send('alert', sample);
  }, 35_000);
  req.on('close', () => { clearInterval(hb); clearInterval(tick); try { res.end(); } catch (_) {} });
});

// ---------------- OTP email setup ----------------
// Minimal mail transport. Prefer environment variables when deploying.
// Supported options:
// 1) SMTP_URL="smtp://user:pass@host:port"
// 2) Gmail service via GMAIL_USER and GMAIL_APP_PASSWORD (recommended app password)
let mailTransport;
try {
  if (process.env.SMTP_URL) {
    mailTransport = nodemailer.createTransport(process.env.SMTP_URL);
  } else if (process.env.SMTP_HOST && process.env.SMTP_USER && (process.env.SMTP_PASS || process.env.SMTP_PASSWORD)) {
    // Support explicit SMTP config (e.g., Brevo)
    mailTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false, // Brevo uses STARTTLS on 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD
      }
    });
  } else {
    // Fallback to Gmail. Requires an app password.
    const user = process.env.GMAIL_USER || 'phishbreachguardians@gmail.com';
    const pass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS;
    if (!pass) {
      console.warn('Email transport not configured: missing GMAIL_APP_PASSWORD/GMAIL_PASS. Set it in osint-backend/.env');
      mailTransport = null;
    } else {
      mailTransport = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass }
      });
    }
  }
} catch (e) {
  console.warn('Email transport init failed:', e.message);
}

// Ephemeral in-memory stores (reset on server restart)
const otpStore = new Map(); // otpId => { email, codeHash, expiresAt, tries, used }
const tokenStore = new Map(); // token => { email, expiresAt }

const now = () => Date.now();
const hash = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const isEmail = (s = '') => /.+@.+\..+/.test(String(s));
const genId = (size = 16) => crypto.randomBytes(size).toString('hex');

// Basic sweeping cleanup to avoid unbounded memory if the service runs long.
setInterval(() => {
  const t = now();
  for (const [id, rec] of otpStore) {
    if (!rec || rec.expiresAt <= t || rec.used) otpStore.delete(id);
  }
  for (const [tok, rec] of tokenStore) {
    if (!rec || rec.expiresAt <= t) tokenStore.delete(tok);
  }
}, 60_000).unref?.();

// Send OTP to a user email
app.post('/api/send-otp', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!isEmail(email)) return res.status(400).json({ success: false, error: 'Provide a valid email.' });

    // generate a 6-digit numeric OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const otpId = genId(12);
    const expiresAt = now() + 5 * 60 * 1000; // 5 minutes
    otpStore.set(otpId, { email: String(email).toLowerCase(), codeHash: hash(code), expiresAt, tries: 0, used: false });

    if (!mailTransport) {
      return res.status(500).json({ success: false, error: 'Email service not configured on server.' });
    }

  const fromName = process.env.MAIL_FROM_NAME || 'PhishBreach Guardians';
  const fromEmail = process.env.MAIL_FROM_EMAIL || 'phishbreachguardians@gmail.com';
  const fromAddr = process.env.MAIL_FROM || `${fromName} <${fromEmail}>`;
    const info = await mailTransport.sendMail({
      from: fromAddr,
      to: email,
      subject: 'Your verification code (OTP)',
      text: `Your OTP is ${code}. It expires in 5 minutes.\n\nRequested for OSINT email search.`,
      html: `<p>Your OTP is <b style="font-size:18px;">${code}</b>. It expires in <b>5 minutes</b>.</p><p>Requested for OSINT email search.</p>`
    });

    res.json({ success: true, otpId, expiresInSec: 300, messageId: info?.messageId });
  } catch (err) {
    console.error('send-otp error:', err.message);
    // Provide clearer guidance for common cases
    const msg = /Invalid login|Missing credentials/i.test(err.message)
      ? 'Email credentials are invalid or missing. Use a Gmail App Password in osint-backend/.env.'
      : 'Failed to send OTP. Try again later.';
    res.status(500).json({ success: false, error: msg });
  }
});

// Verify OTP and issue a short-lived token to authorize email searches
app.post('/api/verify-otp', (req, res) => {
  try {
    const { otpId, email, code } = req.body || {};
    if (!otpId || !isEmail(email) || !code) {
      return res.status(400).json({ success: false, error: 'Missing fields.' });
    }
    const rec = otpStore.get(otpId);
    if (!rec) return res.status(400).json({ success: false, error: 'Invalid or expired OTP request.' });
    if (rec.used) return res.status(400).json({ success: false, error: 'OTP already used.' });
    if (rec.expiresAt < now()) {
      otpStore.delete(otpId);
      return res.status(400).json({ success: false, error: 'OTP expired.' });
    }
    if (String(rec.email) !== String(email).toLowerCase()) {
      return res.status(400).json({ success: false, error: 'Email does not match request.' });
    }
    rec.tries += 1;
    if (rec.tries > 6) {
      otpStore.delete(otpId);
      return res.status(429).json({ success: false, error: 'Too many attempts. Request new OTP.' });
    }
    if (hash(String(code)) !== rec.codeHash) {
      return res.status(401).json({ success: false, error: 'Incorrect code.' });
    }
    rec.used = true;
    const token = 'otp_' + genId(24);
    tokenStore.set(token, { email: rec.email, expiresAt: now() + 30 * 60 * 1000 }); // 30 minutes
    res.json({ success: true, token, expiresInSec: 1800 });
  } catch (err) {
    console.error('verify-otp error:', err.message);
    res.status(500).json({ success: false, error: 'Verification failed.' });
  }
});

// Helper to send message to Telegram bot
async function sendTelegramMessage(message) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  return axios.post(url, {
    chat_id: TELEGRAM_CHAT_ID,
    text: message
  });
}

// Example endpoint for OSINT search
app.post('/api/search', async (req, res) => {
  const { exec } = require('child_process');
  const { query, searchType } = req.body || {};
  try {
  // OTP requirement disabled: allow email searches without OTP verification
  // Forward the query to the Python service that interacts with Telegram
  const resp = await axios.post(PYTHON_SERVICE_URL, { query });
  // Support both legacy 'response' and newer 'packets' payloads
  const botText = resp.data.response || '';
  const packets = resp.data.packets || (botText ? [{ query, info: botText }] : []);
  const pagination = resp.data.pagination || null;
  res.json({ success: true, data: { packets, pagination } });
  } catch (err) {
    console.error('Search error:', err.message);
    // Always send user-friendly message regardless of the technical error
    const errorMessage = 'Server is down, try after sometime.';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// Endpoint for pagination - get next page from Telegram bot
app.post('/api/telegram-page', async (req, res) => {
  try {
    console.log('Requesting next page from Python service...');
    // Forward the next page request to the Python service
    const resp = await axios.post(PYTHON_SERVICE_URL.replace('/query', '/next-page'), {}, { validateStatus: () => true });
    if (resp.status === 204) {
      // No more pages
      return res.status(200).json({ success: true, data: null });
    }
    if (resp.status < 200 || resp.status >= 300) {
      return res.status(500).json({ success: false, error: `Python service status ${resp.status}` });
    }
    console.log('Python service response:', resp.data);
  const botText = (resp.data && resp.data.response) || '';
  const packets = (resp.data && resp.data.packets) || (botText ? [{ info: botText }] : []);
  const pagination = (resp.data && resp.data.pagination) || null;
  res.json({ success: true, data: packets.length ? { packets, pagination } : null });
  } catch (err) {
    console.error('Telegram page error:', err.message);
    res.status(500).json({ success: false, error: 'Server is down, try after sometime.' });
  }
});

// Endpoint for previous page - get previous page from Telegram bot
app.post('/api/telegram-prev-page', async (req, res) => {
  try {
    console.log('Requesting previous page from Python service...');
    // Forward the previous page request to the Python service
    const resp = await axios.post(PYTHON_SERVICE_URL.replace('/query', '/prev-page'), {}, { validateStatus: () => true });
    if (resp.status === 204) {
      return res.status(200).json({ success: true, data: null });
    }
    if (resp.status < 200 || resp.status >= 300) {
      return res.status(500).json({ success: false, error: `Python service status ${resp.status}` });
    }
    console.log('Python service response:', resp.data);
  const botText = (resp.data && resp.data.response) || '';
  const packets = (resp.data && resp.data.packets) || (botText ? [{ info: botText }] : []);
  const pagination = (resp.data && resp.data.pagination) || null;
  res.json({ success: true, data: packets.length ? { packets, pagination } : null });
  } catch (err) {
    console.error('Telegram prev page error:', err.message);
    res.status(500).json({ success: false, error: 'Server is down, try after sometime.' });
  }
});

// Download endpoint: ask Python to click "Download" and stream the file back
app.post('/api/download', async (req, res) => {
  try {
    const url = `${PYTHON_BASE}/download`;
    const resp = await axios.post(url, {}, { responseType: 'arraybuffer', validateStatus: () => true });
    if (resp.status < 200 || resp.status >= 300) {
      return res.status(resp.status).json({ success: false, error: Buffer.from(resp.data || '').toString('utf8') || 'Download failed' });
    }
    // Propagate headers for filename and content-type
    if (resp.headers['content-disposition']) {
      res.setHeader('Content-Disposition', resp.headers['content-disposition']);
    } else {
      res.setHeader('Content-Disposition', 'attachment; filename="result.html"');
    }
    res.setHeader('Content-Type', resp.headers['content-type'] || 'application/octet-stream');
    res.send(Buffer.from(resp.data));
  } catch (err) {
    console.error('Download proxy error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});
const PORT = Number(process.env.PORT || 5000);
app.listen(PORT, () => {
  console.log(`OSINT backend running on port ${PORT}`);
  console.log('CORS allowed origins:', ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS.join(', ') : '(localhost:3000 default)');
});

