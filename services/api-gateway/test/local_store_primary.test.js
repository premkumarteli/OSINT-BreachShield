const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { spawn } = require('node:child_process');
const path = require('node:path');
const jwt = require('jsonwebtoken');
const { ingestRecord } = require('../ingest/kAnonymityStore');

const BACKEND_PORT = 5180;
const PYTHON_PORT = 5181;
const BASE_URL = `http://127.0.0.1:${BACKEND_PORT}`;
const JWT_SECRET = 'local_primary_test_secret_key_1234567890';

let mockPythonServer;
let backendProcess;
let pythonCallCount = 0;
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

describe('Local Breach Store Primary (Telegram Scraper Secondary / Default OFF)', () => {
  before(async () => {
    // 1. Start Mock Python Service and record any calls
    await new Promise((resolve) => {
      mockPythonServer = http.createServer((req, res) => {
        pythonCallCount++;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ response: 'Should not be called', packets: [] }));
      });
      mockPythonServer.listen(PYTHON_PORT, '127.0.0.1', () => resolve());
    });

    // 2. Start Backend Express Server WITHOUT ENABLE_TELEGRAM_SCRAPER (unset)
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
          // ENABLE_TELEGRAM_SCRAPER is explicitly UNSET
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
      }, 7000);
    });
  });

  after(async () => {
    if (backendProcess) backendProcess.kill();
    if (mockPythonServer) {
      await new Promise((resolve) => mockPythonServer.close(resolve));
    }
  });

  it('1.1: Local store is queried first and returns results without calling Telegram scraper', async () => {
    const testEmail = `local_primary_${Date.now()}@example.com`;
    
    // Ingest into local k-anonymity store
    ingestRecord(testEmail, 'Local_Offline_Breach_2023', ['EMAIL', 'PASSWORD_HASH'], '2023');

    // Get OTP and verify
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

    pythonCallCount = 0;

    // Execute Search
    const searchRes = await fetch(`${BASE_URL}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ query: testEmail })
    });

    assert.equal(searchRes.status, 200, 'Search should succeed with 200');
    const searchJson = await searchRes.json();
    assert.equal(searchJson.success, true);
    assert.ok(searchJson.data.packets.length > 0, 'Local store packets should be present');
    
    const packetText = searchJson.data.packets.map(p => p.info).join('\n');
    assert.ok(packetText.includes('LOCAL_OFFLINE_BREACH_2023'), 'Contains local breach record source');
    assert.ok(packetText.includes('BREACHSHIELD RAW INTELLIGENCE REPOSITORY'), 'Contains repository header');

    // Assert the Python Telegram scraper service was NEVER called
    assert.equal(pythonCallCount, 0, 'Telegram scraper service must NOT be called when ENABLE_TELEGRAM_SCRAPER is unset');
  });
});
