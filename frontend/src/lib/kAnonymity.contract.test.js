/**
 * CONTRACT TEST: frontend k-anonymity hashing MUST produce byte-identical
 * SHA-256 digests to backend ingest/kAnonymityStore.js for the same input.
 *
 * Reference vectors below were generated with the real backend:
 *   backend/ingest/kAnonymityStore.js -> normalizeTarget() + hashTarget()
 * The backend canonicalizes phones (bare 10-digit -> +91...) before hashing.
 * The frontend (kAnonymity.js) must replicate that exactly, otherwise the
 * client computes a different prefix than the server indexed -> silent misses.
 *
 * If you change either side's normalization, regenerate these vectors from the
 * backend and update them together with the code — do not drift them apart.
 */
import { computeSha256, normalizeTarget } from './kAnonymity';

const REFERENCE_VECTORS = [
  // input, normalizeTarget expected, full SHA-256 expected
  ['9876543210', '+919876543210', 'F3A47CE5CE3D4CA8AD15225A245B2759022F79489F5C62719B8C9490F7AAB90E'],
  ['+919876543210', '+919876543210', 'F3A47CE5CE3D4CA8AD15225A245B2759022F79489F5C62719B8C9490F7AAB90E'],
  ['+91 98765 43210', '+919876543210', 'F3A47CE5CE3D4CA8AD15225A245B2759022F79489F5C62719B8C9490F7AAB90E'],
  ['+91-98765-43210', '+919876543210', 'F3A47CE5CE3D4CA8AD15225A245B2759022F79489F5C62719B8C9490F7AAB90E'],
  ['919876543210', '+919876543210', 'F3A47CE5CE3D4CA8AD15225A245B2759022F79489F5C62719B8C9490F7AAB90E'],
  ['98765 43210', '+919876543210', 'F3A47CE5CE3D4CA8AD15225A245B2759022F79489F5C62719B8C9490F7AAB90E'],
  ['user@example.com', 'user@example.com', 'B4C9A289323B21A01C3E940F150EB9B8C542587F1ABFD8F0E1CC1FFC5E475514'],
  ['  User@Example.COM  ', 'user@example.com', 'B4C9A289323B21A01C3E940F150EB9B8C542587F1ABFD8F0E1CC1FFC5E475514'],
  ['victim@test.io', 'victim@test.io', 'E677DD2EDB9B71FC6BADFC83D516FE07CD96BDAA4EE6CEC3D81CD49B75270447'],
  ['+447911123456', '+447911123456', '20B18AC9DE7B3AAD174961827D8E451C410AF9AEDFD1D699927F4B29B81AA1FA'],
  ['447911123456', '447911123456', '40B5C38342A9C584EC707E8679B003F8C779C6AAA138C976EF94E049CC05208F'],
];

describe('k-anonymity hashing contract (frontend vs pinned backend refs)', () => {
  test.each(REFERENCE_VECTORS)(
    'client SHA-256 matches backend for "%s"',
    async (input, _expectedNormalized, expectedHash) => {
      const clientHash = await computeSha256(input);
      expect(clientHash).toBe(expectedHash);
      expect(clientHash).toMatch(/^[0-9A-F]{64}$/);
    }
  );

  test.each(REFERENCE_VECTORS)(
    'normalizeTarget mirrors backend for "%s"',
    (input, expectedNormalized) => {
      expect(normalizeTarget(input)).toBe(expectedNormalized);
    }
  );

  test('bare 10-digit phone hashes identically to +91-prefixed form (the original bug)', async () => {
    const bare = await computeSha256('9876543210');
    const prefixed = await computeSha256('+919876543210');
    expect(bare).toBe(prefixed);
    expect(bare.slice(0, 5)).toBe('F3A47');
  });
});