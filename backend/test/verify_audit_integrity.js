const { logThreatEvent, memoryAuditLedger, readJsonLogs, writeJsonLogs } = require('../blockchain/auditLogger');
const { verifyThreatEvent } = require('../blockchain/verificationService');
const { computeEventHash } = require('../blockchain/auditHasher');

async function testAuditIntegrity() {
  console.log('=== REAL EVENT LOGGING & INTEGRITY VERIFICATION TEST ===\n');

  // 1. Log a real threat event
  const realEvent = {
    id: 'evt_real_sec_001',
    type: 'PHISHING_ALERT',
    query: 'user@target-company.com',
    riskScore: 88,
    riskLevel: 'CRITICAL',
    sourceName: 'Live_OSINT_Feed',
    timestamp: '2026-09-03T06:00:00.000Z'
  };

  console.log('Logging event:', JSON.stringify(realEvent, null, 2));
  const loggedRecord = await logThreatEvent(realEvent);
  console.log('\nLogged Audit Record:');
  console.log(JSON.stringify(loggedRecord, null, 2));

  // 2. Verify event integrity on unaltered stored record
  console.log('\n--- 1. VERIFY UNALTERED STORED EVENT ---');
  const verifyResultMatch = await verifyThreatEvent('evt_real_sec_001');
  console.log('Verify Result:');
  console.log(JSON.stringify(verifyResultMatch, null, 2));

  // 3. Manually alter one field in the stored record (e.g., tamper riskScore from 88 -> 15)
  console.log('\n--- 2. MANUALLY ALTERING STORED RECORD FIELD ---');
  const storedRecord = memoryAuditLedger.get('evt_real_sec_001');
  if (storedRecord && storedRecord.eventData) {
    console.log(`Original stored riskScore: ${storedRecord.eventData.riskScore}`);
    storedRecord.eventData.riskScore = 15; // Tamper field!
    console.log(`Tampered stored riskScore to: ${storedRecord.eventData.riskScore}`);
  }

  // 4. Verify again after tampering
  console.log('\n--- 3. VERIFY AFTER FIELD ALTERATION ---');
  const verifyResultTampered = await verifyThreatEvent('evt_real_sec_001');
  console.log('Verify Result:');
  console.log(JSON.stringify(verifyResultTampered, null, 2));
}

testAuditIntegrity().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
