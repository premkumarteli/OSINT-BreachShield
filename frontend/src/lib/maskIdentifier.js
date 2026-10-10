/**
 * Masks destination identifier for UI display.
 * Email: first char + dots + @domain (handles 1-char local parts)
 * Phone: dots + last 4 digits only (does not assume country code)
 * Guarantees raw identifier does not leak into rendered text.
 */
export function maskIdentifier(identifier, type = 'email') {
  if (!identifier) return '';
  const str = String(identifier).trim();

  if (type === 'phone') {
    const digits = str.replace(/[\s-]/g, '');
    const last4 = digits.length >= 4 ? digits.slice(-4) : digits;
    return `••••••••${last4}`;
  }

  const atIndex = str.indexOf('@');
  if (atIndex === -1) {
    return str.length > 0 ? `${str.charAt(0)}...` : '';
  }

  const firstChar = str.charAt(0);
  const domain = str.slice(atIndex);
  return `${firstChar}...${domain}`;
}
