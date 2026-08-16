const express = require('express');
const axios = require('axios');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
// Try native bcrypt; fallback to bcryptjs if native module is unavailable
let bcrypt;
try {
  bcrypt = require('bcrypt');
} catch (e) {
  try { bcrypt = require('bcryptjs'); }
  catch (_) { bcrypt = null; }
}
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const { query } = require('../db');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// middleware ensures cookie parsing on this router
router.use(cookieParser());
router.use(express.json());

// utils
const hash = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const isEmail = (s = '') => /.+@.+\..+/.test(String(s));
const signJwt = (payload) => jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });

// password helpers: prefer native bcrypt, fallback to bcryptjs if native fails
async function hashPassword(password) {
  try {
    if (bcrypt && typeof bcrypt.hash === 'function') {
      return await bcrypt.hash(String(password), 12);
    }
    const bcryptjs = require('bcryptjs');
    return await bcryptjs.hash(String(password), 12);
  } catch (e) {
    throw e;
  }
}
async function comparePassword(password, password_hash) {
  try {
    if (bcrypt && typeof bcrypt.compare === 'function') {
      return await bcrypt.compare(String(password), String(password_hash));
    }
    const bcryptjs = require('bcryptjs');
    return await bcryptjs.compare(String(password), String(password_hash));
  } catch (e) {
    return false;
  }
}

// Ephemeral in-memory OTP store for registration: email -> { username, otpHash, expiresAt }
const regOtpStore = new Map();

// JSON fallback storage (dev-only) when DB is down
const USERS_JSON_DIR = path.join(__dirname, '../../instance');
const USERS_JSON = path.join(USERS_JSON_DIR, 'users.json');
// in-memory user fallback (last resort)
const regUserStore = new Map(); // email -> user
function readUsersFallback() {
  try {
    if (!fs.existsSync(USERS_JSON)) return [];
    const buf = fs.readFileSync(USERS_JSON, 'utf8');
    return JSON.parse(buf || '[]');
  } catch { return []; }
}
function writeUsersFallback(users) {
  try {
    if (!fs.existsSync(USERS_JSON_DIR)) fs.mkdirSync(USERS_JSON_DIR, { recursive: true });
    fs.writeFileSync(USERS_JSON, JSON.stringify(users, null, 2));
    return true;
  } catch { return false; }
}
function findUserByEmailFallback(email) {
  const users = readUsersFallback();
  return users.find(u => String(u.email).toLowerCase() === String(email).toLowerCase()) || null;
}
function findUserByIdFallback(id) {
  const users = readUsersFallback();
  return users.find(u => Number(u.id) === Number(id)) || null;
}
function findUserByIdInMem(id) {
  for (const u of regUserStore.values()) {
    if (Number(u.id) === Number(id)) return u;
  }
  return null;
}
function addUserFallback({ username, email, password_hash }) {
  const users = readUsersFallback();
  const nextId = users.length ? (Math.max(...users.map(u => Number(u.id) || 0)) + 1) : 1;
  const user = { id: nextId, username, email, password_hash, created_at: new Date().toISOString() };
  users.push(user);
  if (!writeUsersFallback(users)) {
    // store in memory if disk write fails
    regUserStore.set(String(email).toLowerCase(), user);
    return user;
  }
  return user;
}

// Rate limiter: 1 OTP per minute per email (enforced by keyGenerator)
const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    try { return String(req.body?.email || req.ip).toLowerCase(); } catch { return req.ip; }
  },
});

// Brevo transactional email
async function sendBrevoEmail({ toEmail, subject, htmlContent, textContent }) {
  const apiKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
  if (!apiKey) throw new Error('Missing BREVO_API_KEY');
  const fromEmail = process.env.MAIL_FROM_EMAIL || 'no-reply@example.com';
  const fromName = process.env.MAIL_FROM_NAME || 'OSINT App';
  const url = 'https://api.brevo.com/v3/smtp/email';
  const payload = {
    sender: { email: fromEmail, name: fromName },
    to: [{ email: toEmail }],
    subject,
    htmlContent: htmlContent || `<p>${textContent || ''}</p>`,
    textContent: textContent || undefined,
  };
  await axios.post(url, payload, {
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
    timeout: 10_000,
  });
}

