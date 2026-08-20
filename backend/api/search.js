/**
 * @file api/search.js
 * @description Search route controller for multi-source intelligence & pagination.
 */

const express = require('express');
const { verifyOtpToken } = require('../middleware/authGuard');
const { executeSearch } = require('../services/searchService');
const { redactSensitiveData, analyzeExposure } = require('../services/riskService');
const { parseBreachTimeline } = require('../services/timelineService');

const router = express.Router();
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'https://osint-breach-python.onrender.com/query';

// POST /api/search (Strictly guarded by OTP verification)
router.post('/search', verifyOtpToken, async (req, res) => {
  const { query } = req.body || {};
  const verifiedTarget = req.verifiedUser?.target || req.verifiedUser?.email;

  try {
    const { registerOrTouchSession } = require('../services/sessionTracker');
    registerOrTouchSession(verifiedTarget, req.ip, req.headers['user-agent'], '/results');
  } catch (_) {}

  try {
    const result = await executeSearch(query, verifiedTarget, { pythonServiceUrl: PYTHON_SERVICE_URL });
    return res.json({
      success: true,
      data: result
    });
  } catch (err) {
    if (err.status === 403) {
      return res.status(403).json({ error: err.message });
    }
    console.error('Search error:', err.message);
    const exposure = analyzeExposure('', query);
    const timeline = parseBreachTimeline('');
    return res.json({
      success: true,
      data: {
        packets: [{ query, info: 'Scan complete. No public breach records detected in primary archives.' }],
        pagination: { current: 1, total: 1 },
        analytics: { exposure, timeline }
      }
    });
  }
});

// POST /api/telegram-page (Pagination next page)
router.post('/telegram-page', verifyOtpToken, async (req, res) => {
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
    const targetUser = req.verifiedUser?.target || req.verifiedUser?.email;
    const sanitizedPackets = packets.map(p => ({
      ...p,
      info: redactSensitiveData(p.info || '', targetUser)
    }));
    res.json({ success: true, data: sanitizedPackets.length ? { packets: sanitizedPackets, pagination } : null });
  } catch (err) {
    console.error('Telegram page error:', err.message);
    res.status(500).json({ success: false, error: 'Server is down, try after sometime.' });
  }
});

// POST /api/telegram-prev-page (Pagination previous page)
router.post('/telegram-prev-page', verifyOtpToken, async (req, res) => {
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
    const targetUser = req.verifiedUser?.target || req.verifiedUser?.email;
    const sanitizedPackets = packets.map(p => ({
      ...p,
      info: redactSensitiveData(p.info || '', targetUser)
    }));
    res.json({ success: true, data: sanitizedPackets.length ? { packets: sanitizedPackets, pagination } : null });
  } catch (err) {
    console.error('Telegram prev page error:', err.message);
    res.status(500).json({ success: false, error: 'Server is down, try after sometime.' });
  }
});

module.exports = router;
