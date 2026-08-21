/**
 * @file searchService.js
 * @description Dedicated search orchestration querying the Telegram OSINT live threat scraper feed.
 */

const { normalizeTarget, hashTarget } = require('../ingest/kAnonymityStore');
const { getEnabledSources } = require('../sources/registry');
const { analyzeExposure, redactSensitiveData } = require('../analytics/riskEngine');
const { parseBreachTimeline } = require('../analytics/timelineParser');

/**
 * Executes breach intelligence lookup exclusively against the Telegram OSINT scraper.
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

  const pythonServiceUrl = options.pythonServiceUrl || process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8001/query';

  // Fetch exclusive Telegram source via registry and execute
  const sources = getEnabledSources({ pythonServiceUrl });
  const results = await Promise.allSettled(sources.map(s => s.search(normalizedQuery, targetHash)));

  const liveHits = [];

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      const { hits = [], packets: srcPackets = [], pagination: srcPag } = result.value;
      if (hits.length > 0) liveHits.push(...hits);
      if (srcPackets.length > 0) packets.push(...srcPackets);
      if (srcPag) pagination = srcPag;
    }
  }

  if (packets.length === 0) {
    packets.push({ query, info: 'Scan complete. No threat records detected in Telegram OSINT feeds.' });
  }

  // Run Analytics & Timeline Parsers on Telegram threat intelligence text
  const fullText = packets.map(p => p.info || '').join('\n\n');
  const exposure = analyzeExposure(fullText, query);
  const timeline = parseBreachTimeline(fullText);

  // Sanitize and redact sensitive credentials before delivering to client
  const sanitizedPackets = packets.map(p => ({
    ...p,
    info: redactSensitiveData(p.info || '', normalizedVerified || query)
  }));

  // Build structured records for frontend cards
  const records = liveHits.map((hit, idx) => ({
    id: idx + 1,
    source: 'Telegram OSINT Feed',
    title: 'Telegram Threat Scraper Spill',
    year: hit.year || new Date().getFullYear().toString(),
    category: 'Live Threat Feed',
    sourceType: 'TELEGRAM',
    dataClasses: Array.isArray(hit.dataClasses) && hit.dataClasses.length ? hit.dataClasses : ['IDENTITY'],
    details: 'Real-time credential or database leak captured across monitored Telegram OSINT channels.'
  }));

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
