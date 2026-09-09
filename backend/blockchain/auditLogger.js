const { computeEventHash, createCanonicalJson } = require('./auditHasher');
const { query } = require('../auth/db');
const fs = require('fs');
const path = require('path');
const { enqueueLeaf } = require('./merkleBatcher');

const INSTANCE_DIR = path.join(__dirname, '../../instance');
const AUDIT_LOGS_JSON = path.join(INSTANCE_DIR, 'blockchain_audit_logs.json');

// In-memory ledger for fast local lookups and test modifications
const memoryAuditLedger = new Map();

function readJsonLogs() {
  try {
    if (!fs.existsSync(AUDIT_LOGS_JSON)) return [];
    return JSON.parse(fs.readFileSync(AUDIT_LOGS_JSON, 'utf8') || '[]');
  } catch {
    // Quarantine corrupt file instead of silently losing data
    try {
      if (fs.existsSync(AUDIT_LOGS_JSON)) {
        const backup = AUDIT_LOGS_JSON + '.corrupt.' + Date.now();
        fs.copyFileSync(AUDIT_LOGS_JSON, backup);
        console.error(`[AUDIT LOGGER] Corrupt JSON quarantined to: ${backup}`);
      }
    } catch (_) {}
    return [];
  }
}

function writeJsonLogs(data) {
  try {
    if (!fs.existsSync(INSTANCE_DIR)) fs.mkdirSync(INSTANCE_DIR, { recursive: true });
    fs.writeFileSync(AUDIT_LOGS_JSON, JSON.stringify(data, null, 2));
    return true;
  } catch {
    return false;
  }
}

/**
 * Logs a threat event to the tamper-evident SHA-256 audit ledger.
 */
async function logThreatEvent(event) {
  const now = Date.now();
  const eventId = String(event.eventId || event.id || `evt_${now}_${crypto.randomBytes(4).toString('hex')}`);
  const eventType = String(event.eventType || event.type || 'THREAT_DETECTED');
  
  const eventPayload = { ...event, eventId, eventType };
  const canonicalJson = createCanonicalJson(eventPayload);
  const canonicalHash = computeEventHash(eventPayload);

  const auditRecord = {
    eventId,
    eventType,
    timestamp: now,
    canonicalHash,
    eventHash: canonicalHash,
    verificationStatus: 'VALID',
    createdAt: new Date(now).toISOString(),
    eventData: eventPayload,
    canonicalJson,
    merkleProof: null,
    merkleRoot: null,
    anchorTxHash: null,
    anchorBlockNumber: null,
    anchorNetwork: null,
    anchoredAt: null,
    anchorStatus: 'pending'
  };

  // Enqueue for Merkle batching and anchoring (before persistence so anchorStatus is recorded)
  try {
    await enqueueLeaf({
      eventId,
      canonicalHash,
      timestamp: now
    });
    auditRecord.anchorStatus = 'enqueued';
  } catch (err) {
    auditRecord.anchorStatus = 'enqueue_failed';
    console.warn('[AUDIT LOGGER] Failed to enqueue for Merkle batching:', err.message);
  }

  memoryAuditLedger.set(eventId, auditRecord);

  // Persist to disk JSON store
  const logs = readJsonLogs().filter(l => l.eventId !== eventId);
  logs.push(auditRecord);
  writeJsonLogs(logs);

  // Try saving to MySQL table if available
  try {
    await query(`
      INSERT INTO blockchain_audit_logs 
      (event_id, event_type, canonical_hash, tx_hash, block_number, network_id, verification_status)
      VALUES (?, ?, ?, ?, 0, 'sha256-audit-chain', 'ENQUEUED')
    `, [eventId, eventType, canonicalHash, '']);
  } catch (_) {}

  return auditRecord;
}

module.exports = {
  logThreatEvent,
  memoryAuditLedger,
  readJsonLogs,
  writeJsonLogs
};