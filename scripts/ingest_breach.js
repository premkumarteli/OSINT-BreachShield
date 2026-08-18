const fs = require('fs');
const readline = require('readline');
const path = require('path');
const { ingestRecord, ingestBatch } = require('../services/api-gateway/ingest/kAnonymityStore');

/**
 * Stream Ingestion CLI: Ingests raw breach files (CSV, TXT, Combo-lists)
 * Usage: node scripts/ingest_breach.js <filePath> <breachName> <dataClasses> <year>
 * Example: node scripts/ingest_breach.js dumps/sample.txt "LinkedIn_2012" "EMAIL,PASSWORD_HASH" 2012
 */
async function streamIngestFile(filePath, breachName = 'Public_Breach_Corpus', dataClassesStr = 'EMAIL,PASSWORD_HASH', year = '2024') {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const dataClasses = dataClassesStr.split(',').map(s => s.trim().toUpperCase());
  console.log(`🚀 Starting streaming ingestion of: ${filePath}`);
  console.log(`📦 Breach Name: ${breachName} | Year: ${year} | Classes: ${dataClasses.join(', ')}`);

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineCount = 0;
  let ingestedCount = 0;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex = /(?:\+?\d{10,13})/;

  for await (const line of rl) {
    lineCount++;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Extract email or phone
    const emailMatch = trimmed.match(emailRegex);
    const phoneMatch = trimmed.match(phoneRegex);

    const target = emailMatch ? emailMatch[0] : (phoneMatch ? phoneMatch[0] : null);

    if (target) {
      ingestRecord(target, breachName, dataClasses, year);
      ingestedCount++;
    }

    if (lineCount % 10000 === 0) {
      console.log(`⚡ Ingested ${ingestedCount} records (scanned ${lineCount} lines)...`);
    }
  }

  console.log(`🎉 Ingestion Complete!`);
  console.log(`📊 Scanned Lines: ${lineCount} | Ingested Hashes: ${ingestedCount}`);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const filePath = args[0];
  const breachName = args[1] || 'Public_Breach_Corpus';
  const dataClasses = args[2] || 'EMAIL,PASSWORD_HASH';
  const year = args[3] || '2024';

  if (!filePath) {
    console.log(`Usage: node scripts/ingest_breach.js <filePath> [breachName] [dataClasses] [year]`);
    console.log(`Example: node scripts/ingest_breach.js data/sample.txt "Apollo_2018" "EMAIL,NAME,PHONE" 2018`);
    process.exit(0);
  }

  streamIngestFile(filePath, breachName, dataClasses, year);
}

module.exports = { streamIngestFile };
