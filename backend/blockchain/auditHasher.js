const crypto = require('crypto');

/**
 * Normalizes a threat event object into a deterministic canonical JSON string and computes its SHA-256 hash.
 */
function createCanonicalJson(event) {
  if (!event || typeof event !== 'object') {
    return '{}';
  }
  const cleanEvent = {
    eventId: String(event.eventId || event.id || '').trim(),
    eventType: String(event.eventType || event.type || 'THREAT_DETECTED').trim(),
    query: String(event.query || '').trim(),
    riskScore: Number(event.riskScore ?? 0),
    riskLevel: String(event.riskLevel || 'LOW').trim(),
    sourceName: String(event.sourceName || 'OSINT_FEED').trim(),
    timestamp: String(event.timestamp ?? '2026-01-01T00:00:00.000Z').trim()
  };

  // Sort keys deterministically
  const sortedKeys = Object.keys(cleanEvent).sort();
  const orderedObj = {};
  for (const k of sortedKeys) {
    orderedObj[k] = cleanEvent[k];
  }
  return JSON.stringify(orderedObj);
}

function computeEventHash(event) {
  const canonical = createCanonicalJson(event);
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

module.exports = {
  createCanonicalJson,
  computeEventHash
};
