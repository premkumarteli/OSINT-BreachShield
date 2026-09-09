const { logThreatEvent, memoryAuditLedger } = require('../blockchain/auditLogger');
const { verifyThreatEvent } = require('../blockchain/verificationService');

async function testAuditIntegrity() {
  console.log('=== AUDIT INTEGRITY VERIFICATION TEST ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Log a real threat event
  const realEvent = {
    id: 'evt_integrity_test_001',
    type: 'PHISHING_ALERT',
    query: 'user@target-company.com',
    riskScore: 88,
    riskLevel: 'CRITICAL',
    sourceName: 'Live_OSINT_Feed',
    timestamp: '2026-09-03T06:00:00.000Z'
  };

  const loggedRecord = await logThreatEvent(realEvent);
  assert(loggedRecord && loggedRecord.eventId === 'evt_integrity_test_001', 'Event logged successfully');

  // 2. Verify unaltered record
  const verifyResultMatch = await verifyThreatEvent('evt_integrity_test_001');
  assert(verifyResultMatch.verified === true || verifyResultMatch.status === 'MATCH', 'Unaltered record verifies as valid');

  // 3. Tamper with the record
  const storedRecord = memoryAuditLedger.get('evt_integrity_test_001');
  if (storedRecord && storedRecord.eventData) {
    storedRecord.eventData.riskScore = 15;
  }

  // 4. Verify tampered record
  const verifyResultTampered = await verifyThreatEvent('evt_integrity_test_001');
  assert(verifyResultTampered.verified === false || verifyResultTampered.status === 'TAMPERED', 'Tampered record detected as invalid');

  console.log(`\nSUMMARY: ${passed} Passed | ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

testAuditIntegrity().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
