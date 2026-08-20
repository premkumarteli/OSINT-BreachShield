/**
 * @file auditService.js
 * @description Centralized audit logging and system alert manager.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');
const AUDIT_FILE = path.join(DATA_DIR, 'audit_logs.json');
const ALERTS_FILE = path.join(DATA_DIR, 'alerts.json');

let auditLogs = [];
let alerts = [];

function loadData() {
  try {
    if (fs.existsSync(AUDIT_FILE)) {
      auditLogs = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf8') || '[]');
    }
    if (fs.existsSync(ALERTS_FILE)) {
      alerts = JSON.parse(fs.readFileSync(ALERTS_FILE, 'utf8') || '[]');
    }
  } catch (e) {
    console.warn('Failed to load audit/alerts, starting fresh:', e.message);
  }
}

function saveData() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(auditLogs.slice(-500), null, 2), 'utf8');
    fs.writeFileSync(ALERTS_FILE, JSON.stringify(alerts.slice(-200), null, 2), 'utf8');
  } catch (e) {
    console.warn('Failed to save audit/alerts:', e.message);
  }
}

loadData();

function logActivity(actor, action, target, result = 'SUCCESS', metadata = {}) {
  const entry = {
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    actor: actor || 'SYSTEM',
    action,
    target: target || 'N/A',
    result,
    metadata,
    timestamp: Date.now()
  };
  auditLogs.unshift(entry);
  saveData();
  return entry;
}

function addAlert(severity, title, description, source = 'SYSTEM') {
  const validSeverities = ['INFO', 'WARNING', 'HIGH', 'CRITICAL'];
  const sev = validSeverities.includes(severity) ? severity : 'INFO';
  const alert = {
    id: `alt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    severity: sev,
    title,
    description,
    source,
    timestamp: Date.now(),
    acknowledged: false
  };
  alerts.unshift(alert);
  saveData();
  return alert;
}

function getAuditLogs(limit = 50) {
  return auditLogs.slice(0, limit);
}

function getAlerts(limit = 50) {
  return alerts.slice(0, limit);
}

module.exports = {
  logActivity,
  addAlert,
  getAuditLogs,
  getAlerts
};
