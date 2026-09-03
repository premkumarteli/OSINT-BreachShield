const { computeEventHash, createCanonicalJson } = require('../blockchain/auditHasher');
const blockchainClient = require('../blockchain/blockchainClient');
const { verifyThreatEvent } = require('../blockchain/verificationService');
const { logThreatEvent } = require('../blockchain/auditLogger');
const { analyzeExposure } = require('../analytics/riskEngine');
const { getEnabledSources } = require('../sources/registry');

async function runTests() {
  console.log('==================================================');
  console.log('RUNNING BREACHSHIELD AI & BLOCKCHAIN UNIT TESTS');
  console.log('==================================================\n');

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

  // 1. Audit Hasher
  const event = { id: 'evt_101', type: 'THREAT_ALERT', query: 'test@example.com', riskScore: 85 };
  const canonical = createCanonicalJson(event);
  const hash = computeEventHash(event);
  assert(canonical.includes('"eventId":"evt_101"'), 'Canonical JSON contains sorted eventId');
  assert(typeof hash === 'string' && hash.length === 64, 'Event hash is 64-char SHA-256 string');

  // 2. Blockchain Client
  const tx = await blockchainClient.submitAuditTransaction('evt_101', hash);
  assert(tx.txHash.startsWith('0x'), 'Transaction hash starts with 0x prefix');
  assert(tx.blockNumber > 0, 'Block number generated');

  // 3. Audit Logger & Verification
  const auditRec = await logThreatEvent(event);
  assert(auditRec.verificationStatus === 'VALID', 'Audit logger creates valid record');

  const verification = await verifyThreatEvent('evt_101', event);
  assert(verification.status === 'VALID' && verification.verified === true, 'Verification service confirms VALID event payload');

  const tamperedEvent = { ...event, riskScore: 10 };
  const tamperedVerification = await verifyThreatEvent('evt_101', tamperedEvent);
  assert(tamperedVerification.status === 'TAMPERED' && tamperedVerification.verified === false, 'Verification service flags TAMPERED event payload');

  // 4. Advanced Risk Engine
  const aiData = { max_phishing_probability: 0.85 };
  const riskResult = analyzeExposure('Password: secret, Address: Bangalore', 'user@test.com', aiData);
  assert(riskResult.score >= 50, 'Risk score reflects PII and AI factors');
  assert(riskResult.factors && riskResult.factors.phishing_probability === 0.85, 'Factors breakdown contains AI phishing probability');

  // 5. Multi-Source OSINT Registry
  const sources = getEnabledSources();
  assert(sources.length === 4, 'Multi-source registry contains 4 active OSINT source adapters');

  console.log('\n==================================================');
  console.log(`TEST SUMMARY: ${passed} Passed | ${failed} Failed`);
  console.log('==================================================');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
