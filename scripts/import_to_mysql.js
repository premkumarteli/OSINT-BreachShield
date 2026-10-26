const mysql = require('../backend/node_modules/mysql2/promise');
const fs = require('fs');
const path = require('path');

async function migrateData() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'Prem@333',
    database: 'osint_app'
  });
  console.log('Connected to MySQL osint_app database.');

  // 1. Migrate email_otps
  const otpsPath = path.join(__dirname, '../instance/email_otps.json');
  if (fs.existsSync(otpsPath)) {
    const otps = JSON.parse(fs.readFileSync(otpsPath, 'utf8') || '[]');
    let count = 0;
    for (const o of otps) {
      try {
        const exp = new Date(o.expires_at || Date.now()).toISOString().slice(0, 19).replace('T', ' ');
        const crt = new Date(o.created_at || Date.now()).toISOString().slice(0, 19).replace('T', ' ');
        await conn.execute(
          'INSERT INTO email_otps (email, otp, expires_at, verified, attempts, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [String(o.email || '').toLowerCase(), String(o.otp || ''), exp, Boolean(o.verified), Number(o.attempts || 0), crt]
        );
        count++;
      } catch (_) {}
    }
    console.log(`Successfully imported ${count} OTP records into email_otps.`);
  }

  // 2. Migrate blockchain_audit_logs
  const logsPath = path.join(__dirname, '../instance/blockchain_audit_logs.json');
  if (fs.existsSync(logsPath)) {
    const logs = JSON.parse(fs.readFileSync(logsPath, 'utf8') || '[]');
    let count = 0;
    for (const l of logs) {
      try {
        const crt = new Date(l.timestamp || Date.now()).toISOString().slice(0, 19).replace('T', ' ');
        await conn.execute(
          'INSERT INTO blockchain_audit_logs (event_id, event_type, canonical_hash, tx_hash, block_number, network_id, verification_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            String(l.eventId || `evt_${count}`),
            String(l.eventType || 'OSINT_BREACH_SEARCH'),
            String(l.canonicalHash || l.eventHash || ''),
            String(l.anchorTxHash || ''),
            Number(l.anchorBlockNumber || 1),
            String(l.anchorNetwork || 'local-hardhat'),
            String(l.verificationStatus || 'VALID'),
            crt
          ]
        );
        count++;
      } catch (_) {}
    }
    console.log(`Successfully imported ${count} audit records into blockchain_audit_logs.`);
  }

  const [otpRows] = await conn.query('SELECT COUNT(*) as cnt FROM email_otps;');
  const [logRows] = await conn.query('SELECT COUNT(*) as cnt FROM blockchain_audit_logs;');
  console.log(`Total rows in email_otps: ${otpRows[0].cnt}`);
  console.log(`Total rows in blockchain_audit_logs: ${logRows[0].cnt}`);

  await conn.end();
}

migrateData().catch(err => console.error('Migration error:', err));
