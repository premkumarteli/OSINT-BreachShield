const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STORE_DIR = path.join(__dirname, '..', 'data', 'breach_store');

// Ensure store directory exists
if (!fs.existsSync(STORE_DIR)) {
  fs.mkdirSync(STORE_DIR, { recursive: true });
}

/**
 * Normalizes email or phone into a canonical format for hashing.
 */
function normalizeTarget(raw = '') {
  const str = String(raw || '').trim().toLowerCase();
  // Strip whitespace/dashes from phone numbers
  if (/^[\d+\s()-]+$/.test(str)) {
    let cleanPhone = str.replace(/[\s()-]/g, '');
    if (cleanPhone.startsWith('91') && cleanPhone.length === 12) cleanPhone = '+' + cleanPhone;
    else if (!cleanPhone.startsWith('+') && cleanPhone.length === 10) cleanPhone = '+91' + cleanPhone;
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
 * Reads matching suffixes for a 5-character hex prefix.
 * Bucket format per line: SUFFIX:COUNT:SOURCES:CLASSES:YEAR
 * Example: 828348C9438D8B938472:2:LinkedIn_2012,Canva_2019:PASSWORD_HASH,EMAIL:2019
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
 * Ingests a single target into the partitioned k-Anonymity bucket.
 */
function ingestRecord(target, breachName = 'Public_Breach_Corpus', dataClasses = ['EMAIL', 'PASSWORD_HASH'], year = new Date().getFullYear().toString()) {
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

  // Write back to bucket
  const outputLines = Array.from(entries.entries()).map(([s, data]) => {
    const sourcesStr = Array.from(data.sources).join(',');
    const dcStr = Array.from(data.dataClasses).join(',');
    return `${s}:${data.count}:${sourcesStr}:${dcStr}:${data.year}`;
  });

  fs.writeFileSync(bucketFile, outputLines.join('\n') + '\n', 'utf8');
  return { hash, prefix, suffix };
}

/**
 * Ingests a batch of targets efficiently.
 */
function ingestBatch(records = []) {
  let count = 0;
  for (const r of records) {
    if (!r) continue;
    const target = typeof r === 'string' ? r : r.target || r.email || r.phone;
    const breachName = r.breachName || r.source || 'Public_Breach_Corpus';
    const dataClasses = r.dataClasses || ['EMAIL', 'PASSWORD_HASH'];
    const year = r.year || '2024';
    if (target) {
      ingestRecord(target, breachName, dataClasses, year);
      count++;
    }
  }
  return { ingested: count };
}

module.exports = {
  normalizeTarget,
  hashTarget,
  getRange,
  ingestRecord,
  ingestBatch,
  STORE_DIR
};
