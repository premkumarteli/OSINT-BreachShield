/**
 * @file BreachSource.js
 * @description Base class and interface contract for pluggable breach intelligence sources.
 * 
 * Every source implementation must return the standard { hits: Finding[], sourceName: string } shape
 * regardless of underlying protocol (k-anonymity store, flat catalog, live scraper API, etc.),
 * allowing the search route handler to orchestrate queries without source-specific branching.
 */

/**
 * @typedef {Object} Finding
 * @property {string} source - Breach name or provider identity (e.g. 'Air_India_SITA_2021', 'Catalog_Adobe')
 * @property {string} year - Year of the breach occurrence (e.g. '2021')
 * @property {string[]} dataClasses - Exposed data categories (e.g. ['EMAIL', 'PASSWORD_HASH', 'PHONE'])
 * @property {'LOCAL' | 'CATALOG' | 'LIVE_SCRAPER'} sourceType - Origin classification of the finding
 * @property {string|null} [raw] - Optional raw response text (only populated by LIVE_SCRAPER, null for LOCAL/CATALOG)
 */

class BreachSource {
  /**
   * @param {string} name - Human-readable source identifier
   */
  constructor(name = 'GenericBreachSource') {
    this.sourceName = name;
  }

  /**
   * Query the underlying breach source for a normalized target identifier.
   * @param {string} normalizedTarget - Normalized email (e.g. 'user@example.com') or phone (e.g. '+919876543210')
   * @param {string} targetHash - Full SHA-256 hex string of the normalized target
   * @returns {Promise<{ hits: Finding[], sourceName: string, packets?: Array<{query: string, info: string, source?: string}>, pagination?: any }>}
   */
  async search(normalizedTarget, targetHash) {
    throw new Error(`[BreachSource] search() method must be implemented by subclass: ${this.sourceName}`);
  }
}

module.exports = {
  BreachSource
};