// Prefer SMTP if available (Brevo SMTP like previous), else use Brevo HTTP API
async function sendEmailSmart({ toEmail, subject, htmlContent, textContent }) {
  if (process.env.SMTP_URL || (process.env.SMTP_HOST && process.env.SMTP_USER && (process.env.SMTP_PASS || process.env.SMTP_PASSWORD))) {
    const transport = process.env.SMTP_URL
      ? nodemailer.createTransport(process.env.SMTP_URL)
      : nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: false,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD },
        });
    const fromEmail = process.env.MAIL_FROM_EMAIL || 'no-reply@example.com';
    const fromName = process.env.MAIL_FROM_NAME || 'OSINT App';
    const fromAddr = process.env.MAIL_FROM || `${fromName} <${fromEmail}>`;
    await transport.sendMail({ from: fromAddr, to: toEmail, subject, html: htmlContent, text: textContent });
    return;
  }
  return sendBrevoEmail({ toEmail, subject, htmlContent, textContent });
}

// Create tables if they don't exist (simple bootstrap). Safe to call repeatedly.
async function ensureTables() {
  await query(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await query(`CREATE TABLE IF NOT EXISTS otps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
}

// POST /api/auth/send-otp { username, email }
router.post('/send-otp', otpLimiter, async (req, res) => {
  try {
    const { username, email } = req.body || {};
    if (!username || !isEmail(email)) return res.status(400).json({ error: 'Username and valid email required' });
    // Best-effort: check if user exists; ignore DB errors to avoid blocking OTP send
    try {
      await ensureTables();
      const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length) return res.status(409).json({ error: 'User already exists' });
    } catch (dbErr) {
      console.warn('send-otp: skip user exists check due to DB error:', dbErr.message);
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = hash(code);
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins
    // Store in memory so we don't depend on DB just to send an email
    regOtpStore.set(String(email).toLowerCase(), { username, otpHash, expiresAt });

    await sendEmailSmart({
      toEmail: email,
      subject: 'Your OSINT App OTP code',
      htmlContent: `<p>Your verification code is <b style="font-size:18px">${code}</b>. It expires in 5 minutes.</p>`
    });

    res.json({ success: true, expiresInSec: 300 });
  } catch (e) {
    console.error('send-otp error:', e.message);
    const msg = /ECONNREFUSED.*3306|ENOTFOUND.*mysql|connect ECONNREFUSED/i.test(e.message)
      ? 'Database connection failed. Check MySQL is running and DB_* in backend .env.'
      : (/Missing BREVO_API_KEY/.test(e.message)
        ? 'Email service not configured (set SMTP_* or BREVO_API_KEY)'
        : (e.response?.data?.message || e.message || 'Failed to send OTP'));
    res.status(500).json({ error: msg });
  }
});

// POST /api/auth/verify-otp { email, otp, username }
// Verifies OTP and issues a short-lived signup cookie so the client can set password next.
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, username } = req.body || {};
    if (!isEmail(email) || !otp || !username) {
      return res.status(400).json({ error: 'Email, username and OTP are required' });
    }
    // First, try in-memory OTP
    const inMem = regOtpStore.get(String(email).toLowerCase());
    if (inMem) {
      if (inMem.expiresAt < Date.now()) {
        regOtpStore.delete(String(email).toLowerCase());
        return res.status(400).json({ error: 'OTP expired' });
      }
      if (hash(String(otp)) !== inMem.otpHash) return res.status(401).json({ error: 'Invalid OTP' });
      // username consistency: prefer provided username, fallback to stored
    } else {
      // Fallback to DB-based OTP if present (for future when DB is available)
      try {
        await ensureTables();
        const rows = await query('SELECT * FROM otps WHERE email = ? ORDER BY id DESC LIMIT 1', [email]);
        if (!rows.length) return res.status(400).json({ error: 'OTP not found' });
        const rec = rows[0];
        if (new Date(rec.expires_at).getTime() < Date.now()) {
          await query('DELETE FROM otps WHERE email = ?', [email]);
          return res.status(400).json({ error: 'OTP expired' });
        }
        if (hash(String(otp)) !== rec.otp_hash) return res.status(401).json({ error: 'Invalid OTP' });
      } catch (dbErr) {
        return res.status(500).json({ error: 'OTP storage unavailable. Please resend.' });
      }
    }

    // OTP is valid: clear stored OTP and issue a short-lived signup cookie with email+username
    regOtpStore.delete(String(email).toLowerCase());
    try { await query('DELETE FROM otps WHERE email = ?', [email]); } catch (_) {}

    const signupToken = jwt.sign(
      { email, username, stage: 'signup' },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '10m' }
    );
    const prod = process.env.NODE_ENV === 'production';
    res.cookie('signup', signupToken, {
      httpOnly: true,
      secure: prod,
      sameSite: prod ? 'none' : 'lax',
      maxAge: 10 * 60 * 1000,
    });
    return res.json({ success: true });
  } catch (e) {
    console.error('verify-otp error:', e.message);
    // handle duplicate email race
    if (/duplicate/i.test(e.message)) return res.status(409).json({ error: 'User already exists' });
    res.status(500).json({ error: 'Verification failed' });
  }
});

// POST /api/auth/set-password { password }
// Requires the short-lived 'signup' cookie set by verify-otp. Creates the user and logs them in.
router.post('/set-password', async (req, res) => {
  try {
    const { password } = req.body || {};
    if (!password || String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const signupToken = req.cookies?.signup;
    if (!signupToken) return res.status(401).json({ error: 'Signup session expired. Please verify OTP again.' });
    let payload;
    try {
      payload = jwt.verify(signupToken, process.env.JWT_SECRET || 'dev_secret');
    } catch (_) {
      return res.status(401).json({ error: 'Signup session expired. Please verify OTP again.' });
    }
    if (payload.stage !== 'signup' || !isEmail(payload.email) || !payload.username) {
      return res.status(400).json({ error: 'Invalid signup session' });
    }

    const email = payload.email;
    const username = payload.username;

    // Create user (DB -> JSON -> memory)
    let createdUserRow;
    try {
      await ensureTables();
      const password_hash = await hashPassword(String(password));
      await query('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', [username, email, password_hash]);
      const rows = await query('SELECT id, username, email, created_at FROM users WHERE email = ?', [email]);
      createdUserRow = rows[0];
    } catch (dbCreateErr) {
      if (/duplicate/i.test(dbCreateErr.message)) return res.status(409).json({ error: 'User already exists' });
      try {
        const password_hash = await hashPassword(String(password));
        const fallbackUser = addUserFallback({ username, email, password_hash });
        createdUserRow = { id: fallbackUser.id, username: fallbackUser.username, email: fallbackUser.email, created_at: fallbackUser.created_at };
        console.warn('set-password: DB unavailable, created user in JSON/memory fallback for', email);
      } catch (e) {
        try {
          const password_hash = await hashPassword(String(password));
          const id = Date.now();
          const memUser = { id, username, email, password_hash, created_at: new Date().toISOString() };
          regUserStore.set(String(email).toLowerCase(), memUser);
          createdUserRow = { id: memUser.id, username: memUser.username, email: memUser.email, created_at: memUser.created_at };
          console.warn('set-password: using in-memory user fallback for', email);
        } catch (err2) {
          return res.status(500).json({ error: 'Failed to create user' });
        }
      }
    }

    // Clear signup cookie and issue auth token cookie
    const prod = process.env.NODE_ENV === 'production';
    res.clearCookie('signup', { httpOnly: true, secure: prod, sameSite: prod ? 'none' : 'lax' });
    const token = signJwt({ uid: createdUserRow.id });
    res.cookie('token', token, {
      httpOnly: true,
      secure: prod,
      sameSite: prod ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.json({ success: true, user: createdUserRow });
  } catch (e) {
    console.error('set-password error:', e.message);
    return res.status(500).json({ error: 'Failed to set password' });
  }
});

// POST /api/auth/login { email, password }
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!isEmail(email) || !password) return res.status(400).json({ error: 'Email and password required' });
    let user;
    try {
      await ensureTables();
      const users = await query('SELECT * FROM users WHERE email = ?', [email]);
      if (users.length) user = users[0];
    } catch (dbErr) {
      // fallback to JSON
      user = findUserByEmailFallback(email) || regUserStore.get(String(email).toLowerCase()) || null;
    }
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await comparePassword(String(password), user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signJwt({ uid: user.id });
    const prod = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: prod,
      sameSite: prod ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({
      success: true,
      user: { id: user.id, username: user.username, email: user.email, created_at: user.created_at }
    });
  } catch (e) {
    console.error('login error:', e.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// auth middleware
async function auth(req, res, next) {
  try {
    const token = req.cookies?.token || (req.headers.authorization?.split(' ')[1]);
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.userId = decoded.uid;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    try {
      const rows = await query('SELECT id, username, email, created_at FROM users WHERE id = ?', [req.userId]);
      if (rows.length) return res.json({ user: rows[0] });
    } catch (dbErr) {
      // ignore and fallback
    }
    const fu = findUserByIdFallback(req.userId) || findUserByIdInMem(req.userId);
    if (!fu) return res.status(404).json({ error: 'Not found' });
    res.json({ user: { id: fu.id, username: fu.username, email: fu.email, created_at: fu.created_at } });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const prod = process.env.NODE_ENV === 'production';
  res.clearCookie('token', { httpOnly: true, secure: prod, sameSite: prod ? 'none' : 'lax' });
  res.json({ success: true });
});

module.exports = router;
