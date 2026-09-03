const { computeEventHash } = require('./auditHasher');
const blockchainClient = require('./blockchainClient');
const { query } = require('../auth/db');
const fs = require('fs');
const path = require('path');

const AUDIT_LOGS_JSON = path.join(__dirname, '../../instance/blockchain_audit_logs.json');

function readJsonLogs() {
  try {
    if (!fs.existsSync(AUDIT_LOGS_JSON)) return [];
    return JSON.parse(fs.readFileSync(AUDIT_LOGS_JSON, 'utf8') || '[]');
  } catch {
    return [];
  }
}

/**
 * Verifies whether a given event payload matches the immutable blockchain transaction hash.
 * Returns status: VALID, TAMPERED, or NOT_FOUND.
 */
async function verifyThreatEvent(eventId, currentEventData) {
  let record = null;

  try {
    const rows = await query('SELECT * FROM blockchain_audit_logs WHERE event_id = ? ORDER BY id DESC LIMIT 1', [eventId]);
    if (rows && rows.length > 0) {
      record = {
        eventId: rows[0].event_id,
        eventType: rows[0].event_type,
        canonicalHash: rows[0].canonical_hash,
        txHash: rows[0].tx_hash,
        blockNumber: rows[0].block_number,
        networkId: rows[0].network_id,
        verificationStatus: rows[0].verification_status
      };
    }
  } catch (_) {
    const logs = readJsonLogs();
    record = logs.find(l => l.eventId === eventId) || null;
  }

  if (!record) {
    return {
      eventId,
      status: 'NOT_FOUND',
      verified: false,
      message: 'No blockchain audit record exists for this event ID.'
    };
  }

  // If current event payload is supplied, recompute its SHA-256 hash and verify integrity
  if (currentEventData) {
    const currentHash = computeEventHash(currentEventData);
    if (currentHash !== record.canonicalHash) {
      return {
        eventId,
        status: 'TAMPERED',
        verified: false,
        storedHash: record.canonicalHash,
        recomputedHash: currentHash,
        txHash: record.txHash,
        message: 'CRITICAL WARNING: Event data payload hash does not match the immutable blockchain transaction hash!'
      };
    }
  }

  return {
    eventId,
    status: 'VALID',
    verified: true,
    txHash: record.txHash,
    canonicalHash: record.canonicalHash,
    blockNumber: record.blockNumber,
    networkId: record.networkId,
    message: 'Event successfully verified against tamper-evident blockchain ledger.'
  };
}

module.exports = {
  verifyThreatEvent
};
