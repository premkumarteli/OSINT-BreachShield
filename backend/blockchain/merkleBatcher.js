const { computeLeaf, buildMerkleTree } = require('./merkleUtils');
const { readQueue, writeQueue, appendHistory, BATCH_QUEUE_FILE } = require('./batchPersistence');
const anchorClient = require('./anchorClient');
const fs = require('fs');
const path = require('path');

const MAX_BATCH_SIZE = parseInt(process.env.MERKLE_BATCH_MAX_SIZE || '100', 10);
const MAX_WAIT_MS = parseInt(process.env.MERKLE_BATCH_MAX_WAIT_MS || '60000', 10);
const MAX_RETRIES = parseInt(process.env.MERKLE_BATCH_MAX_RETRIES || '5', 10);
const DEAD_LETTER_FILE = path.join(path.dirname(BATCH_QUEUE_FILE), 'merkle_dead_letter.json');
let flushTimer = null;
let isProcessing = false;
let batchQueue;

function loadQueueSafelySync() {
  try {
    return require('./batchPersistence').readQueue();
  } catch (err) {
    if (err.message && err.message.includes('Failed to parse')) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const corruptedPath = BATCH_QUEUE_FILE + `.corrupted-${timestamp}`;
      try {
        fs.renameSync(BATCH_QUEUE_FILE, corruptedPath);
        console.error(`[MERKLE BATCHER] CRITICAL: Corrupted queue file quarantined to ${corruptedPath}`);
      } catch (renameErr) {
        console.error('[MERKLE BATCHER] CRITICAL: Failed to quarantine corrupted queue file:', renameErr.message);
      }
    }
    console.error('[MERKLE BATCHER] CRITICAL: Queue file corrupted, starting with empty queue:', err.message);
    return [];
  }
}

function appendDeadLetterSync(deadLetterEntry) {
  let deadLetters = [];
  try {
    if (fs.existsSync(DEAD_LETTER_FILE)) {
      deadLetters = JSON.parse(fs.readFileSync(DEAD_LETTER_FILE, 'utf8') || '[]');
    }
  } catch {
    deadLetters = [];
  }
  deadLetters.push(deadLetterEntry);
  try {
    fs.writeFileSync(DEAD_LETTER_FILE, JSON.stringify(deadLetters, null, 2));
  } catch (err) {
    console.error('[MERKLE BATCHER] CRITICAL: Failed to write dead letter file:', err.message);
  }
}

batchQueue = loadQueueSafelySync();

/**
 * Add event to batch queue
 * @param {Object} event - { eventId, canonicalHash, timestamp }
 */
async function enqueueLeaf(event) {
  const leaf = {
    eventId: event.eventId,
    canonicalHash: event.canonicalHash,
    timestamp: event.timestamp,
    createdAt: new Date().toISOString()
  };
  
  batchQueue.push(leaf);
  writeQueue(batchQueue);
  
  scheduleFlush();
}

/**
 * Schedule a flush if not already scheduled
 */
function scheduleFlush() {
  if (flushTimer) return;
  
  flushTimer = setTimeout(async () => {
    flushTimer = null;
    if (batchQueue.length > 0) {
      await flushBatch();
    }
  }, MAX_WAIT_MS);
  if (flushTimer && typeof flushTimer.unref === 'function') {
    flushTimer.unref();
  }
}

/**
 * Flush current batch - build Merkle tree and anchor
 */
