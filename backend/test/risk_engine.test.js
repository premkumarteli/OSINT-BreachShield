const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { analyzeExposure } = require('../analytics/riskEngine');

describe('Risk Engine - Cross-Record Entity Correlation', () => {
  it('8.1: reports zero correlation when a single record is present', () => {
    const result = analyzeExposure('Password: secret123\ndocument number: AADHAAR-1234-5678', 'victim@example.com');
    assert.equal(result.entities.correlatedRecordPairs, 0);
    assert.equal(result.factors.correlation_score, 0);
    assert.ok(!result.breakdown.some(f => f.factor === 'Cross-Record Entity Correlation'));
  });

  it('8.2: detects shared identity fields across two records and adds correlation points', () => {
    const text = [
      '**💾 Canva**',
      'email: victim@example.com',
      'password: abc123',
      '',
      '**💾 Dominos**',
      'email: victim@example.com',
      'password: xyz789'
    ].join('\n');

    const result = analyzeExposure(text, 'victim@example.com');
    assert.equal(result.entities.correlatedRecordPairs, 1);
    assert.equal(result.entities.totalRecordPairs, 1);
    assert.ok(result.entities.sharedFieldTypes.includes('email'));
    assert.equal(result.factors.correlation_score, 1);

    const factor = result.breakdown.find(f => f.factor === 'Cross-Record Entity Correlation');
    assert.ok(factor, 'breakdown must include Cross-Record Entity Correlation factor');
    assert.ok(factor.points >= 1, 'correlation factor contributes risk points');
  });

  it('8.3: distinguishes independent (non-sharing) records from correlated ones', () => {
    const text = [
      '**💾 Canva**',
      'email: alice@example.com',
      'password: abc123',
      '',
      '**💾 Dominos**',
      'email: bob@example.com',
      'password: xyz789'
    ].join('\n');

    const result = analyzeExposure(text, 'alice@example.com');
    assert.equal(result.entities.correlatedRecordPairs, 0);
    assert.equal(result.factors.correlation_score, 0);
    assert.ok(!result.breakdown.some(f => f.factor === 'Cross-Record Entity Correlation'));
  });

  it('8.4: clean / no-results response keeps consistent correlation shape', () => {
    const result = analyzeExposure('No results found for target query.', 'victim@example.com');
    assert.equal(result.entities.correlatedRecordPairs, 0);
    assert.equal(result.entities.totalRecordPairs, 0);
    assert.deepEqual(result.entities.sharedFieldTypes, []);
    assert.equal(result.factors.correlation_score, 0);
  });
});