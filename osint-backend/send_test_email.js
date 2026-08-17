const nodemailer = require('nodemailer');
require('dotenv').config();

const user = process.env.EMAIL_USER;
const pass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');
const target = 'premkumarteli333@gmail.com';

console.log(`Connecting to Gmail SMTP for ${user}...`);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user, pass }
});

const mailOptions = {
  from: `"OSINT BreachShield" <${user}>`,
  to: target,
  subject: 'OSINT BreachShield - OTP Module Initialized',
  html: `
    <div style="background:#0b0f19;padding:32px;font-family:monospace;color:#e2e8f0;border:1px solid #00f3ff;border-radius:10px;max-width:520px;margin:0 auto;box-shadow:0 0 20px rgba(0,243,255,0.2);">
      <h2 style="color:#00f3ff;margin-top:0;">[ OSINT BREACHSHIELD NOTIFICATION ]</h2>
      <p style="font-size:16px;color:#00ff66;font-weight:bold;margin:18px 0;">Hi, OTP module is started!</p>
      <p style="color:#cbd5e1;font-size:13px;line-height:1.6;">This test email confirms that live Gmail SMTP transport is active, verified, and configured for <strong>premkumarteli333@gmail.com</strong>.</p>
      <div style="background:#030712;padding:14px;border-radius:6px;border:1px solid rgba(0,243,255,0.25);margin:20px 0;font-size:12px;color:#38bdf8;">
        ✓ SMTP Server: smtp.gmail.com<br>
        ✓ Sender: ${user}<br>
        ✓ Status: ONLINE & ACTIVE
      </div>
      <div style="margin-top:20px;border-top:1px solid rgba(255,255,255,0.1);padding-top:10px;font-size:11px;color:#64748b;">
        Timestamp: ${new Date().toISOString()}
      </div>
    </div>
  `
};

async function main() {
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[SUCCESS] Email successfully sent to ${target}!`);
    console.log(`Message ID: ${info.messageId}`);
    console.log(`Response: ${info.response}`);
  } catch (err) {
    console.error('[ERROR] Failed to send email:', err.message);
  }
}

main();
