const express = require('express');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
const { query } = require('../db');

// Try native bcrypt; fallback to bcryptjs if native module is unavailable
let bcrypt;
try {
  bcrypt = require('bcrypt');
} catch (e) {
  try { bcrypt = require('bcryptjs'); }
  catch (_) { bcrypt = null; }
}

const router = express.Router();

router.use(cookieParser());
router.use(express.json());

// ---------------- Helpers & Constants ----------------
const isEmail = (s = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s).trim());
const signJwt = (payload) => jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 5);
const MAX_VERIFY_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds

// Password and OTP Hashing
async function hashSecret(secret) {
  if (bcrypt && typeof bcrypt.hash === 'function') {
    return await bcrypt.hash(String(secret), 10);
  }
  const bcryptjs = require('bcryptjs');
  return await bcryptjs.hash(String(secret), 10);
}

async function compareSecret(plain, hashed) {
  try {
    if (bcrypt && typeof bcrypt.compare === 'function') {
      return await bcrypt.compare(String(plain), String(hashed));
    }
    const bcryptjs = require('bcryptjs');
    return await bcryptjs.compare(String(plain), String(hashed));
  } catch {
    return false;
  }
}

// ---------------- Nodemailer Gmail Configuration ----------------
function getEmailTransporter() {
  const user = process.env.EMAIL_USER || process.env.GMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });
}

async function sendOtpEmail(toEmail, otpCode) {
  const transporter = getEmailTransporter();
  const htmlContent = `
    <div style="background:#0b0f19;padding:32px;font-family:monospace;color:#e2e8f0;border:1px solid #00f3ff;border-radius:10px;max-width:520px;margin:0 auto;box-shadow:0 0 20px rgba(0,243,255,0.2);">
      <h2 style="color:#00f3ff;margin-top:0;font-size:20px;">[ OSINT BREACHSHIELD SECURITY ]</h2>
      <p style="font-size:14px;color:#cbd5e1;">Your single-use email verification code for OSINT-BreachShield is:</p>
      <div style="background:#030712;padding:18px;border-radius:8px;text-align:center;font-size:32px;font-weight:bold;letter-spacing:8px;color:#00ff66;border:1px solid rgba(0,243,255,0.3);margin:24px 0;">
        ${otpCode}
      </div>
      <p style="font-size:12px;color:#94a3b8;line-height:1.5;">• Valid for <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.<br>• Never share this verification code with anyone.<br>• If you did not request this code, please disregard this message.</p>
      <div style="margin-top:24px;border-top:1px solid rgba(255,255,255,0.1);padding-top:12px;font-size:11px;color:#64748b;">OSINT BreachShield Security Operations</div>
    </div>
  `;

  if (transporter) {
    await transporter.sendMail({
      from: `OSINT BreachShield <${process.env.EMAIL_USER || 'no-reply@breachshield.osint'}>`,
      to: toEmail,
      subject: `Your OSINT BreachShield Verification Code: ${otpCode}`,
      html: htmlContent
    });
    return { sent: true, method: 'smtp' };
  } else {
    console.log(`\n======================================================`);
    console.log(`[EMAIL OTP] To: ${toEmail} | Verification Code: ${otpCode}`);
    console.log(`[EMAIL OTP] Note: Set EMAIL_USER & EMAIL_PASS in .env to send via live Gmail SMTP.`);
    console.log(`======================================================\n`);
    return { sent: true, method: 'console_dev' };
  }
}

// ---------------- Database Bootstrap & Resilient JSON Stores ----------------
const INSTANCE_DIR = path.join(__dirname, '../../instance');
const USERS_JSON = path.join(INSTANCE_DIR, 'users.json');
const OTPS_JSON = path.join(INSTANCE_DIR, 'email_otps.json');

function readJsonFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf8') || '[]');
  } catch { return []; }
}

