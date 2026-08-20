/**
 * @file server.js
 * @description Modern, modular Express bootstrap mounting all sub-routers.
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Load environment configurations
try {
  const rootEnv = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(rootEnv)) {
    require('dotenv').config({ path: rootEnv });
  } else {
    require('dotenv').config();
  }
} catch (e) {
  console.warn('dotenv not found; continuing without .env');
}

const app = express();

// CORS with credentials for auth cookie
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://osint-search-y2fx.onrender.com';
const ALLOWED_ORIGINS = FRONTEND_URL.split(',').map(s => s.trim()).filter(Boolean);
const ORIGINS = ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (ORIGINS.includes(origin)) return cb(null, true);
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

// Global Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Crash guards
process.on('uncaughtException', (err) => { console.error('Uncaught exception:', err); });
process.on('unhandledRejection', (reason) => { console.error('Unhandled rejection:', reason); });

// Mount Clean API Sub-Routers
const authRouter = require('./api/auth');
const searchRouter = require('./api/search');
const ingestRouter = require('./api/ingest');
const reportRouter = require('./api/report');
const gatewayRouter = require('./api/gateway');
const adminRouter = require('./api/admin');
const { touchHeartbeat } = require('./services/sessionTracker');

app.use('/api/auth', authRouter);
app.use('/api', authRouter); // Supports legacy /api/send-otp, /api/verify-otp
app.use('/api', searchRouter); // Mounts /api/search, /api/telegram-page
app.use('/api/v1', ingestRouter); // Mounts /api/v1/range, /api/v1/breaches, /api/v1/ingest
app.use('/api', reportRouter); // Mounts /api/download
app.use('/api/gateway', gatewayRouter); // Mounts /api/gateway/register
app.use('/api/admin', adminRouter); // Mounts BreachShield Admin Control API

// Website User Session Heartbeat
app.post('/api/session/heartbeat', (req, res) => {
  const { sessionId, currentPage } = req.body || {};
  const updated = touchHeartbeat(sessionId, currentPage);
  res.json({ success: true, active: Boolean(updated) });
});

// Health and Diagnostics Endpoints
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'node-backend', time: Date.now() });
});

app.get('/api/auth/ping', (req, res) => {
  res.json({ ok: true, origin: req.headers.origin || null });
});

// WebSocket Server for Android Gateway Relay
const { setupGatewayWebSocket } = require('./gateway/gatewayWs');
const server = http.createServer(app);
setupGatewayWebSocket(server);

const PORT = Number(process.env.PORT || 5000);

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`OSINT backend running on port ${PORT}`);
    console.log(`Gateway WebSocket relay active at ws://0.0.0.0:${PORT}/ws/gateway`);
    console.log('Auto-ingest stores breach metadata only; raw threat data is never persisted to disk.');
    console.log('CORS allowed origins:', ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS.join(', ') : '(localhost:3000 default)');
  });
}

module.exports = { app, server };
