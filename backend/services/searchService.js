/**
 * @file searchService.js
 * @description Multi-source parallel search orchestration and analytics aggregation.
 */

const { normalizeTarget, hashTarget } = require('../ingest/kAnonymityStore');
const { getEnabledSources } = require('../sources/registry');
const { analyzeExposure, redactSensitiveData } = require('../analytics/riskEngine');
const { parseBreachTimeline } = require('../analytics/timelineParser');

/**
 * Executes a concurrent multi-source breach intelligence lookup.
 * @param {string} query - Raw target identifier (email or phone)
 * @param {string} verifiedTarget - The verified target from JWT
 * @param {object} [options] - Optional runtime parameters (e.g. pythonServiceUrl)
 */
async function executeSearch(query, verifiedTarget, options = {}) {
  const normalizedQuery = normalizeTarget(query);
  const normalizedVerified = normalizeTarget(verifiedTarget);

  if (!normalizedQuery || normalizedQuery !== normalizedVerified) {
    const err = new Error('You can only search the email/phone you verified.');
    err.status = 403;
    throw err;
  }

  const targetHash = hashTarget(normalizedQuery);
  const packets = [];
  let pagination = null;

  const pythonServiceUrl = options.pythonServiceUrl || process.env.PYTHON_SERVICE_URL || 'https://osint-breach-python.onrender.com/query';

  // 1. Fetch enabled sources via registry and execute concurrently
  const sources = getEnabledSources({ pythonServiceUrl });
  const results = await Promise.allSettled(sources.map(s => s.search(normalizedQuery, targetHash)));

  const localOrCatalogHits = [];
  const liveScraperPackets = [];

  // 2. Merge all hits across sources
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      const { hits = [], packets: srcPackets = [], pagination: srcPag } = result.value;
      for (const hit of hits) {
        if (hit.sourceType === 'LOCAL' || hit.sourceType === 'CATALOG') {
          localOrCatalogHits.push(hit);
        }
      }
      if (srcPackets.length > 0) {
        liveScraperPackets.push(...srcPackets);
      }
      if (srcPag) {
        pagination = srcPag;
      }
    }
  }

  // 3. Render Local & Catalog Breach Intelligence repository block if hits exist
  if (localOrCatalogHits.length > 0) {
    const allDataClasses = Array.from(new Set(localOrCatalogHits.flatMap(h => h.dataClasses || [])));
    const prefix = targetHash.slice(0, 5);

    let breachDetails = `══════════════════════════════════════════════════════\n` +
      `[ BREACHSHIELD RAW INTELLIGENCE REPOSITORY ]\n` +
      `• Target Identifier: ${normalizedQuery}\n` +
      `• SHA-256 Fingerprint: ${targetHash}\n` +
      `• Partition Bucket: ${prefix}\n` +
      `• Compromised Records: ${localOrCatalogHits.length}\n` +
      `• Exposed Data Classes: ${allDataClasses.join(', ')}\n` +
      `══════════════════════════════════════════════════════\n\n`;

    localOrCatalogHits.forEach((rec, idx) => {
      breachDetails += `[ RECORD #${idx + 1} | SOURCE: ${String(rec.source || 'BREACH_ARCHIVE').toUpperCase()} (Year: ${rec.year || '2024'}) ]\n`;
      breachDetails += `• Target          : ${normalizedQuery}\n`;
      breachDetails += `• Exposed Classes : ${(rec.dataClasses && rec.dataClasses.length ? rec.dataClasses : allDataClasses).join(', ')}\n`;
      breachDetails += `• Discovery Year  : ${rec.year || '2024'}\n\n`;
    });

    packets.push({ query, info: breachDetails.trim(), source: 'LOCAL_K_ANON_DB' });
  }

  // 4. Append secondary Live OSINT scraper packets if any
  if (liveScraperPackets.length > 0) {
    packets.push(...liveScraperPackets);
  }

  if (packets.length === 0) {
    packets.push({ query, info: 'Scan complete. No public breach records detected in primary archives.' });
  }

  // Run Analytics & Timeline Parsers on combined multi-source text
  const fullText = packets.map(p => p.info || '').join('\n\n');
  const exposure = analyzeExposure(fullText, query);
  const timeline = parseBreachTimeline(fullText);

  // Sanitize and redact plaintext credentials before delivering to frontend
  const sanitizedPackets = packets.map(p => ({
    ...p,
    info: redactSensitiveData(p.info || '', normalizedVerified || query)
  }));

  // Build structured records for modern card presentation
  const records = localOrCatalogHits.map((hit, idx) => {
    const srcName = hit.source || 'Breach Archive';
    const isMalware = srcName.toLowerCase().includes('hudsonrock') || srcName.toLowerCase().includes('stealer');
    const isDomain = srcName.toLowerCase().includes('domain');
    let category = 'Database Spill';
    if (isMalware) category = 'Infostealer Malware';
    else if (isDomain) category = 'Domain Incident History';
    else if (srcName.toLowerCase().includes('hibp')) category = 'Public Breach Archive';

    return {
      id: idx + 1,
      source: srcName,
      title: srcName.replace(/^HudsonRock_/, '').replace(/_/g, ' '),
      year: hit.year || '2024',
      category,
      sourceType: hit.sourceType || 'LOCAL',
      dataClasses: Array.isArray(hit.dataClasses) && hit.dataClasses.length ? hit.dataClasses : ['IDENTITY'],
      details: isMalware 
        ? 'Account credentials harvested via infostealer malware infection on active workstation.' 
        : isDomain
        ? 'Historical security incident reported on associated email domain.'
        : 'Credentials and identifier recorded in compromised repository archive.'
    };
  });

  return {
    packets: sanitizedPackets,
    records,
    pagination,
    analytics: {
      exposure,
      timeline
    }
  };
}

module.exports = {
  executeSearch
};
