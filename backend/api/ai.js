const express = require('express');
const router = express.Router();
const { verifyOtpToken } = require('../auth/routes/auth');
const { query } = require('../auth/db');
const { logThreatEvent } = require('../blockchain/auditLogger');
const { verifyThreatEvent } = require('../blockchain/verificationService');
const { getEnabledSources } = require('../sources/registry');
const fetch = require('node-fetch');

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8001';

// 1. POST /api/ai/analyze-url
router.post('/ai/analyze-url', verifyOtpToken, async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ error: 'URL parameter required' });

    const resp = await fetch(`${PYTHON_SERVICE_URL}/api/ai/analyze-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const data = await resp.json();

    // Log analysis in DB
    try {
      await query(`
        INSERT INTO phishing_analysis (url, classification, confidence, model_name, model_version, inference_latency_ms)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [url, data.classification || 'UNKNOWN', data.confidence || 0, data.model || 'Unknown', data.model_version || '1.0', data.inference_latency_ms || 0]);
    } catch (_) {}

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'URL analysis failed', message: err.message });
  }
});

// 2. POST /api/ai/analyze-threat
router.post('/ai/analyze-threat', verifyOtpToken, async (req, res) => {
  try {
    const { text, query: targetQuery } = req.body || {};
    const resp = await fetch(`${PYTHON_SERVICE_URL}/api/ai/analyze-threat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text || '', query: targetQuery || '' })
    });
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Threat analysis failed', message: err.message });
  }
});

// 3. POST /api/ai/correlate
router.post('/api/ai/correlate', verifyOtpToken, async (req, res) => {
  try {
    const { record_a, record_b } = req.body || {};
    const resp = await fetch(`${PYTHON_SERVICE_URL}/api/ai/correlate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ record_a: record_a || {}, record_b: record_b || {} })
    });
    const data = await resp.json();

    // Log correlation in DB
    try {
      await query(`
        INSERT INTO entity_correlations (record_a, record_b, matched_fields, similarity_score, correlation_confidence, correlation_level)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        String(data.record_a_summary || '').substring(0, 255),
        String(data.record_b_summary || '').substring(0, 255),
        (data.matched_fields || []).join(', '),
        data.semantic_similarity || 0,
        data.confidence || 0,
        data.correlation_level || 'UNRELATED'
      ]);
    } catch (_) {}

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Entity correlation failed', message: err.message });
  }
});

// 4. GET /api/ai/eval-benchmark (CNN vs RNN vs Transformer)
router.get('/ai/eval-benchmark', verifyOtpToken, async (req, res) => {
  try {
    const resp = await fetch(`${PYTHON_SERVICE_URL}/api/ai/eval-benchmark`);
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Benchmark evaluation failed', message: err.message });
  }
});

// 5. GET /api/sources (Active Multi-Source OSINT Registry)
router.get('/sources', verifyOtpToken, (req, res) => {
  const sources = getEnabledSources();
  const summary = sources.map(s => ({
    sourceName: s.sourceName,
    sourceType: s.sourceName.includes('Telegram') ? 'TELEGRAM' : (s.sourceName.includes('Phishing') ? 'PHISHING_FEED' : (s.sourceName.includes('Catalog') ? 'BREACH_CATALOG' : 'THREAT_INTEL')),
    isActive: true,
    description: s.sourceName
  }));
  res.json({ count: summary.length, sources: summary });
});

// 6. POST /api/blockchain/log (Log Threat Audit Event to Blockchain)
router.post('/blockchain/log', verifyOtpToken, async (req, res) => {
  try {
    const event = req.body || {};
    const auditRecord = await logThreatEvent(event);
    res.json({ success: true, auditRecord });
  } catch (err) {
    res.status(500).json({ error: 'Blockchain logging failed', message: err.message });
  }
});

// 7. GET /api/blockchain/verify/:eventId
router.get('/blockchain/verify/:eventId', verifyOtpToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const verification = await verifyThreatEvent(eventId, req.body?.currentEventData);
    res.json(verification);
  } catch (err) {
    res.status(500).json({ error: 'Blockchain verification failed', message: err.message });
  }
});

module.exports = router;