async function flushBatch() {
  if (isProcessing || batchQueue.length === 0) return;
  
  isProcessing = true;
  const batch = batchQueue.splice(0, MAX_BATCH_SIZE);
  writeQueue(batchQueue);
  
  try {
    console.log(`[MERKLE BATCHER] Processing batch of ${batch.length} events`);
    
    // Build leaves
    const leaves = batch.map(event => 
      require('./merkleUtils').computeLeaf(event.eventId, event.canonicalHash, event.timestamp)
    );
    
    // Build Merkle tree
    const { root, proofs } = require('./merkleUtils').buildMerkleTree(leaves);
    
    console.log(`[MERKLE BATCHER] Merkle root: ${root} (${batch.length} leaves)`);
    
    // Persist batch metadata before anchoring
    const batchRecord = {
      batchId: `batch_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      leafCount: batch.length,
      merkleRoot: root,
      proofs: proofs,
      leaves: batch.map((event, i) => ({
        eventId: event.eventId,
        leafHash: leaves[i],
        canonicalHash: event.canonicalHash,
        timestamp: event.timestamp
      })),
      status: 'pending'
    };
    
    await appendHistory(batchRecord);
    
    // Anchor to blockchain
    try {
      const anchorResult = await anchorClient.anchorMerkleRoot(root);
      
      // Update batch record
      batchRecord.status = 'anchored';
      batchRecord.anchorTxHash = anchorResult.txHash;
      batchRecord.anchorBlockNumber = anchorResult.blockNumber;
      batchRecord.anchorNetwork = anchorResult.network;
      batchRecord.anchoredAt = new Date().toISOString();
      
      // Update history
      const history = require('./batchPersistence').readHistory();
      const idx = history.findIndex(b => b.batchId === batchRecord.batchId);
      if (idx >= 0) history[idx] = batchRecord;
      require('./batchPersistence').writeHistory(history);
      
      // Update each auditRecord with proof and anchor info
      const { readJsonLogs, writeJsonLogs, memoryAuditLedger } = require('./auditLogger');
      const logs = readJsonLogs();
      
      batch.forEach((event, i) => {
        const proof = proofs[i];
        const logIdx = logs.findIndex(l => l.eventId === event.eventId);
        if (logIdx >= 0) {
          logs[logIdx] = {
            ...logs[logIdx],
            merkleProof: proof.proof,
            merkleRoot: root,
            anchorTxHash: anchorResult.txHash,
            anchorBlockNumber: anchorResult.blockNumber,
            anchorNetwork: anchorResult.network,
            anchoredAt: batchRecord.anchoredAt
          };
        }
        
        // Update in-memory
        if (memoryAuditLedger.has(event.eventId)) {
          const record = memoryAuditLedger.get(event.eventId);
          memoryAuditLedger.set(event.eventId, {
            ...record,
            merkleProof: proof.proof,
            merkleRoot: root,
            anchorTxHash: anchorResult.txHash,
            anchorBlockNumber: anchorResult.blockNumber,
            anchorNetwork: anchorResult.network,
            anchoredAt: batchRecord.anchoredAt
          });
        }
      });
      
      writeJsonLogs(logs);
      
      // Update batch record in history
      batchRecord.proofs = proofs.map(p => p.proof);
      const history2 = require('./batchPersistence').readHistory();
      const idx2 = history2.findIndex(b => b.batchId === batchRecord.batchId);
      if (idx2 >= 0) history2[idx2] = batchRecord;
      require('./batchPersistence').writeHistory(history2);
      
      console.log(`[MERKLE BATCHER] Batch anchored: ${anchorResult.txHash} (Block #${anchorResult.blockNumber})`);
      
    } catch (anchorErr) {
      console.error('[MERKLE BATCHER] Anchoring failed:', anchorErr.message);
      
      batchRecord.retryCount = (batchRecord.retryCount || 0) + 1;
      batchRecord.error = anchorErr.message;
      
      if (batchRecord.retryCount >= MAX_RETRIES) {
        // Max retries exceeded - move to dead letter queue
        console.error(`[MERKLE BATCHER] CRITICAL: Batch ${batchRecord.batchId} exceeded max retries (${MAX_RETRIES}), moving to dead letter queue`);
        
        const deadLetterEntry = {
          batchId: batchRecord.batchId,
          timestamp: new Date().toISOString(),
          error: anchorErr.message,
          retryCount: batchRecord.retryCount,
          leaves: batchRecord.leaves,
          merkleRoot: root
        };
        
        appendDeadLetterSync(deadLetterEntry);
        
        // Update history - mark as dead_letter
        const history2 = require('./batchPersistence').readHistory();
        const idx2 = history2.findIndex(b => b.batchId === batchRecord.batchId);
        if (idx2 >= 0) {
          history2[idx2] = { ...batchRecord, status: 'dead_letter' };
        } else {
          history2.push({ ...batchRecord, status: 'dead_letter' });
        }
        require('./batchPersistence').writeHistory(history2);
        
        console.error(`[MERKLE BATCHER] CRITICAL: Batch ${batchRecord.batchId} moved to dead letter queue after ${MAX_RETRIES} failed attempts. Events in this batch will NOT be retried.`);
      } else {
        // Mark batch as failed, will retry on next flush
        batchRecord.status = 'failed';
        batchRecord.error = anchorErr.message;
        
        // Re-queue events for retry
        batchQueue.unshift(...batch);
        writeQueue(batchQueue);
        
        // Update history
        const history2 = require('./batchPersistence').readHistory();
        const idx2 = history2.findIndex(b => b.batchId === batchRecord.batchId);
        if (idx2 >= 0) history2[idx2] = batchRecord;
        require('./batchPersistence').writeHistory(history2);
        
        console.warn(`[MERKLE BATCHER] Batch ${batchRecord.batchId} failed (attempt ${batchRecord.retryCount}/${MAX_RETRIES}), re-queued for retry`);
      }
    }
  } catch (err) {
    console.error('[MERKLE BATCHER] Batch processing failed:', err.message);
  } finally {
    isProcessing = false;
    // Schedule next flush if queue not empty
    if (batchQueue.length > 0) {
      scheduleFlush();
    }
  }
}

/**
 * Flush all pending batches (for graceful shutdown)
 */
async function flushAll() {
  while (batchQueue.length > 0) {
    await flushBatch();
  }
}

/**
 * Recover pending batches on startup
 */
async function recoverPendingBatches() {
  let history;
  try {
    history = require('./batchPersistence').readHistory();
  } catch (err) {
    if (err.message && err.message.includes('Failed to parse')) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const corruptedPath = require('./batchPersistence').BATCH_HISTORY_FILE + `.corrupted-${timestamp}`;
      try {
        fs.renameSync(require('./batchPersistence').BATCH_HISTORY_FILE, corruptedPath);
        console.error(`[MERKLE BATCHER] CRITICAL: Corrupted history file quarantined to ${corruptedPath}`);
      } catch (renameErr) {
        console.error('[MERKLE BATCHER] CRITICAL: Failed to quarantine corrupted history file:', renameErr.message);
      }
    }
    console.error('[MERKLE BATCHER] CRITICAL: History file corrupted, skipping recovery:', err.message);
    return;
  }
  
  const pendingBatches = history.filter(b => b.status === 'pending' || b.status === 'submitted' || b.status === 'failed');
  
  for (const batch of pendingBatches) {
    if (batch.status === 'pending' || batch.status === 'failed') {
      // Re-submit
      console.log(`[MERKLE BATCHER] Recovering ${batch.status} batch: ${batch.batchId}`);
      try {
        const anchorResult = await anchorClient.anchorMerkleRoot(batch.merkleRoot);
        batch.status = 'anchored';
        batch.anchorTxHash = anchorResult.txHash;
        batch.anchorBlockNumber = anchorResult.blockNumber;
        batch.anchorNetwork = anchorResult.network;
        batch.anchoredAt = new Date().toISOString();
        
        // Update audit records
        const { readJsonLogs, writeJsonLogs, memoryAuditLedger } = require('./auditLogger');
        const logs = readJsonLogs();
        
        batch.leaves.forEach((event, i) => {
          const logIdx = logs.findIndex(l => l.eventId === event.eventId);
          if (logIdx >= 0) {
            logs[logIdx] = {
              ...logs[logIdx],
              merkleProof: batch.proofs ? batch.proofs[i] : undefined,
              merkleRoot: batch.merkleRoot,
              anchorTxHash: anchorResult.txHash,
              anchorBlockNumber: anchorResult.blockNumber,
              anchorNetwork: anchorResult.network,
              anchoredAt: batch.anchoredAt
            };
          }
        });
        writeJsonLogs(logs);
      } catch (err) {
        console.error(`[MERKLE BATCHER] Recovery failed for ${batch.batchId}:`, err.message);
      }
    } else if (batch.status === 'submitted') {
      // Check on-chain for confirmation
      console.log(`[MERKLE BATCHER] Checking submitted batch: ${batch.batchId}`);
      // TODO: Query tx receipt
    }
  }
  
  // Rewrite history
  require('./batchPersistence').writeHistory(history);
}

module.exports = {
  enqueueLeaf,
  flushBatch,
  flushAll,
  recoverPendingBatches,
  getQueue: () => batchQueue
};