/**
 * OSINT BreachShield - Empirical Backend Security Challenger Test Suite
 * Adversarially tests route gating, OTP integrity, token forgery, rate-limiting, legacy route purging, and analytics.
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { spawn } = require('node:child_process');
const path = require('node:path');
const jwt = require('jsonwebtoken');

const BACKEND_PORT = 5120;
const PYTHON_PORT = 5121;
const BASE_URL = `http://127.0.0.1:${BACKEND_PORT}`;
const JWT_SECRET = 'challenger_test_jwt_secret_998877';

let mockPythonServer;
let backendProcess;
const otpMap = new Map();

// Helper to wait for an OTP to appear in backend stdout logs
async function waitForOtp(email, timeoutMs = 6000) {
  const target = String(email).toLowerCase().trim();
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (otpMap.has(target)) {
      return otpMap.get(target);
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`Timeout waiting for OTP for email: ${email}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const makeEmail = (prefix = 'challenger') =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@example.com`;

describe('Adversarial Backend Security Challenge Suite', () => {
  before(async () => {
    // 1. Mock Python Service
    await new Promise((resolve) => {
      mockPythonServer = http.createServer((req, res) => {
        if (req.method === 'POST' && req.url === '/query') {
          let body = '';
          req.on('data', (c) => { body += c; });
          req.on('end', () => {
            let parsed = {};
            try { parsed = JSON.parse(body); } catch (_) {}
            const query = parsed.query || 'unknown@example.com';
            const sampleInfo = `[TELEGRAM THREAT FEED]\nQuery: ${query}\nPassword: leakedSecretPass999\nPhone: +1-555-8888\nDocument Number: DL9876543\n**💾 AdversarialLeakCorp ** in 2023`;
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
          OTP_EXPIRY_MINUTES: '5',
          ENABLE_TELEGRAM_SCRAPER: 'true'
        },
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let started = false;

      backendProcess.stdout.on('data', (chunk) => {
        const text = chunk.toString();
        // Extract OTP prints: [EMAIL OTP] To: ... | Verification Code: 123456
        const matches = text.matchAll(/To:\s*([^\s|]+)\s*\|\s*Verification Code:\s*(\d{6})/g);
        for (const match of matches) {
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
  // CHALLENGE 1: Unverified POST /api/search Security & Route Gating
  // =========================================================================
  describe('Challenge 1: POST /api/search Route Gating & Token Tampering', () => {
    it('1.1: Request with no headers / no cookies returns 403 Forbidden with exact error payload', async () => {
      const res = await fetch(`${BASE_URL}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'victim@target.com', searchType: 'Email' })
      });

      assert.equal(res.status, 403, 'Expected 403 Forbidden');
      const json = await res.json();
      assert.deepEqual(json, { error: 'Verification required' });
    });

    it('1.2: Request with invalid Authorization header schemes and malformed strings returns 403', async () => {
      const invalidAuthHeaders = [
        'Bearer',
        'Bearer ',
        'Basic dXNlcjpwYXNz',
        'Token 123456',
        'Bearer not-a-valid-jwt',
        'Bearer 123.456.789',
        'Bearer eyJhbGciOiJIUzI1NiJ9.e30.invalidSignature'
      ];

      for (const authHeader of invalidAuthHeaders) {
        const res = await fetch(`${BASE_URL}/api/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify({ query: 'victim@target.com' })
        });
        assert.equal(res.status, 403, `Auth header "${authHeader}" must return 403`);
        const json = await res.json();
        assert.deepEqual(json, { error: 'Verification required' });
      }
    });

    it('1.3: Forged JWT signed with wrong secret returns 403 Forbidden', async () => {
      const forgedToken = jwt.sign(
        { email: 'victim@target.com', verified: true },
        'attacker_wrong_secret_key_666'
      );

      const res = await fetch(`${BASE_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${forgedToken}`
        },
        body: JSON.stringify({ query: 'victim@target.com' })
      });

      assert.equal(res.status, 403, 'Forged JWT signature must return 403');
      const json = await res.json();
      assert.deepEqual(json, { error: 'Verification required' });
    });

    it('1.4: Expired JWT returns 403 Forbidden', async () => {
      const expiredToken = jwt.sign(
        { email: 'victim@target.com', verified: true, iat: Math.floor(Date.now() / 1000) - 3600 },
        JWT_SECRET,
        { expiresIn: -10 } // Expired 10 seconds ago
      );

      const res = await fetch(`${BASE_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${expiredToken}`
        },
        body: JSON.stringify({ query: 'victim@target.com' })
      });

      assert.equal(res.status, 403, 'Expired JWT must return 403');
      const json = await res.json();
      assert.deepEqual(json, { error: 'Verification required' });
    });

    it('1.5: Valid JWT signature but verified === false returns 403 Forbidden', async () => {
      const unverifiedToken = jwt.sign(
        { email: 'unverified@target.com', verified: false },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      const res = await fetch(`${BASE_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${unverifiedToken}`
        },
        body: JSON.stringify({ query: 'unverified@target.com' })
      });

      assert.equal(res.status, 403, 'JWT with verified:false must return 403');
      const json = await res.json();
      assert.deepEqual(json, { error: 'Verification required' });
    });

    it('1.6: JWT with verified missing returns 403 Forbidden', async () => {
      const noVerifiedToken = jwt.sign(
        { email: 'missing_field@target.com' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      const res = await fetch(`${BASE_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${noVerifiedToken}`
        },
        body: JSON.stringify({ query: 'missing_field@target.com' })
      });

      assert.equal(res.status, 403, 'JWT without verified field must return 403');
      const json = await res.json();
      assert.deepEqual(json, { error: 'Verification required' });
    });
  });

  // =========================================================================
  // CHALLENGE 2: POST /api/auth/send-otp Validation & Resend Cooldown
  // =========================================================================
  describe('Challenge 2: POST /api/auth/send-otp Email Validation & Cooldown', () => {
    it('2.1: Invalid email formats return 400 Bad Request', async () => {
      const invalidEmails = [
        '',
        '   ',
        'plainstring',
        '@domain.com',
        'user@',
        'user@domain',
        null,
        undefined,
        12345,
        {},
        []
      ];

      for (const email of invalidEmails) {
        const res = await fetch(`${BASE_URL}/api/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });

        assert.equal(res.status, 400, `Expected 400 for invalid email: ${JSON.stringify(email)}`);
        const json = await res.json();
        assert.equal(json.success, false);
        assert.equal(json.error, 'Valid email address or phone number is required');
      }
    });

    it('2.2: Valid email formats return 200 OK and dispatches 6-digit OTP', async () => {
      const email = makeEmail('valid_send');
      const res = await fetch(`${BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.message, `OTP sent successfully to ${email}`);
      assert.equal(json.expiresInMinutes, 5);

      const code = await waitForOtp(email);
      assert.match(code, /^\d{6}$/, 'OTP must be exactly 6 numeric digits');
    });

    it('2.3: Rapid resend within 30s cooldown returns 429 Too Many Requests', async () => {
      const email = makeEmail('cooldown_test');
      
      // 1st request -> 200
      const res1 = await fetch(`${BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      assert.equal(res1.status, 200);

      // Immediate 2nd request -> 429
      const res2 = await fetch(`${BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      assert.equal(res2.status, 429, 'Immediate resend must trigger 429 rate limit');
      const json2 = await res2.json();
      assert.equal(json2.success, false);
      assert.match(json2.error, /Please wait \d+ seconds before requesting a new OTP/);
    });

    it('2.4: Email casing normalization does not bypass cooldown', async () => {
      const emailLower = makeEmail('casing_test').toLowerCase();
      const emailUpper = emailLower.toUpperCase();

      const res1 = await fetch(`${BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailLower })
      });
      assert.equal(res1.status, 200);

      // Attempt to bypass cooldown using uppercase email
      const res2 = await fetch(`${BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailUpper })
      });
      assert.equal(res2.status, 429, 'Uppercase variation must be blocked by cooldown');
    });
  });

  // =========================================================================
  // CHALLENGE 3: POST /api/auth/verify-otp Verification, Lockout & Token
  // =========================================================================
  describe('Challenge 3: POST /api/auth/verify-otp Validation, Lockout & Verification', () => {
    it('3.1: Malformed and invalid OTP code formats return 400 Bad Request', async () => {
      const email = makeEmail('malformed_otp');
      const malformedOtps = [
        '',
        ' ',
        '12345',      // 5 digits
        '1234567',    // 7 digits
        '12345a',     // alphanumeric
        'abcdef',     // letters
        '12 345',     // with spaces
        null,
        undefined,
        {},
        []
      ];

      for (const otp of malformedOtps) {
        const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp })
        });
        assert.equal(res.status, 400, `Expected 400 for malformed OTP: ${JSON.stringify(otp)}`);
        const json = await res.json();
        assert.equal(json.success, false);
      }
    });

    it('3.2: Verification for non-existent email returns 400', async () => {
      const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nonexistent_user@example.com', otp: '123456' })
      });
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error, 'No OTP record found. Please request a new OTP.');
    });

    it('3.3: Incorrect OTP attempts track remaining attempts down to lockout', async () => {
      const email = makeEmail('lockout_test');
      await fetch(`${BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const realOtp = await waitForOtp(email);
      const wrongOtp = realOtp === '111111' ? '222222' : '111111';

      // Attempt 1: 4 attempts remaining
      const r1 = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: wrongOtp })
      });
      assert.equal(r1.status, 400);
      const j1 = await r1.json();
      assert.equal(j1.attemptsRemaining, 4);
      assert.match(j1.error, /4 attempts remaining/);

      // Attempt 2: 3 remaining
      const r2 = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: wrongOtp })
      });
      assert.equal(r2.status, 400);
      const j2 = await r2.json();
      assert.equal(j2.attemptsRemaining, 3);

      // Attempt 3: 2 remaining
      const r3 = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: wrongOtp })
      });
      assert.equal(r3.status, 400);
      const j3 = await r3.json();
      assert.equal(j3.attemptsRemaining, 2);

      // Attempt 4: 1 remaining
      const r4 = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: wrongOtp })
      });
      assert.equal(r4.status, 400);
      const j4 = await r4.json();
      assert.equal(j4.attemptsRemaining, 1);

      // Attempt 5: 0 remaining (Lockout triggered)
      const r5 = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: wrongOtp })
      });
      assert.ok([400, 429].includes(r5.status));
      const j5 = await r5.json();
      assert.equal(j5.attemptsRemaining, 0);

      // Attempt 6 (post lockout): Even with correct OTP, must be rejected with 429
      const r6 = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: realOtp })
      });
      assert.equal(r6.status, 429, 'Locked OTP must reject even valid code with 429');
      const j6 = await r6.json();
      assert.equal(j6.success, false);
      assert.match(j6.error, /Maximum verification attempts exceeded/);
    });

    it('3.4: Valid OTP verification returns 200, JWT token, and sets auth cookies', async () => {
      const email = makeEmail('valid_verify');
      await fetch(`${BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const realOtp = await waitForOtp(email);

      const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: realOtp })
      });

      assert.equal(res.status, 200, 'Expected 200 OK for valid OTP');
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.email, email);
      assert.equal(json.message, 'Verification successful');
      assert.ok(json.token, 'Token must be present in response');

      // Verify token signature & payload
      const payload = jwt.verify(json.token, JWT_SECRET);
      assert.equal(payload.email, email);
      assert.equal(payload.verified, true);

      // Check cookies
      const setCookie = res.headers.get('set-cookie') || '';
      assert.ok(setCookie.includes('otp_token='), 'Set-Cookie should set otp_token');
      assert.ok(setCookie.includes('HttpOnly'), 'Cookie should be HttpOnly');
    });
  });

  // =========================================================================
  // CHALLENGE 4: Legacy Routes & Account Workflows Purge (404)
  // =========================================================================
  describe('Challenge 4: Legacy Routes Purge & 404 Verification', () => {
    const legacyRoutes = [
      { method: 'POST', path: '/api/auth/register' },
      { method: 'POST', path: '/api/auth/login' },
      { method: 'GET',  path: '/api/auth/me' },
      { method: 'POST', path: '/api/auth/set-password' },
      { method: 'POST', path: '/api/register' },
      { method: 'POST', path: '/api/login' },
      { method: 'GET',  path: '/api/me' },
      { method: 'POST', path: '/register' },
      { method: 'POST', path: '/login' },
      { method: 'GET',  path: '/me' },
      { method: 'GET',  path: '/dashboard' },
      { method: 'GET',  path: '/api/dashboard' }
    ];

    for (const r of legacyRoutes) {
      it(`4.x: Legacy endpoint ${r.method} ${r.path} returns 404 Not Found`, async () => {
        const res = await fetch(`${BASE_URL}${r.path}`, {
          method: r.method,
          headers: { 'Content-Type': 'application/json' },
          body: r.method === 'POST' ? JSON.stringify({ email: 'test@example.com', password: 'password' }) : undefined
        });
        assert.equal(res.status, 404, `Legacy route ${r.method} ${r.path} must return 404`);
      });
    }
  });

  // =========================================================================
  // CHALLENGE 5: Verified Session Search Execution & Analytics Payload
  // =========================================================================
  describe('Challenge 5: Gated POST /api/search with Verified Session', () => {
    it('5.1: Bearer token execution returns 200 with Exposure Score and Breach Timeline', async () => {
      const email = makeEmail('verified_search');
      await fetch(`${BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const code = await waitForOtp(email);

      const vRes = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code })
      });
      const { token } = await vRes.json();

      const searchRes = await fetch(`${BASE_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: email, searchType: 'Email' })
      });

      assert.equal(searchRes.status, 200, 'Search should succeed with 200');
      const searchJson = await searchRes.json();
      assert.equal(searchJson.success, true);
      assert.ok(searchJson.data);
      assert.ok(Array.isArray(searchJson.data.packets));
      assert.ok(searchJson.data.analytics);
      assert.ok(searchJson.data.analytics.exposure);
      assert.equal(typeof searchJson.data.analytics.exposure.score, 'number');
      assert.ok(searchJson.data.analytics.exposure.score >= 0 && searchJson.data.analytics.exposure.score <= 100);
      assert.ok(Array.isArray(searchJson.data.analytics.timeline));
      assert.ok(searchJson.data.analytics.timeline.length > 0, 'Timeline events should be extracted');
    });

    it('5.2: Cookie-based session execution returns 200 with Exposure Score', async () => {
      const email = makeEmail('cookie_search');
      await fetch(`${BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const code = await waitForOtp(email);

      const vRes = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code })
      });
      const { token } = await vRes.json();

      const searchRes = await fetch(`${BASE_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `otp_token=${token}`
        },
        body: JSON.stringify({ query: email, searchType: 'Email' })
      });

      assert.equal(searchRes.status, 200);
      const searchJson = await searchRes.json();
      assert.equal(searchJson.success, true);
      assert.ok(searchJson.data.analytics.exposure);
    });
  });
});
