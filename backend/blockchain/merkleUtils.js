const crypto = require('crypto');
const { ethers } = require('ethers');

/**
 * Compute Merkle leaf hash for an audit event
 * Leaf = keccak256(abi.encodePacked(eventId, canonicalHash, timestamp))
 * @param {string} eventId
 * @param {string} canonicalHash - 64-char hex (no 0x)
 * @param {number} timestamp - Unix milliseconds
 * @returns {string} 0x-prefixed 32-byte leaf hash
 */
function computeLeaf(eventId, canonicalHash, timestamp) {
  const encoder = ethers.AbiCoder.defaultAbiCoder();
  const encoded = encoder.encode(
    ['string', 'bytes32', 'uint64'],
    [eventId, '0x' + canonicalHash, BigInt(timestamp)]
  );
  return ethers.keccak256(encoded);
}

/**
 * Compute parent hash from two child hashes
 * @param {string} left - 0x-prefixed 32-byte hash
 * @param {string} right - 0x-prefixed 32-byte hash
 * @returns {string} 0x-prefixed parent hash
 */
function hashPair(left, right) {
  return ethers.keccak256(Buffer.concat([
    Buffer.from(left.slice(2), 'hex'),
    Buffer.from(right.slice(2), 'hex')
  ]));
}

/**
 * Build Merkle tree from leaves
 * @param {string[]} leaves - Array of 0x-prefixed leaf hashes
 * @returns {Object} { root, proofs } where proofs[leafIndex] = sibling path
 */
function buildMerkleTree(leaves) {
  if (leaves.length === 0) {
    throw new Error('Cannot build Merkle tree from empty leaves');
  }

  const proofs = leaves.map(() => []);

  // Each node tracks which original leaf indices it represents
  let currentLevel = leaves.map((leaf, index) => ({ 
    hash: leaf, 
    leafIndices: [index]  // Track which original leaf indices this node represents
  }));

  while (currentLevel.length > 1) {
    const nextLevel = [];
    
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = currentLevel[i + 1] || left; // Duplicate last if odd
      
      const parentHash = hashPair(left.hash, right.hash);
      
      // Record proof for all leaf indices in left node
      for (const leafIdx of left.leafIndices) {
        proofs[leafIdx].push({
          sibling: right.hash,
          position: 'right'
        });
      }
      
      // Record proof for right child (if not duplicate)
      // Use Set to avoid duplicate indices from padding
      if (right !== left) {
        const rightIndices = [...new Set(right.leafIndices)];
        for (const leafIdx of rightIndices) {
          proofs[leafIdx].push({
            sibling: left.hash,
            position: 'left'
          });
        }
      }
      
      // Combine leaf indices for parent (deduplicate to handle padding)
      const combinedLeafIndices = [...new Set([...left.leafIndices, ...right.leafIndices])];
      nextLevel.push({ hash: parentHash, leafIndices: combinedLeafIndices });
    }
    
    currentLevel = nextLevel;
  }

  return {
    root: currentLevel[0].hash,
    proofs: leaves.map((leafHash, index) => ({
      leafIndex: index,
      leafHash,
      proof: proofs[index] // Leaf to root order for verification
    }))
  };
}

/**
 * Verify a Merkle proof
 * @param {string} leafHash - 0x-prefixed leaf hash
 * @param {Object[]} proof - Array of { sibling, position }
 * @param {string} expectedRoot - Expected Merkle root
 * @returns {boolean}
 */
function verifyProof(leafHash, proof, expectedRoot) {
  let currentHash = leafHash;
  
  for (const { sibling, position } of proof) {
    if (position === 'left') {
      currentHash = hashPair(sibling, currentHash);
    } else {
      currentHash = hashPair(currentHash, sibling);
    }
  }
  
  return currentHash.toLowerCase() === expectedRoot.toLowerCase();
}

module.exports = {
  computeLeaf,
  hashPair,
  buildMerkleTree,
  verifyProof
};