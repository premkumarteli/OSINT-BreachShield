-- =============================================================================
-- BreachShield SMS Gateway - MySQL Database Schema Migration
-- =============================================================================

-- 1. Registered Android SMS Gateway Devices
CREATE TABLE IF NOT EXISTS gateway_devices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id VARCHAR(128) NOT NULL UNIQUE,
  device_name VARCHAR(255) DEFAULT 'Android Gateway',
  manufacturer VARCHAR(128) DEFAULT NULL,
  model VARCHAR(128) DEFAULT NULL,
  android_version VARCHAR(64) DEFAULT NULL,
  android_id VARCHAR(128) DEFAULT NULL,
  sim_ready BOOLEAN DEFAULT TRUE,
  gateway_token VARCHAR(512) DEFAULT NULL,
  status ENUM('ONLINE', 'OFFLINE', 'BUSY') DEFAULT 'ONLINE',
  battery_level INT DEFAULT NULL,
  signal_strength INT DEFAULT NULL,
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_device_id (device_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Queued and Active SMS Dispatch Jobs
CREATE TABLE IF NOT EXISTS sms_jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id VARCHAR(128) NOT NULL UNIQUE,
  device_id VARCHAR(128) NOT NULL,
  phone_number VARCHAR(32) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('PENDING', 'SENT', 'DELIVERED', 'FAILED') DEFAULT 'PENDING',
  error_reason TEXT DEFAULT NULL,
  attempts INT DEFAULT 0,
  sent_at TIMESTAMP NULL DEFAULT NULL,
  delivered_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_request_id (request_id),
  INDEX idx_device_id_status (device_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Historical SMS Delivery Audit Logs
CREATE TABLE IF NOT EXISTS sms_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id VARCHAR(128) NOT NULL,
  device_id VARCHAR(128) NOT NULL,
  phone_number VARCHAR(32) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(32) NOT NULL,
  error_reason TEXT DEFAULT NULL,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_req_dev (request_id, device_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
