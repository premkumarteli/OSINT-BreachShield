const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { spawn } = require('node:child_process');
const path = require('node:path');

const BACKEND_PORT = 5195;
const PYTHON_PORT = 5196;
const BASE_URL = `http://127.0.0.1:${BACKEND_PORT}`;
const JWT_SECRET = 'scraper_redaction_test_secret_1234567890';

let mockPythonServer;
let backendProcess;
const otpMap = new Map();

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

describe('Telegram Scraper Live Feed Redaction Verification', () => {
  before(async () => {
    // 1. Mock Python Scraper Service that returns plaintext sensitive credentials
    await new Promise((resolve) => {
      mockPythonServer = http.createServer((req, res) => {
        const mockRawResponse = 
          `══════════════════════════════════════════════════════\n` +
          `[ RECORD #1 | SOURCE: AIR_INDIA_SITA_2021 (Year: 2021) ]\n` +
          `• Target Email    : user_victim@example.com\n` +
          `• Plaintext Pass  : SuperSecretP@ssword999\n` +
          `• Password Hash   : $2y$10$abcdef1234567890abcdef1234567890\n` +
          `• National ID     : IND-P8492019\n` +
          `• Address         : 123 Main Street, Suite 400, New York, NY\n` +
          `• Father's Name   : Ramesh Sharma\n` +
          `• Secondary Email : leaked_colleague@company.com\n` +
          `══════════════════════════════════════════════════════`;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          response: mockRawResponse,
          packets: [{ query: 'user_victim@example.com', info: mockRawResponse, source: 'LIVE_TELEGRAM_SCRAPER' }],
          pagination: { current: 1, total: 1 }
        }));
      });
      mockPythonServer.listen(PYTHON_PORT, '127.0.0.1', () => resolve());
    });

    // 2. Start Backend Express Server with ENABLE_TELEGRAM_SCRAPER=true
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

      setTimeout(() => {
        if (!started) reject(new Error('Backend server start timeout'));
      }, 15000);
    });
  });

  after(async () => {
    if (backendProcess) backendProcess.kill();
    if (mockPythonServer) {
      await new Promise((resolve) => mockPythonServer.close(resolve));
    }
  });

  it('6.1: Live scraper response containing plaintext passwords and PII is strictly redacted in /api/search', async () => {
    const testEmail = 'user_victim@example.com';

    // Request & verify OTP
    await fetch(`${BASE_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    const code = await waitForOtp(testEmail);

    const vRes = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp: code })
    });
    const { token } = await vRes.json();

    // Query /api/search
    const searchRes = await fetch(`${BASE_URL}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ query: testEmail })
    });

    assert.equal(searchRes.status, 200);
    const result = await searchRes.json();
    assert.equal(result.success, true);
    assert.ok(result.data.packets.length > 0, 'Packets returned');

    const combinedInfo = result.data.packets.map(p => p.info).join('\n');

    // 1. Assert plaintext password is NOT in response and has been redacted
    assert.ok(!combinedInfo.includes('SuperSecretP@ssword999'), 'Plaintext password must never leak to client');
    assert.ok(combinedInfo.includes('[REDACTED_CREDENTIAL]'), 'Password replaced with [REDACTED_CREDENTIAL]');

    // 2. Assert physical address is redacted
    assert.ok(!combinedInfo.includes('123 Main Street'), 'Plaintext address must not leak');
    assert.ok(combinedInfo.includes('[REDACTED_ADDRESS]'), 'Address replaced with [REDACTED_ADDRESS]');

    // 3. Assert parent name is redacted
    assert.ok(!combinedInfo.includes('Ramesh Sharma'), 'Parent name must not leak');
    assert.ok(combinedInfo.includes('[REDACTED_NAME]'), 'Parent name replaced with [REDACTED_NAME]');

    // 4. Assert third-party email is masked while target email is preserved
    assert.ok(combinedInfo.includes('user_victim@example.com'), 'Verified user target email preserved');
    assert.ok(!combinedInfo.includes('leaked_colleague@company.com'), 'Third party email masked');
  });
});
