/**
 * @file HIBPApiSource.js
 * @description Real-time HaveIBeenPwned (HIBP) Breached Account intelligence source.
 * Queries the official HIBP API v3 when HIBP_API_KEY is configured in environment.
 */

const { BreachSource } = require('./BreachSource');

class HIBPApiSource extends BreachSource {
  constructor() {
    super('HaveIBeenPwned_Range_API');
  }

  /**
   * Check HIBP Breached Account API for verified email compromises.
   * @param {string} normalizedTarget - Normalized email/phone
   * @param {string} targetHash - Full SHA-256 string
   */
  async search(normalizedTarget, targetHash) {
    const hits = [];
    const apiKey = (process.env.HIBP_API_KEY || '').trim();

    // Only search emails on HIBP
    if (!normalizedTarget.includes('@')) {
      return { sourceName: this.sourceName, hits };
    }

    if (!apiKey) {
      // HIBP Breached Account API requires an API key in v3.
      // If unconfigured, skip cleanly without throwing false positives.
      return { sourceName: this.sourceName, hits };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const resp = await fetch(
        `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(normalizedTarget)}?truncateResponse=false`,
        {
          headers: {
            'hibp-api-key': apiKey,
            'user-agent': 'BreachShield-OSINT-Checker/2.0'
          },
          signal: controller.signal
        }
      );
      clearTimeout(timeout);

      if (resp.status === 200) {
        const breaches = await resp.json();
        if (Array.isArray(breaches)) {
          for (const b of breaches) {
            const rawDate = b.BreachDate || b.AddedDate || '';
            const year = rawDate ? rawDate.split('-')[0] : '2024';
            hits.push({
              source: `HIBP_${b.Title || b.Name || 'Breach'}`,
              year,
              dataClasses: Array.isArray(b.DataClasses) ? b.DataClasses : ['IDENTITY'],
              sourceType: 'LOCAL',
              raw: null
            });
          }
        }
      } else if (resp.status === 404) {
        // 404 indicates no breaches found on HIBP for this account
      }
    } catch (err) {
      console.warn('[HIBPApiSource] HIBP API check skipped/timed out:', err.message);
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
