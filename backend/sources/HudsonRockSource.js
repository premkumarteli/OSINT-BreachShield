/**
 * @file HudsonRockSource.js
 * @description Real-time live cybercrime & infostealer intelligence source via Hudson Rock Cavalier API.
 * Detects whether credentials or identifiers were compromised by infostealer malware (RedLine, Vidar, Lumma, Raccoon).
 */

const { BreachSource } = require('./BreachSource');
const { ingestRecord } = require('../ingest/kAnonymityStore');

class HudsonRockSource extends BreachSource {
  constructor() {
    super('HudsonRock_Infostealer_Intel');
  }

  /**
   * Search Hudson Rock Cybercrime API for email or phone/username compromises.
   * @param {string} normalizedTarget - Normalized email (e.g. user@domain.com) or phone (e.g. +919876543210)
   * @param {string} targetHash - SHA-256 hex string
   */
  async search(normalizedTarget, targetHash) {
    const hits = [];
    const isEmail = normalizedTarget.includes('@');
    const cleanTarget = isEmail ? normalizedTarget : normalizedTarget.replace(/[^0-9]/g, '');

    const endpoint = isEmail
      ? `https://cavalier.hudsonrock.com/api/json/v2/osint-tools/search-by-email?email=${encodeURIComponent(normalizedTarget)}`
      : `https://cavalier.hudsonrock.com/api/json/v2/osint-tools/search-by-username?username=${encodeURIComponent(cleanTarget)}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const resp = await fetch(endpoint, {
        headers: {
          'User-Agent': 'BreachShield-OSINT/2.0 (Cyber-Defense Monitoring)'
        },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (resp.ok) {
        const data = await resp.json();
        const stealers = Array.isArray(data.stealers) ? data.stealers : [];

        for (const s of stealers) {
          const stealerFamily = s.stealer_family || s.malware_family || 'Infostealer_Malware';
          const dateCompromised = s.date_compromised || s.date || '';
          const year = dateCompromised ? dateCompromised.split('-')[0] : new Date().getFullYear().toString();
          const computerName = s.computer_name || 'Workstation';
          const operatingSystem = s.os || 'Windows';
          const corporateDomains = Array.isArray(s.corporate_services) ? s.corporate_services : [];

          const dataClasses = ['CREDENTIALS', 'SYSTEM_METRICS', 'BROWSER_AUTOFILL'];
          if (isEmail) dataClasses.push('EMAIL');
          else dataClasses.push('PHONE');

          hits.push({
            source: `HudsonRock_${stealerFamily}`,
            year,
            dataClasses,
            sourceType: 'LOCAL',
            raw: null
          });

          // Auto-cache metadata to local k-anonymity store
          ingestRecord(
            normalizedTarget,
            `HudsonRock_${stealerFamily}`,
            dataClasses,
            year,
            {
              target: normalizedTarget,
              source: `HudsonRock_${stealerFamily}`,
              dataClasses,
              exposure_score: 85,
              threat_level: 'HIGH',
              details: `Malware infection detected on ${operatingSystem} (${computerName}). Exposed domains: ${corporateDomains.join(', ') || 'Various'}`,
              discovered_at: new Date().toISOString()
            }
          );
        }
      }
    } catch (err) {
      console.warn('[HudsonRockSource] API request skipped/timeout:', err.message);
    }

    return {
      sourceName: this.sourceName,
      hits
    };
  }
}

module.exports = {
  HudsonRockSource
};
