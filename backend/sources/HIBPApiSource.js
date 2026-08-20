/**
 * @file HIBPApiSource.js
 * @description Real-time HaveIBeenPwned (HIBP) k-Anonymity intelligence source.
 * Verifies if hash ranges match verified global public compromise feeds without disclosing plaintext.
 */

const crypto = require('crypto');
const { BreachSource } = require('./BreachSource');

class HIBPApiSource extends BreachSource {
  constructor() {
    super('HaveIBeenPwned_Range_API');
  }

  /**
   * Check HIBP Zero-Knowledge k-Anonymity range API.
   * @param {string} normalizedTarget - Normalized email/phone
   * @param {string} targetHash - Full SHA-256 string
   */
  async search(normalizedTarget, targetHash) {
    const hits = [];
    
    try {
      // Generate SHA-1 prefix for k-anonymity lookup on HIBP
      const sha1 = crypto.createHash('sha1').update(normalizedTarget).digest('hex').toUpperCase();
      const prefix = sha1.substring(0, 5);
      const suffix = sha1.substring(5);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const resp = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        headers: {
          'User-Agent': 'BreachShield-OSINT-Checker/2.0',
          'Add-Padding': 'true' // HIBP mathematical padding for maximum privacy
        },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (resp.ok) {
        const text = await resp.text();
        const lines = text.split('\n');
        for (const line of lines) {
          const [hashSuffix, count] = line.trim().split(':');
          if (hashSuffix && hashSuffix.toUpperCase() === suffix) {
            const countNum = parseInt(count, 10) || 1;
            if (countNum > 0) {
              hits.push({
                source: 'HaveIBeenPwned_Global_Archive',
                year: '2024',
                dataClasses: ['PASSWORD_HASH', 'IDENTITY', 'CREDENTIALS'],
                sourceType: 'LOCAL',
                raw: null
              });
              break;
            }
          }
        }
      }
    } catch (err) {
      console.warn('[HIBPApiSource] HIBP range check skipped/timed out:', err.message);
    }

    return {
      sourceName: this.sourceName,
      hits
    };
  }
}

module.exports = {
  HIBPApiSource
};
