const { computeLeaf, hashPair, buildMerkleTree, verifyProof } = require('../merkleUtils');

describe('Merkle Tree Utilities', () => {
  
  // Helper to generate valid 32-byte (64-char) hex strings
  const validHash = (suffix) => '0x' + suffix.padStart(64, '0').slice(-64);
  
  describe('computeLeaf', () => {
    test('produces consistent 32-byte hash', () => {
      const leaf = computeLeaf('evt_123', validHash('a1b2c3d4').slice(2), 1706745600000);
      expect(leaf).toMatch(/^0x[0-9a-f]{64}$/);
    });

    test('is deterministic', () => {
      const leaf1 = computeLeaf('evt_123', validHash('a1b2c3d4').slice(2), 1706745600000);
      const leaf2 = computeLeaf('evt_123', validHash('a1b2c3d4').slice(2), 1706745600000);
      expect(leaf1).toBe(leaf2);
    });

    test('different inputs produce different hashes', () => {
      const leaf1 = computeLeaf('evt_123', validHash('a1b2c3d4').slice(2), 1706745600000);
      const leaf2 = computeLeaf('evt_124', validHash('a1b2c3d4').slice(2), 1706745600000);
      expect(leaf1).not.toBe(leaf2);
    });
  });

  describe('hashPair', () => {
    test('produces consistent parent hash', () => {
      const left = validHash('a');
      const right = validHash('b');
      const parent = hashPair(left, right);
      expect(parent).toMatch(/^0x[0-9a-f]{64}$/);
    });

    test('order matters (left != right)', () => {
      const left = validHash('a');
      const right = validHash('b');
      const hash1 = hashPair(left, right);
      const hash2 = hashPair(right, left);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('buildMerkleTree', () => {
    test('single leaf: root equals leaf, empty proof', () => {
      const leaves = [validHash('a')];
      const { root, proofs } = buildMerkleTree(leaves);
      
      expect(root).toBe(leaves[0]);
      expect(proofs).toHaveLength(1);
      expect(proofs[0].proof).toEqual([]);
      expect(proofs[0].leafHash).toBe(leaves[0]);
    });

    test('two leaves: root is hash of both, proofs correct', () => {
      const leaves = [
        validHash('a'),
        validHash('b')
      ];
      
      const { root, proofs } = buildMerkleTree(leaves);
      
      // Root should be hash of both leaves
      expect(root).not.toBe(leaves[0]);
      expect(root).not.toBe(leaves[1]);
      
      // Each leaf should have one proof element
      expect(proofs).toHaveLength(2);
      expect(proofs[0].proof).toHaveLength(1);
      expect(proofs[1].proof).toHaveLength(1);
      
      // Verify both proofs
      expect(verifyProof(leaves[0], proofs[0].proof, root)).toBe(true);
      expect(verifyProof(leaves[1], proofs[1].proof, root)).toBe(true);
    });

    test('three leaves: odd count duplicates last leaf', () => {
      const leaves = [
        validHash('a'),
        validHash('b'),
        validHash('c')
      ];
      
      const { root, proofs } = buildMerkleTree(leaves);
      
      expect(root).toMatch(/^0x[0-9a-f]{64}$/);
      expect(proofs).toHaveLength(3);
      
      // All proofs should verify
      proofs.forEach((p, i) => {
        expect(verifyProof(leaves[i], p.proof, root)).toBe(true);
      });
    });

    test('four leaves: perfect binary tree', () => {
      const leaves = [
        validHash('a'),
        validHash('b'),
        validHash('c'),
        validHash('d')
      ];
      
      const { root, proofs } = buildMerkleTree(leaves);
      
      expect(root).toMatch(/^0x[0-9a-f]{64}$/);
      expect(proofs).toHaveLength(4);
      
      // All proofs should verify
      proofs.forEach((p, i) => {
        expect(verifyProof(leaves[i], p.proof, root)).toBe(true);
      });
    });

    test('five leaves: odd with padding', () => {
      const leaves = [
        validHash('a'),
        validHash('b'),
        validHash('c'),
        validHash('d'),
        validHash('e')
      ];
      
      const { root, proofs } = buildMerkleTree(leaves);
      
      expect(root).toMatch(/^0x[0-9a-f]{64}$/);
      expect(proofs).toHaveLength(5);
      
      proofs.forEach((p, i) => {
        expect(verifyProof(leaves[i], p.proof, root)).toBe(true);
      });
    });

    test('throws on empty leaves', () => {
      expect(() => buildMerkleTree([])).toThrow('Cannot build Merkle tree from empty leaves');
    });

    test('proof structure is correct', () => {
      const leaves = [validHash('a'), validHash('b')];
      const { proofs } = buildMerkleTree(leaves);
      
      expect(proofs[0].leafIndex).toBe(0);
      expect(proofs[0].leafHash).toBe(leaves[0]);
      expect(proofs[0].proof).toHaveLength(1);
      expect(proofs[0].proof[0]).toHaveProperty('sibling');
      expect(proofs[0].proof[0]).toHaveProperty('position');
      expect(['left', 'right']).toContain(proofs[0].proof[0].position);
    });
  });

  describe('verifyProof', () => {
    test('valid proof returns true', () => {
      const leaves = [
        validHash('a'),
        validHash('b')
      ];
      const { root, proofs } = buildMerkleTree(leaves);
      
      expect(verifyProof(leaves[0], proofs[0].proof, root)).toBe(true);
      expect(verifyProof(leaves[1], proofs[1].proof, root)).toBe(true);
    });

    test('tampered proof returns false', () => {
      const leaves = [
        validHash('a'),
        validHash('b')
      ];
      const { root, proofs } = buildMerkleTree(leaves);
      
      // Tamper with the proof
      const tamperedProof = [...proofs[0].proof];
      tamperedProof[0].sibling = validHash('c');
      
      expect(verifyProof(leaves[0], tamperedProof, root)).toBe(false);
    });

    test('wrong root returns false', () => {
      const leaves = [
        validHash('a'),
        validHash('b')
      ];
      const { root, proofs } = buildMerkleTree(leaves);
      
      const wrongRoot = validHash('c');
      expect(verifyProof(leaves[0], proofs[0].proof, wrongRoot)).toBe(false);
    });

    test('wrong leaf returns false', () => {
      const leaves = [
        validHash('a'),
        validHash('b')
      ];
      const { root, proofs } = buildMerkleTree(leaves);
      
      const wrongLeaf = validHash('c');
      expect(verifyProof(wrongLeaf, proofs[0].proof, root)).toBe(false);
    });
  });

describe('roundtrip: computeLeaf -> buildMerkleTree -> verifyProof', () => {
    test('full pipeline works with real event data', () => {
      const events = [
        { eventId: 'evt_1', canonicalHash: 'a1b2c3d4'.padStart(64, '0'), timestamp: 1706745600000 },
        { eventId: 'evt_2', canonicalHash: 'e5f607a8'.padStart(64, '0'), timestamp: 1706745601000 },
        { eventId: 'evt_3', canonicalHash: 'abcdef01'.padStart(64, '0'), timestamp: 1706745602000 },
      ];
      
      const leaves = events.map(e => computeLeaf(e.eventId, e.canonicalHash, e.timestamp));
      const { root, proofs } = buildMerkleTree(leaves);
      
      events.forEach((event, i) => {
        const leaf = computeLeaf(event.eventId, event.canonicalHash, event.timestamp);
        expect(verifyProof(leaf, proofs[i].proof, root)).toBe(true);
      });
    });
  });
});