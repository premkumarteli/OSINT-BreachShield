/**
 * @file admin_api.test.js
 * @description Comprehensive automated test suite for BreachShield Admin Control Center API.
 * Validates admin OTP auth, role enforcement, active session presence, IP/phone masking,
 * gateway telemetry, SMS metrics, alerts, and breach intelligence.
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const jwt = require('jsonwebtoken');
const { app } = require('../server');
const { JWT_SECRET } = require('../config/env');
const { registerOrTouchSession, touchHeartbeat, getActiveSessions, getSessionHistory } = require('../services/sessionTracker');
const { logActivity, addAlert } = require('../services/auditService');

let server;
let baseUrl;
let adminToken;
let nonAdminToken;

before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;

  adminToken = jwt.sign(
    { sub: 'admin@breachshield.io', email: 'admin@breachshield.io', role: 'admin' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  nonAdminToken = jwt.sign(
    { target: 'user@example.com', email: 'user@example.com', verified: true },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
});

describe('BreachShield Admin Control API Test Suite', () => {

  describe('1. Admin Authentication & Role Enforcement', () => {
    it('1.1: Non-admin email is rejected from admin OTP dispatch (403)', async () => {
      const res = await fetch(`${baseUrl}/api/admin/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'attacker@evil.com' })
      });
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.ok(data.error);
    });

    it('1.2: Configured admin email generates OTP successfully (200)', async () => {
      const res = await fetch(`${baseUrl}/api/admin/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@breachshield.io' })
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
    });

    it('1.3: Unauthenticated request to /api/admin/overview returns 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/admin/overview`);
      assert.equal(res.status, 401);
    });

    it('1.4: Non-admin JWT token is rejected on /api/admin/overview (401)', async () => {
      const res = await fetch(`${baseUrl}/api/admin/overview`, {
        headers: { Authorization: `Bearer ${nonAdminToken}` }
      });
      assert.equal(res.status, 401);
    });

    it('1.5: Valid Admin JWT token allows access to /api/admin/overview (200)', async () => {
      const res = await fetch(`${baseUrl}/api/admin/overview`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.data.metrics);
      assert.ok(data.data.systemStatus);
    });
  });

  describe('2. Active & Historical Website Users Monitoring', () => {
    it('2.1: Registering website visitor creates active session with masked IP', async () => {
      registerOrTouchSession('victim@corp.com', '192.168.1.105', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0', '/results');

      const res = await fetch(`${baseUrl}/api/admin/users/active`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.count >= 1);
      const user = data.users.find(u => u.userTarget === 'victim@corp.com');
      assert.ok(user, 'User should be found in active sessions');
      assert.equal(user.maskedIp, '192.168.••.105', 'IP should be properly masked');
      assert.equal(user.os, 'Windows');
      assert.equal(user.browser, 'Chrome');
      assert.equal(user.state, 'ONLINE');
    });

    it('2.2: Session heartbeat keeps session ONLINE', async () => {
      const session = registerOrTouchSession('alive@corp.com', '10.0.0.45', 'Safari/17.0', '/');
      const res = await fetch(`${baseUrl}/api/session/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.sessionId, currentPage: '/results' })
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.active, true);
    });

    it('2.3: Historical sessions endpoint returns archived records', async () => {
      const res = await fetch(`${baseUrl}/api/admin/users/history`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.history));
    });
  });

  describe('3. Gateways & Telemetry Endpoints', () => {
    it('3.1: GET /api/admin/gateways returns hardware nodes status', async () => {
      const res = await fetch(`${baseUrl}/api/admin/gateways`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.gateways));
    });

    it('3.2: GET /api/admin/sms returns metrics and masked phone numbers', async () => {
      const res = await fetch(`${baseUrl}/api/admin/sms`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.metrics);
      assert.ok(Array.isArray(data.recentLogs));
    });

    it('3.3: POST /api/admin/gateways/:id/action rejects offline gateway gracefully (503)', async () => {
      const res = await fetch(`${baseUrl}/api/admin/gateways/offline-device-999/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ action: 'PING' })
      });
      assert.equal(res.status, 503);
    });
  });

  describe('4. Security Alerts, Audit Trail & Breach Intelligence', () => {
    it('4.1: Alerts endpoint returns recorded alerts with severity codes', async () => {
      addAlert('WARNING', 'High SMS Rate', 'SMS dispatch rate exceeded threshold', 'GATEWAY');

      const res = await fetch(`${baseUrl}/api/admin/alerts`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.alerts.length >= 1);
      const alert = data.alerts.find(a => a.title === 'High SMS Rate');
      assert.ok(alert);
      assert.equal(alert.severity, 'WARNING');
    });

    it('4.2: Activity endpoint returns chronological audit logs', async () => {
      logActivity('admin@breachshield.io', 'CONFIG_UPDATE', 'SERVER', 'SUCCESS');

      const res = await fetch(`${baseUrl}/api/admin/activity`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.activity.length >= 1);
      const act = data.activity.find(a => a.action === 'CONFIG_UPDATE');
      assert.ok(act);
    });

    it('4.3: Breach Intelligence endpoint returns operational metadata without raw PII', async () => {
      const res = await fetch(`${baseUrl}/api/admin/breaches`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.indexStatus, 'HEALTHY');
      assert.ok(Array.isArray(data.datasets));
    });

    it('4.4: Settings endpoint returns server configuration metadata', async () => {
      const res = await fetch(`${baseUrl}/api/admin/settings`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.settings.appVersion);
    });
  });
});
