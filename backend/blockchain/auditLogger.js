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
  const eventId = String(event.eventId || event.id || `evt_${Date.now()}_${Math.floor(Math.random()*1000)}`);
  const eventType = String(event.eventType || event.type || 'THREAT_DETECTED');
  
  const eventPayload = { ...event, eventId, eventType };
  const canonicalJson = createCanonicalJson(eventPayload);
  const canonicalHash = computeEventHash(eventPayload);

  const auditRecord = {
    eventId,
    eventType,
    canonicalHash,
    eventHash: canonicalHash,
    verificationStatus: 'VALID',
    createdAt: new Date().toISOString(),
    eventData: eventPayload,
    canonicalJson,
    merkleProof: null,
    merkleRoot: null,
    anchorTxHash: null,
    anchorBlockNumber: null,
    anchorNetwork: null,
    anchoredAt: null
  };

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
      VALUES (?, ?, ?, ?, 1, 'sha256-audit-chain', 'VALID')
    `, [eventId, eventType, canonicalHash, canonicalHash]);
  } catch (_) {}

  // Enqueue for Merkle batching and anchoring
  try {
    await enqueueLeaf({
      eventId,
      canonicalHash,
      timestamp: Date.now()
    });
  } catch (err) {
    console.warn('[AUDIT LOGGER] Failed to enqueue for Merkle batching:', err.message);
  }

  return auditRecord;
}

module.exports = {
  logThreatEvent,
  memoryAuditLedger,
  readJsonLogs,
  writeJsonLogs
};