/**
 * OSINT BreachShield - Empirical Deep Adversarial & Stress Challenge Test Suite
 * Focus Areas:
 * 1. Deep Adversarial Gating (403 on missing, empty, malformed, expired, forged, unsigned, tampered JWTs & cookies)
 * 2. Brute-Force & Rate-Limiting Stress (30s cooldown on email/phone, casing/format normalization, 5-attempt lockout & post-lockout valid OTP rejection)
 * 3. WebSocket Disconnect, Abrupt Socket Destruction, Reconnect Bursts, Malformed Frame Fuzzing, Offline SMS Queueing & Event Loop Health
 * 4. Exposure Analytics & Timeline Parser Edge Cases
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { spawn } = require('node:child_process');
const path = require('node:path');
const jwt = require('jsonwebtoken');
const { WebSocket } = require('ws');

const BACKEND_PORT = 5140;
const PYTHON_PORT = 5141;
const BASE_URL = `http://127.0.0.1:${BACKEND_PORT}`;
const WS_URL = `ws://127.0.0.1:${BACKEND_PORT}/ws/gateway`;
const JWT_SECRET = 'deep_adversarial_stress_secret_123890';

let mockPythonServer;
let backendProcess;
const otpMap = new Map();

async function waitForOtp(emailOrPhone, timeoutMs = 6000) {
  const target = String(emailOrPhone).toLowerCase().trim();
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (otpMap.has(target)) {
      return otpMap.get(target);
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`Timeout waiting for OTP for target: ${emailOrPhone}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const makeEmail = (prefix = 'stress') =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@example.com`;

const makePhone = () =>
  `+9198${Math.floor(10000000 + Math.random() * 90000000)}`;

describe('Deep Adversarial Stress & Resiliency Challenge Suite', () => {
  before(async () => {
    // 1. Mock Python OSINT service
    await new Promise((resolve) => {
      mockPythonServer = http.createServer((req, res) => {
        if (req.method === 'POST' && req.url === '/query') {
          let body = '';
          req.on('data', (c) => { body += c; });
          req.on('end', () => {
            let parsed = {};
            try { parsed = JSON.parse(body); } catch (_) {}
            const query = parsed.query || 'unknown@target.com';
            const sampleInfo = `[STRESS THREAT FEED]\nQuery: ${query}\nPassword: adminSecretPass2026\nPhone: +919988776655\nDocument Number: AADHAAR-1234-5678\n**💾 StressBreachDB ** in 2024`;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              response: sampleInfo,
              packets: [{ query, info: sampleInfo }],
              pagination: null
            }));
          });
        } else {
          res.writeHead(404);
          res.end();
        }
      });
      mockPythonServer.listen(PYTHON_PORT, '127.0.0.1', () => resolve());
    });

    // 2. Start Backend Express Server
    await new Promise((resolve, reject) => {
      backendProcess = spawn('node', ['index.js'], {
        cwd: path.join(__dirname, '..'),
        env: {
          ...process.env,
          PORT: String(BACKEND_PORT),
          PYTHON_SERVICE_URL: `http://127.0.0.1:${PYTHON_PORT}/query`,
          JWT_SECRET,
          NODE_ENV: 'test',
          EMAIL_USER: '',
          EMAIL_PASS: '',
          OTP_EXPIRY_MINUTES: '5'
        },
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let started = false;

      backendProcess.stdout.on('data', (chunk) => {
        const text = chunk.toString();
        // Email OTP: [EMAIL OTP] To: ... | Verification Code: 123456
        const emailMatches = text.matchAll(/To:\s*([^\s|]+)\s*\|\s*Verification Code:\s*(\d{6})/g);
        for (const match of emailMatches) {
          otpMap.set(match[1].toLowerCase().trim(), match[2]);
        }
        // SMS OTP: [SMS OTP DISPATCHED] To: ... | Code: 123456
        const smsMatches = text.matchAll(/To:\s*([^\s|]+)\s*\|\s*Code:\s*(\d{6})/g);
        for (const match of smsMatches) {
          otpMap.set(match[1].toLowerCase().trim(), match[2]);
        }

        if (!started && text.includes(`OSINT backend running on port ${BACKEND_PORT}`)) {
          started = true;
          resolve();
        }
      });

      backendProcess.stderr.on('data', (chunk) => {
        console.error('Backend stderr:', chunk.toString());
      });

      backendProcess.on('error', (err) => {
        if (!started) reject(err);
      });

      backendProcess.on('exit', (code) => {
        if (!started) reject(new Error(`Backend exited early with code ${code}`));
      });
    });
  });

  after(async () => {
    if (backendProcess && !backendProcess.killed) {
      backendProcess.kill('SIGTERM');
    }
    if (mockPythonServer) {
      await new Promise((resolve) => mockPythonServer.close(resolve));
    }
  });

  // =========================================================================
  // SECTION 1: Deep Adversarial Gating Tests
  // =========================================================================
  describe('Section 1: Adversarial Route Gating & Token Tampering (/api/search)', () => {
    it('1.1: Omitted Authorization header returns 403', async () => {
      const res = await fetch(`${BASE_URL}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'victim@target.com' })
      });
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.deepEqual(json, { error: 'Verification required' });
    });

    it('1.2: Empty string Authorization header returns 403', async () => {
      const res = await fetch(`${BASE_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': ''
        },
        body: JSON.stringify({ query: 'victim@target.com' })
      });
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.deepEqual(json, { error: 'Verification required' });
    });

    it('1.3: Bearer prefix with empty payload returns 403', async () => {
      const res = await fetch(`${BASE_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer '
        },
        body: JSON.stringify({ query: 'victim@target.com' })
      });
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.deepEqual(json, { error: 'Verification required' });
    });

    it('1.4: Malformed JWT structures return 403', async () => {
      const malformedJwts = [
        'Bearer null',
        'Bearer undefined',
        'Bearer [object Object]',
        'Bearer {"token": "fake"}',
        'Bearer abc',
        'Bearer a.b',
        'Bearer a.b.c.d',
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0',
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidbase64!@#$.sig',
      ];

      for (const authHeader of malformedJwts) {
        const res = await fetch(`${BASE_URL}/api/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify({ query: 'victim@target.com' })
        });
        assert.equal(res.status, 403, `Expected 403 for header: ${authHeader}`);
        const json = await res.json();
        assert.deepEqual(json, { error: 'Verification required' });
      }
    });

    it('1.5: Unsigned algorithm "none" token returns 403', async () => {
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ email: 'hacker@target.com', verified: true })).toString('base64url');
      const unsignedJwt = `Bearer ${header}.${payload}.`;

      const res = await fetch(`${BASE_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': unsignedJwt
        },
        body: JSON.stringify({ query: 'hacker@target.com' })
      });
      assert.equal(res.status, 403, 'Unsigned alg:none JWT must return 403');
      const json = await res.json();
      assert.deepEqual(json, { error: 'Verification required' });
    });

    it('1.6: Forged JWT signed with wrong secret key returns 403', async () => {
      const forgedToken = jwt.sign(
        { email: 'hacker@target.com', verified: true },
        'attacker_private_secret_999999'
      );

      const res = await fetch(`${BASE_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${forgedToken}`
        },
        body: JSON.stringify({ query: 'victim@target.com' })
      });
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.deepEqual(json, { error: 'Verification required' });
    });

    it('1.7: Expired JWT returns 403', async () => {
      const expiredToken = jwt.sign(
        { email: 'victim@target.com', verified: true },
        JWT_SECRET,
        { expiresIn: -60 }
      );

      const res = await fetch(`${BASE_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${expiredToken}`
        },
        body: JSON.stringify({ query: 'victim@target.com' })
      });
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.deepEqual(json, { error: 'Verification required' });
    });

    it('1.8: Valid JWT signature with forged/invalid claims (verified: false, verified: 0, verified: null, missing verified) returns 403', async () => {
      const claimVariations = [
        { email: 'user1@target.com', verified: false },
        { email: 'user2@target.com', verified: 0 },
        { email: 'user3@target.com', verified: 'true' },
        { email: 'user4@target.com', verified: null },
        { email: 'user5@target.com' }
      ];

      for (const claims of claimVariations) {
        const token = jwt.sign(claims, JWT_SECRET, { expiresIn: '1h' });
        const res = await fetch(`${BASE_URL}/api/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ query: 'victim@target.com' })
        });
        assert.equal(res.status, 403, `Claims ${JSON.stringify(claims)} must return 403`);
        const json = await res.json();
        assert.deepEqual(json, { error: 'Verification required' });
      }
    });

    it('1.9: Invalid cookies (otp_token / token) return 403', async () => {
      const invalidCookies = [
        'otp_token=forged.invalid.token',
        'otp_token=',
        'token=tampered.token.here',
        `otp_token=${jwt.sign({ verified: false }, JWT_SECRET)}`
      ];

      for (const cookieHeader of invalidCookies) {
        const res = await fetch(`${BASE_URL}/api/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': cookieHeader
          },
          body: JSON.stringify({ query: 'victim@target.com' })
        });
        assert.equal(res.status, 403, `Cookie "${cookieHeader}" must return 403`);
        const json = await res.json();
        assert.deepEqual(json, { error: 'Verification required' });
      }
    });
  });

  // =========================================================================
  // SECTION 2: Brute-Force & Rate-Limiting Stress
  // =========================================================================
  describe('Section 2: Rate-Limiting Cooldown & Brute-Force Lockout Stress', () => {
    it('2.1: 30-second cooldown strictly enforced on Email /api/auth/send-otp', async () => {
      const email = makeEmail('cooldown_email');
      
      const res1 = await fetch(`${BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      assert.equal(res1.status, 200);

      // Immediate burst of 5 requests -> all must return 429
      for (let i = 0; i < 5; i++) {
        const burstRes = await fetch(`${BASE_URL}/api/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        assert.equal(burstRes.status, 429, `Burst attempt ${i + 1} must return 429`);
        const json = await burstRes.json();
        assert.equal(json.success, false);
        assert.match(json.error, /Please wait \d+ seconds before requesting a new OTP/);
      }
    });

    it('2.2: 30-second cooldown strictly enforced on Phone Number /api/auth/send-otp', async () => {
      const phone = makePhone();

      const res1 = await fetch(`${BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      assert.equal(res1.status, 200);

      const res2 = await fetch(`${BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      assert.equal(res2.status, 429);
      const json2 = await res2.json();
      assert.equal(json2.success, false);
      assert.match(json2.error, /Please wait \d+ seconds/);
    });

    it('2.3: Target normalization prevents cooldown bypass (Email case & whitespace)', async () => {
      const base = makeEmail('case_bypass');
      const emailLower = base.toLowerCase();
      const emailMixed = `  ${emailLower.toUpperCase()}  `;

      const res1 = await fetch(`${BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailLower })
      });
      assert.equal(res1.status, 200);

      const res2 = await fetch(`${BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailMixed })
      });
      assert.equal(res2.status, 429, 'Target variations must not bypass cooldown');
    });

    it('2.4: 5-attempt brute-force lockout on /api/auth/verify-otp with remaining counter verification', async () => {
      const email = makeEmail('bruteforce_lockout');
      await fetch(`${BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const validCode = await waitForOtp(email);
      const bogusCode = '000000';

      for (let attempt = 1; attempt <= 4; attempt++) {
        const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp: bogusCode })
        });
        assert.equal(res.status, 400, `Attempt ${attempt} should return 400`);
        const json = await res.json();
        assert.equal(json.attemptsRemaining, 5 - attempt);
      }

      const res5 = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: bogusCode })
      });
      assert.ok([400, 429].includes(res5.status));
      const json5 = await res5.json();
      assert.equal(json5.attemptsRemaining, 0);

      const res6 = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: validCode })
      });
      assert.equal(res6.status, 429, 'Locked account must reject valid OTP with 429');
      const json6 = await res6.json();
      assert.equal(json6.success, false);
      assert.match(json6.error, /Maximum verification attempts exceeded/);
    });

    it('2.5: Concurrent brute-force burst on verify-otp locks out properly', async () => {
      const email = makeEmail('concurrent_brute');
      await fetch(`${BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const validCode = await waitForOtp(email);

      const parallelPromises = Array.from({ length: 10 }).map((_, idx) =>
        fetch(`${BASE_URL}/api/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp: `11111${idx}` })
        })
      );
      await Promise.all(parallelPromises);

      const resAfter = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: validCode })
      });
      assert.equal(resAfter.status, 429, 'Locked out after parallel burst');
    });
  });

  // =========================================================================
  // SECTION 3: WebSocket Disconnect & Pending Queue Stress
  // =========================================================================
  describe('Section 3: WebSocket Disconnect, Abrupt Drop, Reconnect & Queueing Stress', () => {
    it('3.1: Android Gateway WS handshake, auth, ping/pong heartbeat roundtrip', async () => {
      const ws = new WebSocket(WS_URL);
      const testDeviceId = `device_stress_auth_${Date.now()}`;

      await new Promise((resolve, reject) => {
        ws.on('open', resolve);
        ws.on('error', reject);
      });

      // 1. Send Handshake Auth
      ws.send(JSON.stringify({ deviceId: testDeviceId, token: 'gateway_test_token' }));
      const authMsg = await new Promise((resolve) => {
        ws.once('message', (msg) => resolve(JSON.parse(msg.toString())));
      });
      assert.equal(authMsg.type, 'AUTH_SUCCESS');
      assert.equal(authMsg.deviceId, testDeviceId);

      // 2. Ping / Pong text heartbeat (matching Android WebSocketManager.kt)
      ws.send('ping');
      const pongMsg = await new Promise((resolve) => {
        ws.once('message', (msg) => resolve(msg.toString()));
      });
      assert.equal(pongMsg, 'pong');

      ws.close();
      await sleep(100);
    });

    it('3.2: Abrupt socket destruction (.destroy()) does not crash Node event loop and updates state', async () => {
      const ws = new WebSocket(WS_URL);
      const testDeviceId = `device_abrupt_${Date.now()}`;

      await new Promise((resolve) => ws.on('open', resolve));
      ws.send(JSON.stringify({ deviceId: testDeviceId }));
      await new Promise((resolve) => ws.once('message', resolve));

      // Abruptly destroy underlying TCP socket
      ws._socket.destroy();
      await sleep(150);

      // Verify server is alive and responding cleanly to HTTP health check
      const healthRes = await fetch(`${BASE_URL}/health`);
      assert.equal(healthRes.status, 200);
      const healthJson = await healthRes.json();
      assert.equal(healthJson.ok, true);
    });

    it('3.3: Queue SMS jobs when gateway is offline, fetch via GET /api/gateway/pending/:deviceId', async () => {
      const offlineDeviceId = `device_offline_${Date.now()}`;

      // 1. Register device
      const regRes = await fetch(`${BASE_URL}/api/gateway/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: offlineDeviceId,
          deviceName: 'Stress Test Device',
          manufacturer: 'Samsung',
          model: 'Galaxy S24',
          androidVersion: '14'
        })
      });
      assert.equal(regRes.status, 200);

      // 2. Queue 3 SMS dispatch jobs for the offline device
      for (let i = 1; i <= 3; i++) {
        const smsRes = await fetch(`${BASE_URL}/api/gateway/send-sms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceId: offlineDeviceId,
            phoneNumber: `+91980000000${i}`,
            message: `Stress pending SMS payload #${i}`,
            requestId: `stress_req_${offlineDeviceId}_${i}`
          })
        });
        assert.equal(smsRes.status, 200);
        const smsJson = await smsRes.json();
        assert.equal(smsJson.success, true);
        assert.equal(smsJson.status, 'PENDING');
      }

      // 3. Query pending jobs endpoint
      const pendingRes = await fetch(`${BASE_URL}/api/gateway/pending/${offlineDeviceId}`);
      assert.equal(pendingRes.status, 200);
      const pendingJson = await pendingRes.json();
      assert.equal(pendingJson.success, true);
      assert.equal(pendingJson.deviceId, offlineDeviceId);
      assert.equal(pendingJson.count, 3);
      assert.equal(pendingJson.jobs.length, 3);
      assert.equal(pendingJson.jobs[0].requestId, `stress_req_${offlineDeviceId}_1`);
      assert.equal(pendingJson.jobs[0].message, 'Stress pending SMS payload #1');

      // 4. Update SMS status to DELIVERED via HTTP API
      const statusRes = await fetch(`${BASE_URL}/api/gateway/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: `stress_req_${offlineDeviceId}_1`,
          deviceId: offlineDeviceId,
          status: 'DELIVERED'
        })
      });
      assert.equal(statusRes.status, 200);

      // 5. Query pending jobs again -> now 2 remaining
      const pendingRes2 = await fetch(`${BASE_URL}/api/gateway/pending/${offlineDeviceId}`);
      const pendingJson2 = await pendingRes2.json();
      assert.equal(pendingJson2.count, 2);
    });

    it('3.4: Stress: Rapid burst of 25 parallel WebSocket connections, data exchanges, and disconnections', async () => {
      const connectionsCount = 25;
      const wsClients = [];

      const openPromises = Array.from({ length: connectionsCount }).map((_, idx) => {
        return new Promise((resolve, reject) => {
          const ws = new WebSocket(WS_URL);
          const devId = `stress_burst_device_${idx}_${Date.now()}`;
          wsClients.push({ ws, devId });

          ws.on('open', () => {
            ws.send(JSON.stringify({ deviceId: devId }));
          });

          ws.on('message', (raw) => {
            try {
              const msg = JSON.parse(raw.toString());
              if (msg.type === 'AUTH_SUCCESS') {
                resolve();
              }
            } catch (_) {}
          });

          ws.on('error', reject);
        });
      });

      await Promise.all(openPromises);

      // Randomly terminate half via .destroy() and half via .close()
      for (let i = 0; i < wsClients.length; i++) {
        if (i % 2 === 0) {
          if (wsClients[i].ws._socket) wsClients[i].ws._socket.destroy();
        } else {
          wsClients[i].ws.close();
        }
      }

      await sleep(200);

      // Verify event loop health
      const healthRes = await fetch(`${BASE_URL}/health`);
      assert.equal(healthRes.status, 200);
      const healthJson = await healthRes.json();
      assert.equal(healthJson.ok, true);
    });

    it('3.5: Stress: Fuzzing with malformed non-JSON messages and oversized frames', async () => {
      const ws = new WebSocket(WS_URL);
      await new Promise((resolve) => ws.on('open', resolve));

      const fuzzPayloads = [
        '{ malformed json: true, ',
        'null',
        '',
        '   ',
        '\\x00\\x01\\x02\\x03',
        JSON.stringify({ deviceId: '' }),
        JSON.stringify({ type: 'UNKNOWN_TYPE_ACTION_9999' }),
        Buffer.alloc(16 * 1024, 'A').toString()
      ];

      for (const payload of fuzzPayloads) {
        ws.send(payload);
      }

      await sleep(150);

      // Heartbeat ping must still work
      ws.send('ping');
      const pong = await new Promise((resolve) => {
        ws.once('message', (msg) => resolve(msg.toString()));
      });
      assert.equal(pong, 'pong');

      ws.close();
      await sleep(100);

      // Check server health
      const healthRes = await fetch(`${BASE_URL}/health`);
      assert.equal(healthRes.status, 200);
    });
  });

  // =========================================================================
  // SECTION 4: Full-Stack OSINT Analytics & Timeline Stress
  // =========================================================================
  describe('Section 4: Exposure Risk Engine & Timeline Stress with Adversarial Inputs', () => {
    it('4.1: Risk engine handles massive 500KB text without catastrophic backtracking or crash', () => {
      const { analyzeExposure } = require('../analytics/riskEngine');
      const massiveText = ('Password: leakedPass123\nPhone: +919876543210\nDocument Number: AADHAAR-9988-7766\nAddress: 123 Cyber Security Lane\nFather Name: John Doe Sr\n' + 'Filler data line with no secrets\n'.repeat(500)).repeat(50);
      
      const start = Date.now();
      const result = analyzeExposure(massiveText, 'target@example.com');
      const duration = Date.now() - start;

      assert.ok(duration < 2000, `Analytics took ${duration}ms, must be < 2000ms`);
      assert.equal(result.riskLevel, 'CRITICAL');
      assert.ok(result.score >= 75);
    });

    it('4.2: Timeline parser handles adversarial dates, negative years, and corrupt formats', () => {
      const { parseBreachTimeline } = require('../analytics/timelineParser');
      const corruptBreachText = `
        **💾 CorruptDB1 ** in 1850 leaked something.
        **💾 CorruptDB2 ** in 2099 leaked something futuristic.
        **💾 CorruptDB3 ** in Year -500 leaked ancient records.
        **💾 ValidDB ** in 2022 leaked 10M rows.
        **💾 ValidDB2 ** in 2018 leaked 5M rows.
      `;

      const events = parseBreachTimeline(corruptBreachText);
      assert.ok(Array.isArray(events));
      assert.ok(events.length > 0);
      for (let i = 1; i < events.length; i++) {
        assert.ok(events[i].year >= events[i - 1].year);
      }
    });
  });
});
