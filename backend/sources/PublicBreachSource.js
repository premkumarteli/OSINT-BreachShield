const { BreachSource } = require('./BreachSource');
const { getRange, getStoredRecords } = require('../ingest/kAnonymityStore');

class PublicBreachSource extends BreachSource {
  constructor() {
    super('PublicBreachCatalogSource');
  }

  async search(normalizedTarget, targetHash) {
    const hits = [];
    const packets = [];

    try {
      // Query local k-anonymity store prefix
      if (targetHash && targetHash.length >= 5) {
        const prefix = targetHash.slice(0, 5).toUpperCase();
        const suffix = targetHash.slice(5).toUpperCase();
        const range = getRange(prefix);
        const match = range.find(r => r.suffix.toUpperCase() === suffix);
        
        if (match) {
          hits.push({
            source: 'Catalog_Breach_Database',
            year: match.year || new Date().getFullYear().toString(),
            dataClasses: match.dataClasses || ['EMAIL', 'IDENTITY'],
            sourceType: 'CATALOG',
            raw: `[PUBLIC BREACH CATALOG] Matched records in offline repository for target hash ${targetHash.substring(0, 8)}`
          });

          packets.push({
            query: normalizedTarget,
            info: `[PUBLIC BREACH CATALOG MATCH]\nSources: ${(match.sources || ['Catalog_Database']).join(', ')}\nDiscovered Year: ${match.year || '2024'}\nExposed Categories: ${(match.dataClasses || []).join(', ')}`,
            source: 'Catalog_Breach_Database'
          });
        }
      }
    } catch (err) {
      console.warn('[PublicBreachSource] Search error:', err.message);
    }

    return {
      sourceName: this.sourceName,
      hits,
      packets
    };
  }
}

module.exports = { PublicBreachSource };

