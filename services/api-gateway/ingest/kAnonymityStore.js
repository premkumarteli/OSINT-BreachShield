const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STORE_DIR = path.join(__dirname, '..', 'data', 'breach_store');
const RECORDS_DIR = path.join(__dirname, '..', 'data', 'records');

// Ensure store and records directories exist
if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });
if (!fs.existsSync(RECORDS_DIR)) fs.mkdirSync(RECORDS_DIR, { recursive: true });

/**
 * Normalizes email or phone into a canonical format for hashing.
 */
function normalizeTarget(raw = '') {
  const str = String(raw || '').trim().toLowerCase();
  // Strip whitespace/dashes from phone numbers
  if (/^[\d+\s()-]+$/.test(str)) {
    let cleanPhone = str.replace(/[\s()-]/g, '');
    if (cleanPhone.startsWith('+')) return cleanPhone;
    if (cleanPhone.startsWith('91') && cleanPhone.length >= 11) return '+' + cleanPhone;
    if (cleanPhone.length >= 9 && cleanPhone.length <= 11) return '+91' + cleanPhone;
    return cleanPhone;
  }
  return str;
}

/**
 * Computes SHA-256 hash in uppercase hex (64 chars).
 */
function hashTarget(target) {
  const normalized = normalizeTarget(target);
  return crypto.createHash('sha256').update(normalized).digest('hex').toUpperCase();
}

/**
 * Reads full stored records for a target hash.
 */
function getStoredRecords(target) {
  const hash = hashTarget(target);
  const recordFile = path.join(RECORDS_DIR, `${hash}.json`);
  if (!fs.existsSync(recordFile)) return [];
  try {
    return JSON.parse(fs.readFileSync(recordFile, 'utf8') || '[]');
  } catch {
    return [];
  }
}

/**
 * Reads matching suffixes for a 5-character hex prefix.
 * Bucket format per line: SUFFIX:COUNT:SOURCES:CLASSES:YEAR
 */
function getRange(prefix) {
  if (!prefix || typeof prefix !== 'string') return [];
  const cleanPrefix = prefix.trim().toUpperCase();
  if (!/^[0-9A-F]{5}$/.test(cleanPrefix)) {
    throw new Error('Invalid prefix format. Expected 5-character hexadecimal string.');
  }

  const bucketFile = path.join(STORE_DIR, `${cleanPrefix}.dat`);
  if (!fs.existsSync(bucketFile)) {
    return [];
  }

  try {
    const content = fs.readFileSync(bucketFile, 'utf8');
    const lines = content.split('\n').filter(l => Boolean(l.trim()));
    return lines.map(line => {
      const parts = line.split(':');
      return {
        suffix: parts[0],
        count: Number(parts[1] || 1),
        sources: parts[2] ? parts[2].split(',') : [],
        dataClasses: parts[3] ? parts[3].split(',') : [],
        year: parts[4] || ''
      };
    });
  } catch (err) {
    console.error(`Error reading bucket ${cleanPrefix}:`, err.message);
    return [];
  }
}

/**
 * Ingests a target into the partitioned k-Anonymity bucket & structured document store.
 */
function ingestRecord(target, breachName = 'Public_Breach_Corpus', dataClasses = ['EMAIL', 'PASSWORD_HASH'], year = new Date().getFullYear().toString(), rawFields = null) {
  const hash = hashTarget(target);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const bucketFile = path.join(STORE_DIR, `${prefix}.dat`);
  let entries = new Map();

  if (fs.existsSync(bucketFile)) {
    try {
      const lines = fs.readFileSync(bucketFile, 'utf8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const [s, c, src, dc, yr] = trimmed.split(':');
        entries.set(s, {
          count: Number(c || 1),
          sources: new Set(src ? src.split(',') : []),
          dataClasses: new Set(dc ? dc.split(',') : []),
          year: yr || year
        });
      }
    } catch (_) {}
  }

  if (entries.has(suffix)) {
    const existing = entries.get(suffix);
    existing.count += 1;
    if (breachName) existing.sources.add(breachName);
    (Array.isArray(dataClasses) ? dataClasses : [dataClasses]).forEach(dc => existing.dataClasses.add(dc));
  } else {
    entries.set(suffix, {
      count: 1,
      sources: new Set(breachName ? [breachName] : []),
      dataClasses: new Set(Array.isArray(dataClasses) ? dataClasses : [dataClasses]),
      year
    });
  }

  // Write back to partition bucket
  const outputLines = Array.from(entries.entries()).map(([s, data]) => {
    const sourcesStr = Array.from(data.sources).join(',');
    const dcStr = Array.from(data.dataClasses).join(',');
    return `${s}:${data.count}:${sourcesStr}:${dcStr}:${data.year}`;
  });
  fs.writeFileSync(bucketFile, outputLines.join('\n') + '\n', 'utf8');

  // Save real structured record data if provided
  if (rawFields && typeof rawFields === 'object') {
    const recordFile = path.join(RECORDS_DIR, `${hash}.json`);
    let records = [];
    if (fs.existsSync(recordFile)) {
      try { records = JSON.parse(fs.readFileSync(recordFile, 'utf8') || '[]'); } catch (_) {}
    }
    const fullEntry = {
      source: breachName,
      year: year || new Date().getFullYear().toString(),
      dataClasses: Array.isArray(dataClasses) ? dataClasses : [dataClasses],
      fields: rawFields,
      ingestedAt: new Date().toISOString()
    };
    records.push(fullEntry);
    fs.writeFileSync(recordFile, JSON.stringify(records, null, 2), 'utf8');
  }

  return { hash, prefix, suffix };
}

/**
 * Ingests a batch of targets efficiently with raw fields.
 */
function ingestBatch(records = []) {
  let count = 0;
  for (const r of records) {
    if (!r) continue;
    const target = typeof r === 'string' ? r : (r.target || r.phone || r.email || r.mobile || r.phoneNumber);
    const breachName = r.breachName || r.source || 'Public_Breach_Corpus';
    const dataClasses = r.dataClasses || (r.fields ? Object.keys(r.fields) : ['PHONE', 'NAME', 'EMAIL']);
    const year = r.year || '2024';
    const rawFields = r.fields || (typeof r === 'object' ? r : null);
    if (target) {
      ingestRecord(target, breachName, dataClasses, year, rawFields);
      count++;
    }
  }
  return { ingested: count };
}

module.exports = {
  normalizeTarget,
  hashTarget,
  getRange,
  getStoredRecords,
  ingestRecord,
  ingestBatch,
  STORE_DIR,
  RECORDS_DIR
};
