const fs = require('fs');
const path = require('path');

const INSTANCE_DIR = path.join(__dirname, '../../instance');
const BATCH_QUEUE_FILE = path.join(INSTANCE_DIR, 'merkle_batch_queue.json');
const BATCH_HISTORY_FILE = path.join(INSTANCE_DIR, 'merkle_batch_history.json');

function ensureDir() {
  if (!fs.existsSync(INSTANCE_DIR)) {
    fs.mkdirSync(INSTANCE_DIR, { recursive: true });
  }
}

function readQueue() {
  ensureDir();
  if (!fs.existsSync(BATCH_QUEUE_FILE)) return [];
  try {
    const content = fs.readFileSync(BATCH_QUEUE_FILE, 'utf8');
    if (!content.trim()) return [];
    return JSON.parse(content);
  } catch (err) {
    console.error('[BATCH PERSISTENCE] Failed to parse queue file:', err.message);
    console.error('[BATCH PERSISTENCE] File path:', BATCH_QUEUE_FILE);
    throw new Error(`Failed to parse batch queue: ${err.message}`);
  }
}

function writeQueue(queue) {
  ensureDir();
  try {
    fs.writeFileSync(BATCH_QUEUE_FILE, JSON.stringify(queue, null, 2));
  } catch (err) {
    console.error('[BATCH PERSISTENCE] Failed to write queue file:', err.message);
    throw new Error(`Failed to write batch queue: ${err.message}`);
  }
}

function readHistory() {
  ensureDir();
  if (!fs.existsSync(BATCH_HISTORY_FILE)) return [];
  try {
    const content = fs.readFileSync(BATCH_HISTORY_FILE, 'utf8');
    if (!content.trim()) return [];
    return JSON.parse(content);
  } catch (err) {
    console.error('[BATCH PERSISTENCE] Failed to parse history file:', err.message);
    console.error('[BATCH PERSISTENCE] File path:', BATCH_HISTORY_FILE);
    throw new Error(`Failed to parse batch history: ${err.message}`);
  }
}

function writeHistory(history) {
  ensureDir();
  try {
    fs.writeFileSync(BATCH_HISTORY_FILE, JSON.stringify(history, null, 2));
  } catch (err) {
    console.error('[BATCH PERSISTENCE] Failed to write history file:', err.message);
    throw new Error(`Failed to write batch history: ${err.message}`);
  }
}

function appendHistory(batch) {
  const history = readHistory();
  history.push(batch);
  // Keep last 1000 batches
  if (history.length > 1000) history.shift();
  writeHistory(history);
}

module.exports = {
  readQueue,
  writeQueue,
  readHistory,
  writeHistory,
  appendHistory,
  BATCH_QUEUE_FILE,
  BATCH_HISTORY_FILE
};