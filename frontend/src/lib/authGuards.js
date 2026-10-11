/**
 * @file lib/authGuards.js
 * @description Centralized client-side route guard helper for protected pages (/scanning, /results).
 */

/**
 * Normalizes an identifier:
 * - Emails: trim + lowercase
 * - Phones: digits only (strips +, spaces, dashes, parentheses)
 * @param {string} val
 * @returns {string}
 */
export function normalizeIdentifier(val) {
  const str = String(val || '').trim();
  if (str.includes('@')) {
    return str.toLowerCase();
  }
  // Digits only for phone numbers
  return str.replace(/\D/g, '');
}

/**
 * Checks session credentials for access to /scanning and /results.
 * Rules:
 * 1. no osint_target_email -> redirect '/search'
 * 2. target exists but osint_verified_email does not match it, or no osint_token -> redirect '/verify'
 * Compare normalised: trim + lowercase for emails, digits only for phones.
 *
 * @returns {{ allow: boolean, redirectTo: string | null }}
 */
export function checkProtectedGuard() {
  const target = sessionStorage.getItem('osint_target_email');
  if (!target) {
    return { allow: false, redirectTo: '/search' };
  }

  const verified = sessionStorage.getItem('osint_verified_email');
  const token = sessionStorage.getItem('osint_token');

  if (!token || !verified) {
    return { allow: false, redirectTo: '/verify' };
  }

  const normTarget = normalizeIdentifier(target);
  const normVerified = normalizeIdentifier(verified);

  if (!normTarget || normTarget !== normVerified) {
    return { allow: false, redirectTo: '/verify' };
  }

  return { allow: true, redirectTo: null };
}
