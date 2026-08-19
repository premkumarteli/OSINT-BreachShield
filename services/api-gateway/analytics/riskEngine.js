/**
 * OSINT BreachShield - Exposure Score & Risk Classification Engine
 * Analyzes raw intelligence data and computes a deterministic threat score (0-100)
 */

function analyzeExposure(rawText = '', query = '') {
  const text = String(rawText || '');
  if (!text.trim() || /no\s*results?(\s*found)?|no\s*public\s*breach\s*records|scan\s*complete/i.test(text)) {
    return {
      score: 0,
      riskLevel: 'LOW',
      riskColor: '#00ff66',
      breakdown: [],
      entities: {
        passwordCount: 0,
        phoneCount: 0,
        emailCount: 0,
        hasDocument: false,
        hasAddress: false,
        hasFatherName: false,
        recordCount: 0
      }
    };
  }

  // 1. Detection Regexes for Real Breach Data
  const passwordRegex = /(?:password|passwd|pwd|hash|md5|sha1|bcrypt|plaintext)[\s:=]+([^\s\n,]+)/gi;
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b\d{10}\b|(?:telephone|mobile|phone)[\s:=*]+`?([0-9+ -]+)`?/gi;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const docRegex = /(?:document\s*number|aadhaar|aadhar|passport|pan|taxpayer|voter|national\s*id)[\s:=*]+`?([0-9a-zA-Z -]+)`?/gi;
  const addressRegex = /(?:adres|address|street|city|state|pincode|zipcode|location)[\s:=*]+([^\n]+)/gi;
  const fatherRegex = /(?:name\s*of\s*the\s*father|father|father'?s?\s*name)[\s:=*]+([^\n]+)/gi;
  const breachSourceRegex = /\*\*[\s💾]*([a-zA-Z0-9._-]+\.[a-zA-Z]{2,}|[a-zA-Z0-9._ -]+)\*\*/g;

  // 2. Extract Entities
  const passwordsFound = Array.from(text.matchAll(passwordRegex)).map(m => m[1] || m[0]);
  const emailsFound = (text.match(emailRegex) || []).filter(e => e.toLowerCase() !== String(query).toLowerCase());
  const phonesFound = Array.from(text.matchAll(phoneRegex)).map(m => m[1] || m[0]);
  const docsFound = Array.from(text.matchAll(docRegex)).map(m => m[1] || m[0]);
  const addressMatches = Array.from(text.matchAll(addressRegex));
  const fatherMatches = Array.from(text.matchAll(fatherRegex));
  const breachSources = Array.from(text.matchAll(breachSourceRegex)).map(m => m[1].trim());

  // Count record entries
  const recordBlocks = text.split(/(?:\*\*💾|\n\s*\n|[-=_]{5,}|\[\s*RECORD)/i).filter(b => b.trim().length > 25);
  const recordCount = Math.max(1, recordBlocks.length, breachSources.length);

  // 3. Weight Calculation
  let rawScore = 0;
  const breakdown = [];

  // Government ID / Document Leak (Critical: +35 pts)
  if (docsFound.length > 0 || /document\s*number|aadhaar/i.test(text)) {
    rawScore += 35;
    breakdown.push({ factor: 'National ID / Document Leak', count: Math.max(1, docsFound.length), points: 35 });
  }

  // Plaintext/Credential Exposure (+30 pts)
  if (passwordsFound.length > 0) {
    const pwPts = Math.min(30, passwordsFound.length * 20);
    rawScore += pwPts;
    breakdown.push({ factor: 'Compromised Passwords / Hashes', count: passwordsFound.length, points: pwPts });
  }

  // Physical Address / Geolocation (+20 pts)
  if (addressMatches.length > 0 || /adres|address/i.test(text)) {
    rawScore += 20;
    breakdown.push({ factor: 'Physical Address / PII Exposed', count: Math.max(1, addressMatches.length), points: 20 });
  }

  // Phone / Contact Identity Exposed (+15 pts)
  if (phonesFound.length > 0 || /telephone|mobile/i.test(text)) {
    const phonePts = Math.min(15, Math.max(1, phonesFound.length) * 10);
    rawScore += phonePts;
    breakdown.push({ factor: 'Phone Numbers Linked', count: Math.max(1, phonesFound.length), points: phonePts });
  }

  // Family / Father Name Linked (+10 pts)
  if (fatherMatches.length > 0 || /father/i.test(text)) {
    rawScore += 10;
    breakdown.push({ factor: 'Family Identity Linked', count: Math.max(1, fatherMatches.length), points: 10 });
  }

  // Database Sprawl (+10 pts)
  if (recordCount > 1 || breachSources.length > 1) {
    rawScore += 15;
    breakdown.push({ factor: 'Multiple Leak Sources', count: Math.max(recordCount, breachSources.length), points: 15 });
  }

  // Base score for any confirmed breach record
  rawScore = Math.max(25, rawScore);

  // Cap at 100
  const score = Math.min(100, rawScore);

  // Categorize Risk Level
  let riskLevel = 'LOW';
  let riskColor = '#00ff66';
  if (score >= 75) {
    riskLevel = 'CRITICAL';
    riskColor = '#ff003c';
  } else if (score >= 50) {
    riskLevel = 'HIGH';
    riskColor = '#ff6a00';
  } else if (score >= 25) {
    riskLevel = 'MEDIUM';
    riskColor = '#ffcc00';
  }

  return {
    score,
    riskLevel,
    riskColor,
    breakdown,
    entities: {
      passwordCount: passwordsFound.length,
      phoneCount: Math.max(1, phonesFound.length),
      emailCount: emailsFound.length,
      hasDocument: docsFound.length > 0 || /document\s*number/i.test(text),
      hasAddress: addressMatches.length > 0 || /adres/i.test(text),
      hasFatherName: fatherMatches.length > 0 || /father/i.test(text),
      recordCount
    }
  };
}

/**
 * Redacts plaintext passwords, national IDs, addresses, parent names, and exposed emails
 * from breach text before sending to client, enforcing privacy-preserving data masking by default.
 */
function redactSensitiveData(rawText = '', verifiedTarget = '') {
  if (!rawText || typeof rawText !== 'string') return '';
  // Data masking is ON by default for privacy and security.
  // It can only be explicitly bypassed in development environments via DISABLE_DATA_MASKING=true.
  if (process.env.DISABLE_DATA_MASKING === 'true') {
    return rawText;
  }

  let sanitized = rawText;

  // 1. Passwords, hashes, and credentials
  sanitized = sanitized.replace(
    /((?:password|passwd|pwd|hash|md5|sha1|bcrypt|plaintext)[\s:=*]+)`?([^\s\n,`]+)`?/gi,
    (match, prefix) => `${prefix}[REDACTED_CREDENTIAL]`
  );

  // 2. National IDs, Aadhaar, Passport, PAN, Taxpayer/Voter IDs
  sanitized = sanitized.replace(
    /((?:document\s*number|aadhaar|aadhar|passport|pan|taxpayer|voter|national\s*id)[\s:=*]+)`?([0-9a-zA-Z -]{6,})`?/gi,
    (match, prefix, val) => {
      const cleanVal = val.trim();
      const masked = cleanVal.length > 4 ? '*'.repeat(cleanVal.length - 4) + cleanVal.slice(-4) : '****';
      return `${prefix}${masked}`;
    }
  );

  // 3. Physical Addresses (e.g. Adres:, Address:, Delivery Address:, etc.)
  sanitized = sanitized.replace(
    /(^|\n)([ \t]*(?:•[ \t]*)?(?:adres|address|delivery\s*address|residential\s*address)[\s:=]+)([^\n]+)/gi,
    (match, linePrefix, label, val) => {
      const cleanVal = val.trim();
      if (!cleanVal || cleanVal.startsWith('[REDACTED')) return match;
      return `${linePrefix}${label}[REDACTED_ADDRESS]`;
    }
  );

  // 4. Father's / Parent's Name Fields
  sanitized = sanitized.replace(
    /(^|\n)([ \t]*(?:•[ \t]*)?(?:father(?:'s)?(?:\s*name)?|parent(?:'s)?(?:\s*name)?|name\s*of\s*(?:the\s*)?father)[\s:=]+)([^\n]+)/gi,
    (match, linePrefix, label, val) => {
      const cleanVal = val.trim();
      if (!cleanVal || cleanVal.startsWith('[REDACTED')) return match;
      return `${linePrefix}${label}[REDACTED_NAME]`;
    }
  );

  // 5. Email addresses when not the verified user's own target
  const targetLower = String(verifiedTarget || '').trim().toLowerCase();
  sanitized = sanitized.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    (email) => {
      if (targetLower && email.toLowerCase() === targetLower) {
        return email;
      }
      const parts = email.split('@');
      const user = parts[0];
      const domain = parts[1];
      if (user.length <= 2) {
        return `*@${domain}`;
      }
      return `${user[0]}${'*'.repeat(Math.max(1, user.length - 2))}${user[user.length - 1]}@${domain}`;
    }
  );

  return sanitized;
}

module.exports = {
  analyzeExposure,
  redactSensitiveData
};
