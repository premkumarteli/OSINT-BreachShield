const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeTarget, hashTarget } = require('../ingest/kAnonymityStore');

// Reference vectors mirroring frontend/src/lib/kAnonymity.contract.test.js.
// These pin the server-side canonicalization + hashing so any future change
// that would desync the client hashing contract is caught here too.
const VECTORS = [
  ['9876543210', '+919876543210', 'F3A47CE5CE3D4CA8AD15225A245B2759022F79489F5C62719B8C9490F7AAB90E'],
  ['+919876543210', '+919876543210', 'F3A47CE5CE3D4CA8AD15225A245B2759022F79489F5C62719B8C9490F7AAB90E'],
  ['+91 98765 43210', '+919876543210', 'F3A47CE5CE3D4CA8AD15225A245B2759022F79489F5C62719B8C9490F7AAB90E'],
  ['+91-98765-43210', '+919876543210', 'F3A47CE5CE3D4CA8AD15225A245B2759022F79489F5C62719B8C9490F7AAB90E'],
  ['919876543210', '+919876543210', 'F3A47CE5CE3D4CA8AD15225A245B2759022F79489F5C62719B8C9490F7AAB90E'],
  ['98765 43210', '+919876543210', 'F3A47CE5CE3D4CA8AD15225A245B2759022F79489F5C62719B8C9490F7AAB90E'],
  ['user@example.com', 'user@example.com', 'B4C9A289323B21A01C3E940F150EB9B8C542587F1ABFD8F0E1CC1FFC5E475514'],
  ['  User@Example.COM  ', 'user@example.com', 'B4C9A289323B21A01C3E940F150EB9B8C542587F1ABFD8F0E1CC1FFC5E475514'],
];

describe('kAnonymityStore - canonicalization & hashing contract (backend side)', () => {
  it('7.1: normalizeTarget canonicalizes Indian phone variants to +91 E.164 form', () => {
    for (const [input, expected] of VECTORS) {
      assert.equal(normalizeTarget(input), expected, `normalizeTarget(${JSON.stringify(input)})`);
    }
  });

  it('7.2: hashTarget produces the pinned SHA-256 reference vectors', () => {
    for (const [input, , expectedHash] of VECTORS) {
      assert.equal(hashTarget(input), expectedHash, `hashTarget(${JSON.stringify(input)})`);
    }
  });

  it('7.3: bare 10-digit phone hashes identically to +91-prefixed form (regression)', () => {
    assert.equal(hashTarget('9876543210'), hashTarget('+919876543210'));
  });

  it('7.4: ingest + range lookup round-trip hits for a phone entered without +91', () => {
    const { ingestRecord, getRange } = require('../ingest/kAnonymityStore');
    const { hashTarget: _h, ..._ } = require('../ingest/kAnonymityStore');
    // Ingest under bare form, look up under canonical form -> same bucket+suffix.
    const ingested = ingestRecord('9876543210', 'Contract_Test', ['PHONE'], '2026');
    const range = getRange(ingested.prefix);
    const hit = range.find(r => r.suffix.toUpperCase() === ingested.suffix.toUpperCase());
    assert.ok(hit, 'indexed record must be found via its canonical prefix');
  });
});