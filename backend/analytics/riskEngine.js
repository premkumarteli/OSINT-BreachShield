/**
 * OSINT BreachShield - Exposure Score & Risk Classification Engine
 * Analyzes raw intelligence data and computes a deterministic threat score (0-100)
 */

function analyzeExposure(rawText = '', query = '', aiAnalysis = null) {
  const text = String(rawText || '');
  if (!text.trim() || /no\s*results?(\s*found)?|no\s*public\s*breach\s*records|scan\s*complete/i.test(text)) {
    return {
      score: 0,
      riskLevel: 'LOW',
      riskColor: '#00ff66',
      breakdown: [],
      factors: {
        phishing_probability: 0.0,
        correlation_score: 0.0,
        source_reliability: 0.0,
        severity: 0.0,
        recency: 0.0
      },
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

  // 3. Weight Calculation & Factor Attribution
  let rawScore = 0;
  const breakdown = [];

  // PII & Document Leak (+35 max)
  let severityFactor = 0.20;
  if (docsFound.length > 0 || /document\s*number|aadhaar/i.test(text)) {
    rawScore += 35;
    severityFactor = 0.95;
    breakdown.push({ factor: 'National ID / Document Leak', count: Math.max(1, docsFound.length), points: 35 });
  }

  // Passwords (+30 max)
  if (passwordsFound.length > 0) {
    const pwPts = Math.min(30, passwordsFound.length * 20);
    rawScore += pwPts;
    severityFactor = Math.max(severityFactor, 0.85);
    breakdown.push({ factor: 'Compromised Passwords / Hashes', count: passwordsFound.length, points: pwPts });
  }

  // Physical Address (+20 max)
  if (addressMatches.length > 0 || /adres|address/i.test(text)) {
    rawScore += 20;
    breakdown.push({ factor: 'Physical Address / PII Exposed', count: Math.max(1, addressMatches.length), points: 20 });
  }

  // Contact Info (+15 max)
  if (phonesFound.length > 0 || /telephone|mobile/i.test(text)) {
    const phonePts = Math.min(15, Math.max(1, phonesFound.length) * 10);
    rawScore += phonePts;
    breakdown.push({ factor: 'Phone Numbers Linked', count: Math.max(1, phonesFound.length), points: phonePts });
  }

  // Multiple Leak Sources (+15 max)
  if (recordCount > 1 || breachSources.length > 1) {
    rawScore += 15;
    breakdown.push({ factor: 'Multiple Leak Sources', count: Math.max(recordCount, breachSources.length), points: 15 });
  }

  // AI Factors
  let phishingProb = 0.0;
  let correlationScore = 0.0;
  if (aiAnalysis) {
    phishingProb = Number(aiAnalysis.max_phishing_probability || 0.0);
    if (phishingProb > 0.40) {
      const phishPts = Math.min(30, Math.round(phishingProb * 30));
      rawScore += phishPts;
      breakdown.push({ factor: 'AI Phishing Probability', count: 1, points: phishPts });
    }
  }

  // Base score for confirmed breach
  rawScore = Math.max(20, rawScore);
  const score = Math.min(100, Math.round(rawScore));

  // Categorize Risk Level
  let riskLevel = 'LOW';
  let riskColor = '#00ff66';
  if (score >= 80) {
    riskLevel = 'CRITICAL';
    riskColor = '#ff003c';
  } else if (score >= 60) {
    riskLevel = 'HIGH';
    riskColor = '#ff6a00';
  } else if (score >= 30) {
    riskLevel = 'MEDIUM';
    riskColor = '#ffcc00';
  }

  const factors = {
    phishing_probability: roundFour(phishingProb),
    correlation_score: roundFour(recordCount > 1 ? 0.75 : 0.25),
    source_reliability: 0.90,
    severity: roundFour(severityFactor),
    recency: 0.95
  };

  return {
    score,
    riskLevel,
    riskColor,
    breakdown,
    factors,
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

function roundFour(val) {
  return Math.round((Number(val) || 0) * 10000) / 10000;
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
    /((?:password|passwd|pwd|pass|hash|md5|sha1|bcrypt|plaintext(?:\s*(?:pass|password|hash))?)[\s:=*]+)`?([^\s\n,`]+)`?/gi,
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
