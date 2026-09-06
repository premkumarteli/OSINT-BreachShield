const express = require('express');
const router = express.Router();
const { verifyOtpToken } = require('../auth/routes/auth');
const { requireAdminToken } = require('../middleware/authGuard');
const { query } = require('../auth/db');
const { logThreatEvent } = require('../blockchain/auditLogger');
const { verifyThreatEvent } = require('../blockchain/verificationService');
const { getEnabledSources } = require('../sources/registry');
const fetch = require('node-fetch');

// Allowed fields for audit event logging — matches what auditHasher.createCanonicalJson uses
const ALLOWED_AUDIT_FIELDS = new Set([
  'eventId', 'eventType', 'query', 'riskScore', 'riskLevel', 'sourceName'
]);

function validateAuditEvent(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, error: 'Request body must be a JSON object' };
  }
  const rejected = Object.keys(body).filter(k => !ALLOWED_AUDIT_FIELDS.has(k));
  if (rejected.length > 0) {
    return { valid: false, error: `Unexpected fields: ${rejected.join(', ')}` };
  }
  if (body.eventId !== undefined && typeof body.eventId !== 'string') {
    return { valid: false, error: 'eventId must be a string' };
  }
  if (body.eventType !== undefined && typeof body.eventType !== 'string') {
    return { valid: false, error: 'eventType must be a string' };
  }
  if (body.query !== undefined && typeof body.query !== 'string') {
    return { valid: false, error: 'query must be a string' };
  }
  if (body.riskScore !== undefined && typeof body.riskScore !== 'number') {
    return { valid: false, error: 'riskScore must be a number' };
  }
  if (body.riskLevel !== undefined && typeof body.riskLevel !== 'string') {
    return { valid: false, error: 'riskLevel must be a string' };
  }
  if (body.sourceName !== undefined && typeof body.sourceName !== 'string') {
    return { valid: false, error: 'sourceName must be a string' };
  }
  return { valid: true, sanitized: body };
}

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
router.post('/ai/ai/correlate', verifyOtpToken, async (req, res) => {
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

// 4. GET /api/sources (Active Multi-Source OSINT Registry)
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

// 5. POST /api/audit/log & /api/blockchain/log (Log Threat Audit Event to SHA-256 Hash Chain)
// Admin-only: no frontend or user-facing code calls these routes.
// Actual audit logging happens internally via searchService.js calling logThreatEvent() directly.
async function handleLogAuditEvent(req, res) {
  try {
    const validation = validateAuditEvent(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    const auditRecord = await logThreatEvent(validation.sanitized);
    res.json({
      success: true,
      auditRecord,
      anchorStatus: auditRecord.anchorStatus || 'pending'
    });
  } catch (err) {
    res.status(500).json({ error: 'Audit event logging failed', message: err.message });
  }
}
router.post('/audit/log', requireAdminToken, handleLogAuditEvent);
router.post('/blockchain/log', requireAdminToken, handleLogAuditEvent);

// 6. GET & POST /api/audit/verify/:eventId & /api/blockchain/verify/:eventId
// Public/auditable verification endpoint: compares stored canonical event against logged SHA-256 hash
async function handleVerifyAuditEvent(req, res) {
  try {
    const { eventId } = req.params;
    const eventOverride = req.body?.currentEventData || req.body?.eventData || null;
    const verification = await verifyThreatEvent(eventId, eventOverride);
    
    // Add deployment status header for transparency
    res.set('X-Deployment-Status', 'NOT_DEPLOYED_XGBOOST');
    res.set('X-Model-Warning', 'Breach severity model not integrated — insufficient feature coverage');
    
    res.json(verification);
  } catch (err) {
    res.status(500).json({ error: 'Audit verification failed', message: err.message });
  }
}
router.get('/audit/verify/:eventId', handleVerifyAuditEvent);
router.post('/audit/verify/:eventId', handleVerifyAuditEvent);
router.get('/blockchain/verify/:eventId', handleVerifyAuditEvent);
router.post('/blockchain/verify/:eventId', handleVerifyAuditEvent);

module.exports = router;