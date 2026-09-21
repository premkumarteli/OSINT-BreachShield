/* global globalThis */
import '@testing-library/jest-dom';
import { webcrypto } from 'crypto';
import { TextEncoder as NodeTextEncoder, TextDecoder as NodeTextDecoder } from 'util';

// Mock HTMLMediaElement methods in jsdom test environment
window.HTMLMediaElement.prototype.play = () => Promise.resolve();
window.HTMLMediaElement.prototype.pause = () => {};
window.HTMLMediaElement.prototype.load = () => {};

// jsdom (CRA test env) does not provide Web Crypto `subtle` or TextEncoder,
// which the k-anonymity hashing (kAnonymity.js) and other code paths rely on.
// Browsers ship both natively; this polyfills them only for the test runner.
if (!globalThis.crypto || !globalThis.crypto.subtle) {
  globalThis.crypto = webcrypto;
}
if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = NodeTextEncoder;
  globalThis.TextDecoder = NodeTextDecoder;
}

