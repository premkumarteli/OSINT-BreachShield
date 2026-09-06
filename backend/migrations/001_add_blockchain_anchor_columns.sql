-- Migration: Add blockchain anchoring columns to audit logs
-- Version: 1
-- Description: Add columns for Merkle tree anchoring on Polygon Amoy
-- Created: 2026-01-15

-- Check if table exists first
CREATE TABLE IF NOT EXISTS blockchain_audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(255) NOT NULL,
  canonical_hash CHAR(64) NOT NULL,
  tx_hash CHAR(66) NOT NULL,
  block_number INT DEFAULT 1,
  network_id VARCHAR(255) DEFAULT 'sha256-audit-chain',
  verification_status VARCHAR(50) DEFAULT 'VALID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add Merkle tree anchoring columns
ALTER TABLE blockchain_audit_logs
ADD COLUMN merkleRoot CHAR(66) NULL COMMENT '0x-prefixed 32-byte Merkle root',
ADD COLUMN merkleProof JSON NULL COMMENT 'Merkle inclusion proof [{sibling, position}...]',
ADD COLUMN anchorTxHash CHAR(66) NULL COMMENT '0x-prefixed transaction hash',
ADD COLUMN anchorBlockNumber BIGINT NULL COMMENT 'Block number where Merkle root was anchored',
ADD COLUMN anchorNetwork VARCHAR(50) NULL COMMENT 'Blockchain network (e.g., polygon-amoy)',
ADD COLUMN anchoredAt DATETIME NULL COMMENT 'Timestamp when root was anchored on-chain';

-- Add indexes for common queries
CREATE INDEX idx_blockchain_audit_event_id ON blockchain_audit_logs (event_id);
CREATE INDEX idx_blockchain_audit_merkle_root ON blockchain_audit_logs (merkleRoot);
CREATE INDEX idx_blockchain_audit_anchor_block ON blockchain_audit_logs (anchorBlockNumber);
CREATE INDEX idx_blockchain_audit_anchored_at ON blockchain_audit_logs (anchoredAt);

-- Rollback script (for reference)
-- ALTER TABLE blockchain_audit_logs
-- DROP COLUMN merkleRoot,
-- DROP COLUMN merkleProof,
-- DROP COLUMN anchorTxHash,
-- DROP COLUMN anchorBlockNumber,
-- DROP COLUMN anchorNetwork,
-- DROP COLUMN anchoredAt;
-- DROP INDEX idx_blockchain_audit_merkle_root;
-- DROP INDEX idx_blockchain_audit_anchor_block;
-- DROP INDEX idx_blockchain_audit_anchored_at;