const { logThreatEvent, memoryAuditLedger, readJsonLogs, writeJsonLogs } = require('./auditLogger');
const { createCanonicalJson, computeEventHash } = require('./auditHasher');
const { verifyThreatEvent } = require('./verificationService');
const { enqueueLeaf, flushAll, recoverPendingBatches, getQueue } = require('./merkleBatcher');
const anchorClient = require('./anchorClient');
const { computeLeaf, hashPair, buildMerkleTree, verifyProof } = require('./merkleUtils');

module.exports = {
  // Core audit functions
  logThreatEvent,
  verifyThreatEvent,
  createCanonicalJson,
  computeEventHash,
  memoryAuditLedger,
  readJsonLogs,
  writeJsonLogs,
  
  // Merkle batching
  enqueueLeaf,
  flushAll,
  recoverPendingBatches,
  getQueue,
  
  // Anchor client
  anchorClient,
  
  // Merkle utilities
  computeLeaf,
  hashPair,
  buildMerkleTree,
  verifyProof,
  
  // Legacy (deprecated)
  // BlockchainClient removed — use anchorClient instead
};