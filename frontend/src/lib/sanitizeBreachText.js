import { maskIdentifier } from './maskIdentifier';

/**
 * Sanitizes text from OSINT breach sources:
 * 1. Removes third-party bot promo, handle lines, and metadata.
 * 2. Redacts all @handles.
 * 3. Replaces all forms of the user's identifier (with/without +, with/without 91, digits-only, spaced) with the masked target.
 * 4. Fixes text corruption where dictionary words were accidentally redacted as document numbers.
 */
export function sanitizeBreachText(text, target = '', maskedTarget = '') {
  if (!text || typeof text !== 'string') return '';
  let out = text;

  // 1. Remove third-party bot promo / handle / metadata lines
  const lines = out.split('\n');
  const filteredLines = lines.filter((line) => {
    const l = line.toLowerCase();
    if (l.includes('free version of the bot')) return false;
    if (l.includes('buying a subscription')) return false;
    if (l.includes('subscription is over') || l.includes('trial period lasted')) return false;
    if (l.includes('mirror (in case of removal') || l.includes('mirrors:')) return false;
    if (l.includes('subjects made')) return false;
    if (l.includes('search time')) return false;
    return true;
  });
  out = filteredLines.join('\n');

  // 2. Strip / redact any @handle
  out = out.replace(/@[a-zA-Z0-9_]{2,}/g, '');

  // 3. Fix document number text corruption
  out = out.replace(/Aadhaar\s*\*\*mber/gi, 'Aadhaar number');
  out = out.replace(/\*{10,}pear/gi, 'taxpayer numbers appear');

  // Fix document number regex so it only redacts document-number-like digit strings
  out = out.replace(
    /((?:document\s*number|aadhaar|aadhar|passport|pan|taxpayer|voter|national\s*id)[\s:=*]+)`?([0-9a-zA-Z -]{6,})`?/gi,
    (match, prefix, val) => {
      if (!val) return match;
      const cleanVal = val.trim();
      const digits = cleanVal.replace(/\D/g, '');
      if (digits.length < 4) return match;
      const masked = cleanVal.length > 4 ? '*'.repeat(cleanVal.length - 4) + cleanVal.slice(-4) : '****';
      return `${prefix}${masked}`;
    }
  );

  // 4. Sanitize every form of the target identifier
  if (target) {
    const targetStr = String(target).trim();
    const effectiveMask = maskedTarget || maskIdentifier(targetStr, targetStr.includes('@') ? 'email' : 'phone');

    if (targetStr.includes('@')) {
      const escaped = targetStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      out = out.replace(new RegExp(escaped, 'gi'), effectiveMask);
    } else {
      const digitsOnly = targetStr.replace(/\D/g, '');
      if (digitsOnly) {
        const tenDigits = digitsOnly.startsWith('91') && digitsOnly.length > 10 ? digitsOnly.slice(2) : digitsOnly;
        // Match with/without +91, with/without 91, and flexible inter-digit spacing/dashes
        const spacedPattern = tenDigits.split('').join('[\\s-]*');
        const phoneRegex = new RegExp(`(?:\\+?91[\\s-]*)?${spacedPattern}`, 'g');
        out = out.replace(phoneRegex, effectiveMask);
        if (digitsOnly !== tenDigits) {
          out = out.replace(new RegExp(digitsOnly, 'g'), effectiveMask);
        }
      }
      // Also direct replacement of the exact string
      const escapedTarget = targetStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      out = out.replace(new RegExp(escapedTarget, 'g'), effectiveMask);
    }
  }

  return out;
}
