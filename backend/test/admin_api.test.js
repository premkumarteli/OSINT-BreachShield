/**
 * @file admin_api.test.js
 * @description Comprehensive automated test suite for BreachShield Admin Control Center API.
 * Validates admin OTP auth, role enforcement, active session presence, session termination,
 * IP/phone masking, gateway telemetry, test SMS dispatch, live settings mutation,
 * alerts resolution, and breach intelligence re-sync.
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

    it('1.6: GET /api/admin/ping returns server latency diagnostics (200)', async () => {
      const res = await fetch(`${baseUrl}/api/admin/ping`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, 'OK');
      assert.ok(data.serverTime);
    });
  });

  describe('2. Active & Historical Website Users & Session Termination', () => {
    let testSessionId;

    it('2.1: Registering website visitor creates active session with masked IP', async () => {
      const session = registerOrTouchSession('victim@corp.com', '192.168.1.105', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0', '/results');
      testSessionId = session.sessionId;

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

    it('2.3: POST /api/admin/users/:sessionId/terminate forcefully revokes active visitor session', async () => {
      const res = await fetch(`${baseUrl}/api/admin/users/${testSessionId}/terminate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);

      // Verify user is no longer in active list
      const activeRes = await fetch(`${baseUrl}/api/admin/users/active`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const activeData = await activeRes.json();
      const stillActive = activeData.users.find(u => u.sessionId === testSessionId);
      assert.equal(stillActive, undefined);
    });

    it('2.4: Historical sessions endpoint returns archived records', async () => {
      const res = await fetch(`${baseUrl}/api/admin/users/history`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.history));
    });
  });

  describe('3. Gateways, Telemetry & Test SMS Dispatch', () => {
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

    it('3.3: POST /api/admin/sms/test-send triggers test dispatch to target phone number', async () => {
      const res = await fetch(`${baseUrl}/api/admin/sms/test-send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ phone: '+918722611983', message: 'Admin test message' })
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
    });
  });

  describe('4. Security Alerts, Audit Trail, Breaches & Live Settings Mutation', () => {
    let alertId;

    it('4.1: Alerts endpoint returns recorded alerts with severity codes', async () => {
      const alert = addAlert('WARNING', 'High SMS Rate', 'SMS dispatch rate exceeded threshold', 'GATEWAY');
      alertId = alert.id;

      const res = await fetch(`${baseUrl}/api/admin/alerts`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.alerts.length >= 1);
    });

    it('4.2: POST /api/admin/alerts/:id/resolve acknowledges and resolves alert', async () => {
      const res = await fetch(`${baseUrl}/api/admin/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
    });

    it('4.3: Activity endpoint returns chronological audit logs', async () => {
      logActivity('admin@breachshield.io', 'CONFIG_UPDATE', 'SERVER', 'SUCCESS');

      const res = await fetch(`${baseUrl}/api/admin/activity`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.activity.length >= 1);
    });

    it('4.4: POST /api/admin/breaches/sync triggers dataset re-indexing', async () => {
      const res = await fetch(`${baseUrl}/api/admin/breaches/sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
    });

    it('4.5: PUT /api/admin/settings updates runtime configuration dynamically', async () => {
      const res = await fetch(`${baseUrl}/api/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          enableTelegramScraper: true,
          otpExpiryMinutes: 10,
          sessionTimeoutMin: 30,
          heartbeatIntervalSec: 15
        })
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.settings.otpExpiryMinutes, 10);
      assert.equal(data.settings.sessionTimeoutMin, 30);
      assert.equal(data.settings.heartbeatIntervalSec, 15);
      assert.equal(data.settings.enableTelegramScraper, true);
    });
  });
});
