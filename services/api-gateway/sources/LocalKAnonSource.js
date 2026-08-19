/**
 * @file LocalKAnonSource.js
 * @description Pluggable source wrapping the local k-anonymity partition store and structured document store.
 */

const { BreachSource } = require('./BreachSource');
const { getRange, getStoredRecords } = require('../ingest/kAnonymityStore');

class LocalKAnonSource extends BreachSource {
  constructor() {
    super('LocalKAnonSource');
  }

  /**
   * Search local partition buckets and document records for target matches.
   * @param {string} normalizedTarget - Normalized email/phone
   * @param {string} targetHash - SHA-256 hex string
   */
  async search(normalizedTarget, targetHash) {
    const prefix = targetHash.slice(0, 5);
    const suffix = targetHash.slice(5);
    const rangeMatches = getRange(prefix);
    const localMatch = rangeMatches.find(m => m.suffix === suffix);
    const storedRecords = getStoredRecords(normalizedTarget);

    const hits = [];

    if (storedRecords.length > 0) {
      for (const rec of storedRecords) {
        hits.push({
          source: rec.source || 'Local_Archive',
          year: rec.year || '2024',
          dataClasses: rec.dataClasses && rec.dataClasses.length ? rec.dataClasses : ['IDENTITY'],
          sourceType: 'LOCAL',
          raw: null
        });
      }
    } else if (localMatch && localMatch.sources.length > 0) {
      for (const src of localMatch.sources) {
        hits.push({
          source: src,
          year: localMatch.year || '2024',
          dataClasses: localMatch.dataClasses && localMatch.dataClasses.length ? localMatch.dataClasses : ['IDENTITY'],
          sourceType: 'LOCAL',
          raw: null
        });
      }
    }

    return {
      sourceName: this.sourceName,
      hits
    };
  }
}

module.exports = {
  LocalKAnonSource
};
