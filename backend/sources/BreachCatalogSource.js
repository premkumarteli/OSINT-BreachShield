/**
 * @file BreachCatalogSource.js
 * @description Pluggable source checking known enterprise breach catalogs by organization target domain.
 */

const path = require('path');
const fs = require('fs');
const { BreachSource } = require('./BreachSource');

const CATALOG_INDEX_FILE = path.join(__dirname, '..', '..', 'data', 'catalog', 'breaches_index.json');

// Generic public webmail domains that should not be flagged as a single organization breach
const PUBLIC_WEBMAIL_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
  'mail.com', 'protonmail.com', 'proton.me', 'aol.com', 'zoho.com'
]);

class BreachCatalogSource extends BreachSource {
  constructor() {
    super('BreachCatalogSource');
  }

  /**
   * Search enterprise breach catalog by target domain (for custom enterprise emails).
   * @param {string} normalizedTarget - Normalized email or phone
   * @param {string} targetHash - SHA-256 hex string
   */
  async search(normalizedTarget, targetHash) {
    const hits = [];
    if (!normalizedTarget.includes('@')) {
      return { sourceName: this.sourceName, hits };
    }

    try {
      if (fs.existsSync(CATALOG_INDEX_FILE)) {
        const indexData = JSON.parse(fs.readFileSync(CATALOG_INDEX_FILE, 'utf8') || '{}');
        const domain = normalizedTarget.split('@')[1]?.toLowerCase().trim();
        
        // Skip common consumer public email providers to avoid broad false positive domain matches
        if (domain && !PUBLIC_WEBMAIL_DOMAINS.has(domain) && indexData.byDomain && indexData.byDomain[domain]) {
          const match = indexData.byDomain[domain];
          const rawDate = match.breachDate || match.BreachDate || '';
          const year = rawDate ? rawDate.split('-')[0] : '2024';
          const dc = match.dataClasses || match.DataClasses;
          hits.push({
            source: `${match.title || match.Title || match.name || match.Name || domain} (Domain Incident History)`,
            year: year,
            dataClasses: Array.isArray(dc) ? dc : ['DOMAIN_HISTORY'],
            sourceType: 'CATALOG',
            raw: null
          });
        }
      }
    } catch (err) {
      console.warn('[BreachCatalogSource] Error checking catalog index:', err.message);
    }

    return {
      sourceName: this.sourceName,
      hits
    };
  }
}

module.exports = {
  BreachCatalogSource
};
