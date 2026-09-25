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

  // Fetch exclusive Telegram source via registry (removing simulated/heuristic test sources)
  const sources = getEnabledSources({ pythonServiceUrl, exclusiveTelegram: true });
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

  // Run Analytics & Timeline Parsers on multi-source threat intelligence text
  const fullText = packets.map(p => p.info || '').join('\n\n');

  // Query AI Threat Analysis Microservice
  let aiAnalysis = null;
  let modelComparison = null;
  try {
    const fetchFn = globalThis.fetch || require('node-fetch');
    const controller = new AbortController();
    const aiTimeout = setTimeout(() => controller.abort(), 6000);
    const aiResp = await fetchFn(`${pythonServiceUrl.replace('/query', '')}/api/ai/analyze-threat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: fullText, query }),
      signal: controller.signal
    });
    clearTimeout(aiTimeout);
    if (aiResp.ok) {
      aiAnalysis = await aiResp.json();
      modelComparison = aiAnalysis.model_comparison || null;
    }
  } catch (aiErr) {
    console.warn('[SearchService AI warning] Could not fetch AI analysis:', aiErr.message);
  }

  const exposure = analyzeExposure(fullText, query, aiAnalysis);
  const timeline = parseBreachTimeline(fullText);

  // Auto-log Event Hash to Blockchain Audit Ledger
  let auditRecord = null;
  try {
    const { logThreatEvent } = require('../blockchain/auditLogger');
    auditRecord = await logThreatEvent({
      eventId: `search_${targetHash.substring(0, 12)}_${Date.now()}`,
      eventType: 'OSINT_BREACH_SEARCH',
      query: normalizedQuery,
      riskScore: exposure.score,
      riskLevel: exposure.riskLevel,
      sourceName: 'Telegram_OSINT_Feed'
    });
  } catch (blockchainErr) {
    console.warn('[SearchService Blockchain warning] Audit logging failed:', blockchainErr.message);
  }

  // Sanitize and redact sensitive credentials before delivering to client
  const sanitizedPackets = packets.map(p => ({
    ...p,
    info: redactSensitiveData(p.info || '', normalizedVerified || query)
  }));

  // Build structured records for frontend cards
  const records = liveHits.map((hit, idx) => ({
    id: idx + 1,
    source: hit.source || 'Telegram OSINT Feed',
    title: hit.title || `${hit.source || 'Telegram OSINT'} Threat Intelligence Spill`,
    year: hit.year || new Date().getFullYear().toString(),
    category: 'Telegram Intelligence',
    sourceType: hit.sourceType || 'LIVE_SCRAPER',
    isSimulated: Boolean(hit.isSimulated),
    dataClasses: Array.isArray(hit.dataClasses) && hit.dataClasses.length ? hit.dataClasses : ['IDENTITY'],
    details: hit.isSimulated
      ? 'Upstream Telegram scraper stream for target.'
      : 'Real-time threat spill captured from Telegram OSINT scraper.'
  }));

  if (records.length === 0 && sanitizedPackets.length > 0) {
    const validPackets = sanitizedPackets.filter(p => p.info && !/no\s*threat\s*records\s*detected/i.test(p.info) && !/no\s*results?\s*found/i.test(p.info));
    if (validPackets.length > 0) {
      records.push(...validPackets.map((pkt, idx) => ({
        id: idx + 1,
        source: 'Telegram OSINT Feed',
        title: `Telegram OSINT Threat Incident #${idx + 1}`,
        year: new Date().getFullYear().toString(),
        category: 'Telegram Intelligence',
        sourceType: 'LIVE_SCRAPER',
        isSimulated: Boolean(pkt.isSimulated),
        dataClasses: ['IDENTITY', 'CREDENTIALS'],
        details: (pkt.info || '').split('\n').filter(Boolean).slice(0, 3).join(' • ') || 'Compromised record identified in Telegram feed.'
      })));
    }
  }

  return {
    packets: sanitizedPackets,
    records,
    pagination,
    analytics: {
      exposure,
      timeline,
      aiAnalysis
    },
    auditLedger: auditRecord,
    blockchainAudit: auditRecord
  };
}

module.exports = {
  executeSearch
};

