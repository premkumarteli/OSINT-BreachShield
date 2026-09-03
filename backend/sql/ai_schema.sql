-- =============================================================================
-- BreachShield AI Intelligence & Blockchain Audit - Database Schema
-- =============================================================================

-- 1. Phishing Analysis Results
CREATE TABLE IF NOT EXISTS phishing_analysis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  url TEXT NOT NULL,
  classification VARCHAR(32) NOT NULL,
  confidence FLOAT NOT NULL,
  model_name VARCHAR(128) NOT NULL,
  model_version VARCHAR(64) DEFAULT '1.0.0',
  inference_latency_ms INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_classification (classification)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. ML Model Comparisons (CNN vs RNN vs Transformer)
CREATE TABLE IF NOT EXISTS ml_predictions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  target VARCHAR(255) NOT NULL,
  model_architecture VARCHAR(64) NOT NULL,
  prediction VARCHAR(64) NOT NULL,
  probability FLOAT NOT NULL,
  accuracy_metric FLOAT DEFAULT NULL,
  f1_metric FLOAT DEFAULT NULL,
  latency_ms INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_architecture (model_architecture)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Entity & Breach Semantic Correlations
CREATE TABLE IF NOT EXISTS entity_correlations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  record_a VARCHAR(255) NOT NULL,
  record_b VARCHAR(255) NOT NULL,
  matched_fields TEXT DEFAULT NULL,
  similarity_score FLOAT NOT NULL,
  correlation_confidence FLOAT NOT NULL,
  correlation_level VARCHAR(32) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_correlation_level (correlation_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Multi-Source Threat Indicators
CREATE TABLE IF NOT EXISTS threat_indicators (
  id INT AUTO_INCREMENT PRIMARY KEY,
  indicator_type VARCHAR(64) NOT NULL,
  indicator_value VARCHAR(512) NOT NULL,
  source_name VARCHAR(128) NOT NULL,
  risk_score INT DEFAULT 0,
  metadata TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ind_type (indicator_type),
  INDEX idx_ind_val (indicator_value(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Registered OSINT Data Sources
CREATE TABLE IF NOT EXISTS osint_sources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  source_id VARCHAR(64) NOT NULL UNIQUE,
  source_name VARCHAR(128) NOT NULL,
  source_type VARCHAR(64) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_scraped_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Blockchain Audit Logs (Tamper-Evident Ledger Hashes)
CREATE TABLE IF NOT EXISTS blockchain_audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id VARCHAR(128) NOT NULL UNIQUE,
  event_type VARCHAR(64) NOT NULL,
  canonical_hash VARCHAR(64) NOT NULL,
  tx_hash VARCHAR(128) NOT NULL,
  block_number INT DEFAULT 1,
  network_id VARCHAR(64) DEFAULT 'local-dev-chain',
  verification_status VARCHAR(32) DEFAULT 'VALID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_event_id (event_id),
  INDEX idx_canonical_hash (canonical_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
