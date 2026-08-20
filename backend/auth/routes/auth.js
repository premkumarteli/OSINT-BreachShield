const express = require('express');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
const { query } = require('../db');
const { JWT_SECRET } = require('../../config/env');

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
const isPhone = (s = '') => /^(\+?\d{1,4})?[\d\s-]{8,15}$/.test(String(s).trim().replace(/[\s-]/g, ''));
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
let cachedTransporter = null;
function getEmailTransporter() {
  if (cachedTransporter) return cachedTransporter;
  const user = String(process.env.EMAIL_USER || process.env.GMAIL_USER || process.env.SMTP_USER || '').trim();
  const rawPass = String(process.env.EMAIL_PASS || process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || '');
  const pass = rawPass.replace(/\s+/g, '');
  if (!user || !pass) return null;
  cachedTransporter = nodemailer.createTransport({
    service: 'gmail',
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    auth: { user, pass }
  });
  return cachedTransporter;
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
    try {
      const info = await transporter.sendMail({
        from: `OSINT BreachShield <${process.env.EMAIL_USER || 'no-reply@breachshield.osint'}>`,
        to: toEmail,
        subject: `Your OSINT BreachShield Verification Code: ${otpCode}`,
        html: htmlContent
      });
      console.log(`[EMAIL SENT] To: ${toEmail} | Message ID: ${info.messageId}`);
      return { sent: true, method: 'smtp' };
    } catch (e) {
      console.error(`[EMAIL ERROR] Failed to send to ${toEmail}:`, e.message);
      return { sent: false, error: e.message };
    }
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

// In-memory cooldown tracker: target -> timestamp
const resendCooldowns = new Map();
// In-memory OTP storage for fast lookups and concurrency safety
const memoryOtps = new Map();

async function ensureTables() {
  try {
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
  } catch (e) {
    // DB table creation fallback
  }
}

// ---------------- ROUTE 1: POST /api/auth/send-otp ----------------
router.post('/send-otp', async (req, res) => {
  try {
    const rawTarget = String(req.body?.target || req.body?.email || req.body?.phone || '').trim();
    const isTargetEmail = isEmail(rawTarget);
    const isTargetPhone = isPhone(rawTarget) || /^\+?\d{10,13}$/.test(rawTarget.replace(/[\s-]/g, ''));

    if (!isTargetEmail && !isTargetPhone) {
      return res.status(400).json({ success: false, error: 'Valid email address or phone number is required' });
    }

    const targetKey = rawTarget.toLowerCase();

    // 1. Check Resend Cooldown (30 seconds)
    const lastSent = resendCooldowns.get(targetKey) || 0;
    const now = Date.now();
    if (now - lastSent < RESEND_COOLDOWN_MS) {
      const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (now - lastSent)) / 1000);
      return res.status(429).json({ success: false, error: `Please wait ${waitSec} seconds before requesting a new OTP.` });
    }

    // 2. Generate 6-digit OTP & Expiry (5 minutes)
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const hashedOtp = await hashSecret(code);
    const expiresAt = new Date(now + OTP_EXPIRY_MINUTES * 60 * 1000);

    // 3. Store in Database or JSON Fallback
    const otpRecord = {
      id: Date.now(),
      email: targetKey,
      otp: hashedOtp,
      expires_at: expiresAt.toISOString(),
      verified: false,
      attempts: 0,
      created_at: new Date().toISOString()
    };
    memoryOtps.set(targetKey, otpRecord);

    try {
      await ensureTables();
      await query('DELETE FROM email_otps WHERE email = ?', [targetKey]);
      await query(
        'INSERT INTO email_otps (email, otp, expires_at, verified, attempts) VALUES (?, ?, ?, FALSE, 0)',
        [targetKey, hashedOtp, expiresAt]
      );
    } catch (dbErr) {
      const otps = readJsonFile(OTPS_JSON).filter(o => String(o.email).toLowerCase() !== targetKey);
      otps.push(otpRecord);
      writeJsonFile(OTPS_JSON, otps);
    }

    // 4. Update Cooldown & Dispatch via Email or Android SMS Gateway
    resendCooldowns.set(targetKey, now);

    if (isTargetEmail) {
      await sendOtpEmail(targetKey, code).catch(err => console.error('[EMAIL ERROR]', err.message));
    } else {
      // Send SMS via Android Gateway
      try {
        const gatewayController = require('../../gateway/controllers/gatewayController');
        const formattedPhone = rawTarget.startsWith('+') ? rawTarget : (rawTarget.length === 10 ? `+91${rawTarget}` : `+${rawTarget}`);
        const template = process.env.SMS_OTP_TEMPLATE || 'You breach otp is valid for 5 min\n{OTP}';
        const smsMessage = template.replace('{OTP}', code);
        
        // Emulate req/res for gatewayController
        const mockReq = {
          body: {
            phoneNumber: formattedPhone,
            message: smsMessage,
            requestId: `otp_${Date.now()}`
          }
        };
        const mockRes = {
          status: () => ({ json: () => {} })
        };
        await gatewayController.sendSms(mockReq, mockRes);
        console.log(`[SMS OTP DISPATCHED] To: ${formattedPhone} | Code: ${code}`);
      } catch (smsErr) {
        console.error('[SMS DISPATCH ERROR]', smsErr.message);
      }
    }

    return res.json({
      success: true,
      message: `OTP sent successfully to ${rawTarget}`,
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
    const rawTarget = String(req.body?.target || req.body?.email || req.body?.phone || '').trim();
    const isTargetEmail = isEmail(rawTarget);
    const isTargetPhone = isPhone(rawTarget) || /^\+?\d{10,13}$/.test(rawTarget.replace(/[\s-]/g, ''));
    const otp = String(req.body?.otp || '').trim();

    if ((!isTargetEmail && !isTargetPhone) || !otp || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, error: 'Valid email/phone and 6-digit numeric OTP are required' });
    }

    const targetKey = rawTarget.toLowerCase();
    let record = null;
    let isDb = true;

    try {
      await ensureTables();
      const rows = await query('SELECT * FROM email_otps WHERE email = ? ORDER BY id DESC LIMIT 1', [targetKey]);
      if (rows && rows.length > 0) record = rows[0];
    } catch (_) {
      isDb = false;
      record = memoryOtps.get(targetKey) || null;
      if (!record) {
        const otps = readJsonFile(OTPS_JSON);
        record = otps.slice().reverse().find(o => String(o.email).toLowerCase() === targetKey) || null;
      }
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
        error: 'Maximum verification attempts exceeded. Please request a new OTP.'
      });
    }

    // 3. Compare Hash with bcrypt
    const match = await compareSecret(otp, record.otp);
    if (!match) {
      const remaining = MAX_VERIFY_ATTEMPTS - (attempts + 1);
      if (isDb) {
        await query('UPDATE email_otps SET attempts = attempts + 1 WHERE id = ?', [record.id]);
      } else {
        if (memoryOtps.has(targetKey)) {
          memoryOtps.get(targetKey).attempts = (memoryOtps.get(targetKey).attempts || 0) + 1;
        }
        const otps = readJsonFile(OTPS_JSON);
        const item = otps.find(o => o.id === record.id || String(o.email).toLowerCase() === targetKey);
        if (item) { item.attempts = (item.attempts || 0) + 1; writeJsonFile(OTPS_JSON, otps); }
      }
      return res.status(400).json({
        success: false,
        error: remaining > 0 ? `Invalid OTP code. ${remaining} attempts remaining.` : 'Maximum verification attempts exceeded. Please request a new OTP.',
        attemptsRemaining: Math.max(0, remaining)
      });
    }

    // 4. Mark Verified
    if (isDb) {
      await query('UPDATE email_otps SET verified = TRUE WHERE id = ?', [record.id]);
    } else {
      if (memoryOtps.has(targetKey)) {
        memoryOtps.get(targetKey).verified = true;
      }
      const otps = readJsonFile(OTPS_JSON);
      const item = otps.find(o => o.id === record.id || String(o.email).toLowerCase() === targetKey);
      if (item) { item.verified = true; writeJsonFile(OTPS_JSON, otps); }
    }

    // 5. Issue short-lived JWT token authorizing OSINT breach lookups
    const token = jwt.sign(
      { target: targetKey, email: targetKey, verified: true },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const prod = process.env.NODE_ENV === 'production';
    res.cookie('otp_token', token, {
      httpOnly: true,
      secure: prod,
      sameSite: prod ? 'none' : 'lax',
      maxAge: 60 * 60 * 1000, // 1 hour
    });
    res.cookie('token', token, {
      httpOnly: true,
      secure: prod,
      sameSite: prod ? 'none' : 'lax',
      maxAge: 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      token,
      target: targetKey,
      email: targetKey,
      message: 'Verification successful'
    });
  } catch (err) {
    console.error('verify-otp error:', err.message);
    return res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

// ---------------- ROUTE 3: POST /api/auth/logout ----------------
router.post('/logout', (req, res) => {
  const prod = process.env.NODE_ENV === 'production';
  res.clearCookie('otp_token', { httpOnly: true, secure: prod, sameSite: prod ? 'none' : 'lax' });
  res.clearCookie('token', { httpOnly: true, secure: prod, sameSite: prod ? 'none' : 'lax' });
  res.json({ success: true, message: 'Logged out successfully' });
});

// ---------------- Reusable OTP Verification Middleware ----------------
function verifyOtpToken(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.cookies?.otp_token) {
      token = req.cookies.otp_token;
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    } else if (req.body?.token) {
      token = req.body.token;
    } else if (req.query?.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(403).json({ error: 'Verification required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || decoded.verified !== true) {
      return res.status(403).json({ error: 'Verification required' });
    }

    req.verifiedUser = decoded;
    return next();
  } catch (err) {
    return res.status(403).json({ error: 'Verification required' });
  }
}

// ---------------- Admin JWT Verification Middleware ----------------
function requireAdminToken(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.cookies?.admin_token) {
      token = req.cookies.admin_token;
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    } else if (req.headers['x-admin-token']) {
      token = req.headers['x-admin-token'];
    }

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Admin authentication token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || decoded.role !== 'admin') {
      return res.status(401).json({ error: 'Unauthorized: Admin privileges required' });
    }

    req.adminUser = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired admin token' });
  }
}

router.verifyOtpToken = verifyOtpToken;
router.requireAdminToken = requireAdminToken;
module.exports = router;
module.exports.verifyOtpToken = verifyOtpToken;
module.exports.requireAdminToken = requireAdminToken;
module.exports.router = router;
