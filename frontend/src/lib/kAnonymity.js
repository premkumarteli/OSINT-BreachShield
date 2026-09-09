import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

/**
 * Computes SHA-256 hash using native Web Crypto API in browser or Node/Jest fallback.
 */
export async function computeSha256(text) {
  const normalized = String(text || '').trim().toLowerCase();

  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle && typeof TextEncoder !== 'undefined') {
      const msgUint8 = new TextEncoder().encode(normalized);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    }
  } catch (_) {}

  try {
    if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
      const msgUint8 = new TextEncoder().encode(normalized);
      const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    }
  } catch (_) {}

  return '';
}

/**
 * Returns auth headers from sessionStorage.
 */
function getAuthHeaders() {
  const token = sessionStorage.getItem('osint_token');
  const headers = { Accept: 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

/**
 * Queries the k-Anonymity range API with a 5-character prefix.
 */
export async function queryRange(prefix) {
  if (!prefix || prefix.length !== 5) return { matches: [], count: 0 };
  try {
    const res = await axios.get(`${API_BASE}/api/v1/range/${prefix.toUpperCase()}`, {
      headers: getAuthHeaders(),
      timeout: 8000
    });
    if (res.data && res.data.success) {
      return res.data;
    }
    return { matches: [], count: 0 };
  } catch (err) {
    return { matches: [], count: 0 };
  }
}

/**
 * Checks a target using zero-knowledge client-side hashing.
 * The raw email/phone never leaves the browser — only the SHA-256 prefix is sent.
 */
export async function checkKAnonymity(target) {
  try {
    const fullHash = await computeSha256(target);
    if (!fullHash) return null;

    const prefix = fullHash.slice(0, 5);
    const suffix = fullHash.slice(5);

    const rangeResult = await queryRange(prefix);
    const match = (rangeResult.matches || []).find(m => m.suffix.toUpperCase() === suffix);

    return {
      searchedTarget: target,
      fullHash,
      prefix,
      suffix,
      isPwned: Boolean(match),
      exposureCount: match ? match.count : 0,
      sources: match ? match.sources : [],
      dataClasses: match ? match.dataClasses : [],
      year: match ? match.year : null,
      method: 'k-anonymity'
    };
  } catch (err) {
    return null;
  }
}

/**
 * Fetches breach details from catalog by name.
 */
export async function getBreachMetadata(name) {
  try {
    const res = await axios.get(`${API_BASE}/api/v1/breaches/${encodeURIComponent(name)}`, {
      headers: getAuthHeaders(),
      timeout: 6000
    });
    if (res.data && res.data.success) {
      return res.data.breach;
    }
    return null;
  } catch (_) {
    return null;
  }
}
