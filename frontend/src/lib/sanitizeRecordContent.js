import { sanitizeBreachText } from './sanitizeBreachText';

/**
 * Utility to strip all emojis and special pictograms from text
 */
export function stripEmojis(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{2B50}\u{203C}\u{2049}\u{2122}\u{2139}\u{2194}-\u{2199}\u{21A9}-\u{21AA}\u{231A}-\u{231B}\u{2328}\u{23CF}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{24C2}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}]/gu, '')
    .replace(/\*\*\s+/g, '**')
    .replace(/^[ \t]+/gm, '')
    .replace(/[ \t]{2,}/g, ' ');
}

/**
 * Sanitizes breach records, packets, and timeline details:
 * 1. Executes base breach sanitization (promo/handle stripping and target masking).
 * 2. Ensures phone numbers in matched records only show count, never the numbers themselves.
 * 3. Redacts document numbers and ensures no raw digit sequences of 10+ digits appear.
 */
export function sanitizeRecordContent(text, target = '', maskedTarget = '') {
  if (!text || typeof text !== 'string') return '';
  let out = sanitizeBreachText(text, target, maskedTarget);

  // 1. Redact telephone / phone field lines by replacing phone numbers with count
  // e.g. "Telephone: 917337771210" -> "Telephone: [1 phone number found in record]"
  // e.g. "Phone: +91 98765 00000, 9876500001" -> "Phone: [2 phone numbers found in record]"
  out = out.replace(
    /((?:(?:\*\*[^*]+\*\*\s*)?(?:Telephone|Phone|Mobile|Tel)[\s:=*]+))([^\n]+)/gi,
    (match, prefix, val) => {
      // Find candidate phone numbers (10 to 15 digits, optionally prefixed with + or +91)
      const phoneMatches = val.match(/(?:\+?91[\s-]*)?\b[6-9]\d{9}\b|\+?\b\d{10,15}\b/g) || [];
      const count = phoneMatches.length > 0 ? phoneMatches.length : 1;
      return `${prefix}[${count} phone number${count > 1 ? 's' : ''} found in record]`;
    }
  );

  // 2. Redact phone numbers mentioned inline in sentences
  out = out.replace(
    /(?:phone|mobile|tel)(?:[\s-]*number)?[\s:=*]+(?:\+?91[\s-]*)?([0-9\s-]{10,15})/gi,
    'phone: [1 phone number found in record]'
  );

  // 3. Redact document numbers (e.g. Document number: 602882687143, Aadhaar: 1234 5678 9012)
  out = out.replace(
    /((?:document\s*number|aadhaar|aadhar|passport|pan|taxpayer|voter|national\s*id)[\s:=*]+)`?([0-9a-zA-Z\s-]{6,})`?/gi,
    '$1[Document number redacted]'
  );

  // 4. Redact formatted Aadhaar-like 12-digit grouped sequences (e.g. 1234 5678 9012)
  out = out.replace(/\b\d{4}[\s-]\d{4}[\s-]\d{4}\b/g, '[Document number redacted]');

  // 5. Redact any remaining 10+ digit sequences (phone numbers or ID sequences)
  out = out.replace(/(?:\+?91[\s-]*)?\b\d{10,}\b/g, '[1 phone number found in record]');
  out = out.replace(/\b\d{10,}\b/g, '[Redacted number]');

  return out;
}
