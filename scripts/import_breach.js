#!/usr/bin/env node
/**
 * @file import_breach.js
 * @description High-Speed Bulk Breach Dataset Importer CLI for OSINT BreachShield.
 * Ingests CSV or TXT lists into the local k-anonymity partition store without persisting plaintext PII.
 * 
 * Usage:
 *   node scripts/import_breach.js --file path/to/dump.csv --source "Airtel_2023" --year 2023 --classes "PHONE,NAME,ADDRESS"
 *   node scripts/import_breach.js --target "+919876543210" --source "Telecom_Leak" --year 2024
 */

const fs = require('fs');
const path = require('path');
const { ingestRecord } = require('../backend/ingest/kAnonymityStore');

const args = process.argv.slice(2);
let file = null;
let target = null;
let source = 'Enterprise_Breach_Corpus';
let year = '2024';
let classes = ['EMAIL', 'PASSWORD_HASH'];

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--file' && args[i + 1]) file = args[++i];
  else if (args[i] === '--target' && args[i + 1]) target = args[++i];
  else if (args[i] === '--source' && args[i + 1]) source = args[++i];
  else if (args[i] === '--year' && args[i + 1]) year = args[++i];
  else if (args[i] === '--classes' && args[i + 1]) classes = args[++i].split(',').map(s => s.trim().toUpperCase());
}

if (target) {
  ingestRecord(target, source, classes, year);
  console.log(`[+] Successfully indexed target: ${target} into [${source} (${year})]`);
  process.exit(0);
}

if (!file || !fs.existsSync(file)) {
  console.error('[!] Please provide a valid file via --file <path> or single target via --target <identifier>');
  console.log('Usage: node scripts/import_breach.js --file data.csv --source "Airtel_2023" --year 2023 --classes "PHONE,NAME,ADDRESS"');
  process.exit(1);
}

console.log(`[*] Ingesting file: ${file} into [${source} (${year})]...`);
const raw = fs.readFileSync(file, 'utf8');
const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
let count = 0;

for (const line of lines) {
  const parts = line.split(',').map(s => s.trim());
  let item = parts[0];
  for (const p of parts) {
    if (p.includes('@') || /^[+]?\d{10,14}$/.test(p)) {
      item = p;
      break;
    }
  }
  if (item) {
    ingestRecord(item, source, classes, year);
    count++;
    if (count % 1000 === 0) console.log(`    -> Indexed ${count} records...`);
  }
}

console.log(`[+] Complete! Successfully indexed ${count} records into k-Anonymity Partition Store.`);
