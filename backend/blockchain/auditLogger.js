const { computeEventHash, createCanonicalJson } = require('./auditHasher');
const blockchainClient = require('./blockchainClient');
const { query } = require('../auth/db');
const fs = require('fs');
const path = require('path');

const INSTANCE_DIR = path.join(__dirname, '../../instance');
const AUDIT_LOGS_JSON = path.join(INSTANCE_DIR, 'blockchain_audit_logs.json');

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
 * Logs a threat event to the blockchain audit system and MySQL.
 */
async function logThreatEvent(event) {
  const eventId = String(event.eventId || event.id || `evt_${Date.now()}_${Math.floor(Math.random()*1000)}`);
  const eventType = String(event.eventType || event.type || 'THREAT_DETECTED');
  
  const eventPayload = { ...event, eventId, eventType };
  const canonicalJson = createCanonicalJson(eventPayload);
  const canonicalHash = computeEventHash(eventPayload);

  // 1. Submit transaction to blockchain ledger
  const tx = await blockchainClient.submitAuditTransaction(eventId, canonicalHash);

  const auditRecord = {
    eventId,
    eventType,
    canonicalHash,
    txHash: tx.txHash,
    blockNumber: tx.blockNumber,
    networkId: tx.networkId,
    verificationStatus: 'VALID',
    createdAt: new Date().toISOString(),
    canonicalJson
  };

  // 2. Persist in MySQL with JSON fallback
  try {
    await query(`
      INSERT INTO blockchain_audit_logs 
      (event_id, event_type, canonical_hash, tx_hash, block_number, network_id, verification_status)
      VALUES (?, ?, ?, ?, ?, ?, 'VALID')
    `, [eventId, eventType, canonicalHash, tx.txHash, tx.blockNumber, tx.networkId]);
  } catch (dbErr) {
    const logs = readJsonLogs().filter(l => l.eventId !== eventId);
    logs.push(auditRecord);
    writeJsonLogs(logs);
  }

  return auditRecord;
}

module.exports = {
  logThreatEvent
};
