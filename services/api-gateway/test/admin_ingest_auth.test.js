const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');
const jwt = require('jsonwebtoken');

const BACKEND_PORT = 5190;
const BASE_URL = `http://127.0.0.1:${BACKEND_PORT}`;
const JWT_SECRET = 'admin_ingest_test_secret_key_1234567890';

let backendProcess;

describe('Admin Ingest Auth API (POST /api/v1/ingest)', () => {
  before(async () => {
    await new Promise((resolve, reject) => {
      backendProcess = spawn('node', ['index.js'], {
        cwd: path.join(__dirname, '..'),
        env: {
          ...process.env,
          PORT: String(BACKEND_PORT),
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
  });

  it('2.1: POST /api/v1/ingest returns 401 Unauthorized without a token', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        records: [
          { target: 'victim@example.com', breachName: 'TestBreach', dataClasses: ['EMAIL'] }
        ]
      })
    });

    assert.equal(res.status, 401, 'Unauthenticated ingest must return 401');
    const json = await res.json();
    assert.ok(json.error && json.error.includes('Unauthorized'), 'Error message indicates unauthorized');
  });

  it('2.2: POST /api/v1/ingest returns 401 Unauthorized with a non-admin token', async () => {
    const userToken = jwt.sign(
      { target: 'user@example.com', role: 'user', verified: true },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const res = await fetch(`${BASE_URL}/api/v1/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        records: [
          { target: 'victim@example.com', breachName: 'TestBreach', dataClasses: ['EMAIL'] }
        ]
      })
    });

    assert.equal(res.status, 401, 'Non-admin token ingest must return 401');
  });

  it('2.3: POST /api/v1/ingest succeeds (200) with a valid admin token', async () => {
    const adminToken = jwt.sign(
      { sub: 'admin-1', email: 'admin@breachshield.io', role: 'admin' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const res = await fetch(`${BASE_URL}/api/v1/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        records: [
          { target: 'victim_ingest_test@example.com', breachName: 'Admin_Ingested_Breach', dataClasses: ['EMAIL', 'PASSWORD_HASH'], year: '2024' }
        ]
      })
    });

    assert.equal(res.status, 200, 'Admin token ingest must return 200');
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.ingested, 1);
  });
});