function writeJsonFile(filePath, data) {
  try {
    if (!fs.existsSync(INSTANCE_DIR)) fs.mkdirSync(INSTANCE_DIR, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch { return false; }
}

// In-memory cooldown tracker: email -> timestamp
const resendCooldowns = new Map();

async function ensureTables() {
  await query(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await query(`CREATE TABLE IF NOT EXISTS email_otps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    attempts INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
  )`);
}

// ---------------- ROUTE 1: POST /api/auth/send-otp ----------------
router.post('/send-otp', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const username = String(req.body?.username || '').trim();

    if (!isEmail(email)) {
      return res.status(400).json({ success: false, error: 'Valid email address is required' });
    }

    // 1. Check Resend Cooldown (30 seconds)
    const lastSent = resendCooldowns.get(email) || 0;
    const now = Date.now();
    if (now - lastSent < RESEND_COOLDOWN_MS) {
      const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (now - lastSent)) / 1000);
      return res.status(429).json({ success: false, error: `Please wait ${waitSec}s before requesting a new OTP.` });
    }

    // 2. Check if user already exists
    try {
      await ensureTables();
      const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
      if (existing && existing.length > 0) {
        return res.status(409).json({ success: false, error: 'An account with this email already exists' });
      }
    } catch (_) {
      const fallbackUsers = readJsonFile(USERS_JSON);
      if (fallbackUsers.some(u => String(u.email).toLowerCase() === email)) {
        return res.status(409).json({ success: false, error: 'An account with this email already exists' });
      }
    }

    // 3. Generate 6-digit OTP & Expiry (5 minutes)
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const hashedOtp = await hashSecret(code);
    const expiresAt = new Date(now + OTP_EXPIRY_MINUTES * 60 * 1000);

    // 4. Store in Database (Prevent duplicate active OTPs for same email)
    try {
      await ensureTables();
      await query('DELETE FROM email_otps WHERE email = ?', [email]);
      await query(
        'INSERT INTO email_otps (email, otp, expires_at, verified, attempts) VALUES (?, ?, ?, FALSE, 0)',
        [email, hashedOtp, expiresAt]
      );
    } catch (dbErr) {
      // JSON storage fallback
      const otps = readJsonFile(OTPS_JSON).filter(o => String(o.email).toLowerCase() !== email);
      otps.push({
        id: Date.now(),
        email,
        username,
        otp: hashedOtp,
        expires_at: expiresAt.toISOString(),
        verified: false,
        attempts: 0,
        created_at: new Date().toISOString()
      });
      writeJsonFile(OTPS_JSON, otps);
    }

    // 5. Update Cooldown & Send Email
    resendCooldowns.set(email, now);
    await sendOtpEmail(email, code);

    return res.json({
      success: true,
      message: 'OTP sent successfully',
      expiresInMinutes: OTP_EXPIRY_MINUTES
    });
  } catch (err) {
    console.error('send-otp error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to send OTP. Please try again.' });
  }
});

