/**
 * Builds the payload for POST /api/auth/send-otp
 * Preserves exact payload shape between SearchPage and VerifyOtpPage
 */
export function buildSendOtpPayload(identifier, type = 'email') {
  const clean = (identifier || '').trim();
  if (type === 'phone') {
    const digits = clean.replace(/[\s-]/g, '');
    return { target: digits, phone: digits, email: digits };
  }
  return { email: clean.toLowerCase() };
}
