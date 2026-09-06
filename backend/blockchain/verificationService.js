const { computeEventHash } = require('./auditHasher');
const { query } = require('../auth/db');
const { memoryAuditLedger, readJsonLogs } = require('./auditLogger');
const anchorClient = require('./anchorClient');
const { verifyProof, computeLeaf } = require('./merkleUtils');

/**
 * Recomputes the SHA-256 hash of a stored threat event and compares it to the logged audit hash.
 * Returns status: ANCHORED_MATCH, ANCHORED_TAMPERED, NOT_ANCHORED, NOT_FOUND, MATCH, TAMPERED.
 */
async function verifyThreatEvent(eventId, eventDataOverride = null) {
  let record = memoryAuditLedger.get(eventId) || null;

  if (!record) {
    const logs = readJsonLogs();
    record = logs.find(l => l.eventId === eventId) || null;
  }

  if (!record) {
    try {
      const rows = await query('SELECT * FROM blockchain_audit_logs WHERE event_id = ? ORDER BY id DESC LIMIT 1', [eventId]);
      if (rows && rows.length > 0) {
        record = {
          eventId: rows[0].event_id,
          eventType: rows[0].event_type,
          canonicalHash: rows[0].canonical_hash,
          eventHash: rows[0].canonical_hash,
          verificationStatus: rows[0].verification_status
        };
      }
    } catch (_) {}
  }

  if (!record) {
    return {
      eventId,
      status: 'NOT_FOUND',
      verified: false,
      message: 'No audit record exists for this event ID.'
    };
  }

  // Determine which event payload to recompute hash for:
  let payloadToHash = eventDataOverride || record.eventData;
  if (!payloadToHash && record.canonicalJson) {
    try {
      payloadToHash = JSON.parse(record.canonicalJson);
    } catch (_) {
      payloadToHash = record;
    }
  }

  const loggedHash = record.canonicalHash || record.eventHash;
  const recomputedHash = computeEventHash(payloadToHash || record);

  // First: Local hash integrity check
  if (recomputedHash !== loggedHash) {
    return {
      eventId,
      status: 'TAMPERED',
      verified: false,
      loggedHash,
      recomputedHash,
      message: 'CRITICAL WARNING: Recomputed SHA-256 hash does not match logged audit hash! Event record has been altered.'
    };
  }

  // Second: Check if Merkle root is anchored on-chain
  let anchorStatus = 'NOT_ANCHORED';
  let anchorBlockNumber = null;
  let anchorTxHash = null;
  
  if (record.merkleRoot && record.anchorTxHash && record.anchorBlockNumber) {
    try {
      if (!anchorClient.initialized) {
        await anchorClient.initialize();
      }
      const anchoredBlock = await anchorClient.verifyAnchor(record.merkleRoot);
      
      if (anchoredBlock > 0) {
        anchorStatus = 'ANCHORED';
        anchorBlockNumber = anchoredBlock;
        anchorTxHash = record.anchorTxHash;
        
        // Verify the Merkle proof if available
        if (record.merkleProof && record.merkleRoot) {
          const leafTimestamp = record.timestamp || (record.createdAt ? Date.parse(record.createdAt) : Date.now());
          const leafHash = computeLeaf(
            record.eventId,
            record.canonicalHash,
            leafTimestamp
          );
          
          const proofValid = verifyProof(
            leafHash,
            record.merkleProof,
            record.merkleRoot
          );
          
          if (!proofValid) {
            return {
              eventId,
              status: 'ANCHORED_TAMPERED',
              verified: false,
              loggedHash,
              recomputedHash,
              anchorStatus,
              anchorBlockNumber,
              anchorTxHash,
              message: 'Event hash matches but Merkle proof invalid — record may have been tampered before anchoring.'
            };
          }
        }
      }
    } catch (err) {
      console.warn('[VERIFICATION] On-chain anchor check failed:', err.message);
      anchorStatus = 'NOT_ANCHORED';
    }
  }

  // Determine final status
  if (anchorStatus === 'ANCHORED') {
    return {
      eventId,
      status: 'ANCHORED_MATCH',
      verified: true,
      loggedHash,
      recomputedHash,
      anchorStatus,
      anchorBlockNumber,
      anchorTxHash: record.anchorTxHash,
      message: 'Event integrity verified: SHA-256 hash matches and Merkle root is anchored on-chain.'
    };
  }
  
  if (anchorStatus === 'NOT_ANCHORED') {
    return {
      eventId,
      status: 'NOT_ANCHORED',
      verified: true,
      loggedHash,
      recomputedHash,
      anchorStatus,
      anchorBlockNumber: null,
      anchorTxHash: null,
      message: 'Event integrity verified locally (SHA-256 match), but Merkle root not yet anchored on-chain.'
    };
  }
  
  // Local hash match only
  return {
    eventId,
    status: 'MATCH',
    verified: true,
    loggedHash,
    recomputedHash,
    anchorStatus: 'NOT_ANCHORED',
    anchorBlockNumber: null,
    anchorTxHash: null,
    message: 'Event integrity verified locally (SHA-256 match), but Merkle root not yet anchored on-chain.'
  };
}

module.exports = {
  verifyThreatEvent
};