// ---------------- ROUTE 2: POST /api/auth/verify-otp ----------------
router.post('/verify-otp', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const otp = String(req.body?.otp || '').trim();

    if (!isEmail(email) || !otp || otp.length !== 6) {
      return res.status(400).json({ success: false, error: 'Email and 6-digit OTP are required' });
    }

    let record = null;
    let isDb = true;

    try {
      await ensureTables();
      const rows = await query('SELECT * FROM email_otps WHERE email = ? ORDER BY id DESC LIMIT 1', [email]);
      if (rows && rows.length > 0) record = rows[0];
    } catch (_) {
      isDb = false;
      const otps = readJsonFile(OTPS_JSON);
      record = otps.slice().reverse().find(o => String(o.email).toLowerCase() === email) || null;
    }

    if (!record) {
      return res.status(400).json({ success: false, error: 'No OTP record found. Please request a new OTP.' });
    }

    // 1. Check Expiry
    const expireTime = new Date(record.expires_at).getTime();
    if (expireTime < Date.now()) {
      return res.status(400).json({ success: false, error: 'OTP has expired. Please request a new one.' });
    }

    // 2. Check Verification Attempts (Max 5)
    const attempts = Number(record.attempts || 0);
    if (attempts >= MAX_VERIFY_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        error: 'Maximum verification attempts exceeded. Please request a fresh OTP.'
      });
    }

    // 3. Compare Hash with bcrypt
    const match = await compareSecret(otp, record.otp);
    if (!match) {
      const remaining = MAX_VERIFY_ATTEMPTS - (attempts + 1);
      if (isDb) {
        await query('UPDATE email_otps SET attempts = attempts + 1 WHERE id = ?', [record.id]);
      } else {
        const otps = readJsonFile(OTPS_JSON);
        const item = otps.find(o => o.id === record.id);
        if (item) { item.attempts = (item.attempts || 0) + 1; writeJsonFile(OTPS_JSON, otps); }
      }
      return res.status(400).json({
        success: false,
        error: `Invalid OTP code. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Please request a new OTP.'}`
      });
    }

    // 4. Mark Verified
    if (isDb) {
      await query('UPDATE email_otps SET verified = TRUE WHERE id = ?', [record.id]);
    } else {
      const otps = readJsonFile(OTPS_JSON);
      const item = otps.find(o => o.id === record.id);
      if (item) { item.verified = true; writeJsonFile(OTPS_JSON, otps); }
    }

    // 5. Issue short-lived signup cookie to authorize account creation
    const signupToken = jwt.sign(
      { email, verified: true },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '15m' }
    );
    const prod = process.env.NODE_ENV === 'production';
    res.cookie('signup', signupToken, {
      httpOnly: true,
      secure: prod,
      sameSite: prod ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (err) {
    console.error('verify-otp error:', err.message);
    return res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

// ---------------- ROUTE 3: POST /api/auth/register (or set-password) ----------------
router.post(['/register', '/set-password'], async (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    const effectiveEmail = String(email || '').trim().toLowerCase();
    const effectiveUsername = String(username || '').trim();

    if (!effectiveUsername || !effectiveEmail || !password || String(password).length < 6) {
      return res.status(400).json({ success: false, error: 'Username, valid email, and password (min 6 chars) required' });
    }

    // 1. Verify that email has verified OTP status
    let isVerified = false;
    try {
      const rows = await query('SELECT * FROM email_otps WHERE email = ? AND verified = TRUE ORDER BY id DESC LIMIT 1', [effectiveEmail]);
      if (rows && rows.length > 0) isVerified = true;
    } catch (_) {
      const otps = readJsonFile(OTPS_JSON);
      const rec = otps.slice().reverse().find(o => String(o.email).toLowerCase() === effectiveEmail && o.verified);
      if (rec) isVerified = true;
    }

    // Also check signup token cookie
    if (!isVerified && req.cookies?.signup) {
      try {
        const decoded = jwt.verify(req.cookies.signup, process.env.JWT_SECRET || 'dev_secret');
        if (decoded.email === effectiveEmail && decoded.verified) isVerified = true;
      } catch (_) {}
    }

    if (!isVerified) {
      return res.status(403).json({ success: false, error: 'Please verify your email with OTP before registering.' });
    }

    // 2. Create User
    const passwordHash = await hashSecret(password);
    let createdUser;

    try {
      await ensureTables();
      const insertRes = await query('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', [effectiveUsername, effectiveEmail, passwordHash]);
      const id = insertRes.insertId;
      createdUser = { id, username: effectiveUsername, email: effectiveEmail, created_at: new Date().toISOString() };
      // Clean up used OTP
      await query('DELETE FROM email_otps WHERE email = ?', [effectiveEmail]);
    } catch (dbErr) {
      if (/duplicate/i.test(dbErr.message)) {
        return res.status(409).json({ success: false, error: 'User with this email already exists' });
      }
      // Fallback JSON user storage
      const users = readJsonFile(USERS_JSON);
      if (users.some(u => String(u.email).toLowerCase() === effectiveEmail)) {
        return res.status(409).json({ success: false, error: 'User with this email already exists' });
      }
      const nextId = users.length ? Math.max(...users.map(u => Number(u.id) || 0)) + 1 : 1;
      createdUser = { id: nextId, username: effectiveUsername, email: effectiveEmail, password_hash: passwordHash, created_at: new Date().toISOString() };
      users.push(createdUser);
      writeJsonFile(USERS_JSON, users);
      // Clean up JSON OTPs
      const remainingOtps = readJsonFile(OTPS_JSON).filter(o => String(o.email).toLowerCase() !== effectiveEmail);
      writeJsonFile(OTPS_JSON, remainingOtps);
    }

    // 3. Issue Authentication JWT Cookie
    const prod = process.env.NODE_ENV === 'production';
    res.clearCookie('signup', { httpOnly: true, secure: prod, sameSite: prod ? 'none' : 'lax' });
    const token = signJwt({ uid: createdUser.id });
    res.cookie('token', token, {
      httpOnly: true,
      secure: prod,
      sameSite: prod ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: 'Account created successfully',
      user: { id: createdUser.id, username: createdUser.username, email: createdUser.email }
    });
  } catch (err) {
    console.error('register error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to create account' });
  }
});

// ---------------- ROUTE 4: POST /api/auth/login ----------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!isEmail(email) || !password) {
      return res.status(400).json({ success: false, error: 'Valid email and password required' });
    }

    let user = null;
    try {
      await ensureTables();
      const users = await query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
      if (users.length) user = users[0];
    } catch (_) {
      const users = readJsonFile(USERS_JSON);
      user = users.find(u => String(u.email).toLowerCase() === email.toLowerCase()) || null;
    }

    if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const ok = await compareSecret(String(password), user.password_hash);
    if (!ok) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const token = signJwt({ uid: user.id });
    const prod = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: prod,
      sameSite: prod ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      user: { id: user.id, username: user.username, email: user.email, created_at: user.created_at }
    });
  } catch (err) {
    console.error('login error:', err.message);
    return res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// ---------------- ROUTE 5: GET /api/auth/me ----------------
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies?.token || (req.headers.authorization?.split(' ')[1]);
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    let user = null;

    try {
      const rows = await query('SELECT id, username, email, created_at FROM users WHERE id = ?', [decoded.uid]);
      if (rows && rows.length) user = rows[0];
    } catch (_) {
      const users = readJsonFile(USERS_JSON);
      user = users.find(u => Number(u.id) === Number(decoded.uid)) || null;
    }

    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ success: true, user });
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
});

// ---------------- ROUTE 6: POST /api/auth/logout ----------------
router.post('/logout', (req, res) => {
  const prod = process.env.NODE_ENV === 'production';
  res.clearCookie('token', { httpOnly: true, secure: prod, sameSite: prod ? 'none' : 'lax' });
  res.json({ success: true });
});

module.exports = router;
