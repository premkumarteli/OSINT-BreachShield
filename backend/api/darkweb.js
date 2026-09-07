/**
 * @file api/darkweb.js
 * @description Dark web monitoring routes: watchlist management and SSE alert stream.
 */

const express = require('express');
const { verifyOtpToken } = require('../middleware/authGuard');

const router = express.Router();

// In-memory watchlist and alert storage (prototype)
const watchlist = new Map();
const alertClients = new Set();
const alerts = [];

// ---------------- GET /api/darkweb/watchlist ----------------
router.get('/watchlist', verifyOtpToken, (req, res) => {
  const user = req.verifiedUser?.email || 'default';
  const items = Array.from(watchlist.get(user) || []);
  res.json({ watchlist: items });
});

// ---------------- POST /api/darkweb/watchlist ----------------
router.post('/watchlist', verifyOtpToken, (req, res) => {
  const user = req.verifiedUser?.email || 'default';
  const { keyword } = req.body || {};
  if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
    return res.status(400).json({ error: 'Keyword is required' });
  }
  const trimmed = keyword.trim().toLowerCase();
  if (!watchlist.has(user)) watchlist.set(user, new Set());
  const userWatch = watchlist.get(user);
  if (userWatch.has(trimmed)) {
    return res.status(409).json({ error: 'Keyword already in watchlist' });
  }
  userWatch.add(trimmed);
  // Broadcast hello event to all connected SSE clients
  const data = JSON.stringify({ watchlist: Array.from(userWatch) });
  for (const client of alertClients) {
    try { client.write(`event: hello\ndata: ${data}\n\n`); } catch (_) {}
  }
  res.json({ success: true, watchlist: Array.from(userWatch) });
});

// ---------------- DELETE /api/darkweb/watchlist/:keyword ----------------
router.delete('/watchlist/:keyword', verifyOtpToken, (req, res) => {
  const user = req.verifiedUser?.email || 'default';
  const keyword = (req.params.keyword || '').trim().toLowerCase();
  const userWatch = watchlist.get(user);
  if (userWatch) userWatch.delete(keyword);
  res.json({ success: true, watchlist: Array.from(userWatch || []) });
});

// ---------------- GET /api/darkweb/stream (SSE) ----------------
router.get('/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.flushHeaders();

  // Send hello with current watchlist
  const user = req.query?.email || 'default';
  const items = Array.from(watchlist.get(user) || []);
  res.write(`event: hello\ndata: ${JSON.stringify({ watchlist: items })}\n\n`);

  alertClients.add(res);

  // Heartbeat every 30s
  const heartbeat = setInterval(() => {
    try { res.write(`event: heartbeat\ndata: {}\n\n`); } catch (_) {}
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    alertClients.delete(res);
  });
});

// ---------------- Helper: broadcast alert ----------------
function broadcastAlert(alert) {
  alerts.unshift(alert);
  if (alerts.length > 50) alerts.length = 50;
  const data = JSON.stringify(alert);
  for (const client of alertClients) {
    try { client.write(`event: alert\ndata: ${data}\n\n`); } catch (_) {}
  }
}

module.exports = router;
module.exports.broadcastAlert = broadcastAlert;
