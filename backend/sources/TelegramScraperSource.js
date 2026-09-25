/**
 * @file TelegramScraperSource.js
 * @description Pluggable source wrapping the live upstream Telegram Telethon OSINT scraper microservice.
 */

const { BreachSource } = require('./BreachSource');
const { analyzeExposure } = require('../analytics/riskEngine');
const { ingestRecord } = require('../ingest/kAnonymityStore');

class TelegramScraperSource extends BreachSource {
  /**
   * @param {string} pythonServiceUrl - Endpoint URL for Python FastAPI scraper
   */
  constructor(pythonServiceUrl) {
    super('TelegramScraperSource');
    this.pythonServiceUrl = pythonServiceUrl || process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8001/query';
  }

  /**
   * Query the upstream Telegram OSINT scraper and perform safe metadata auto-caching.
   * @param {string} normalizedTarget - Normalized email/phone
   * @param {string} targetHash - SHA-256 hex string
   */
  async search(normalizedTarget, targetHash) {
    const hits = [];
    let packets = [];
    let pagination = null;
    let botText = '';

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 35000);
      const resp = await fetch(this.pythonServiceUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: normalizedTarget }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      const data = await resp.json();
      botText = data.response || '';
      packets = (data.packets && data.packets.length > 0)
        ? data.packets.map(p => ({
            query: normalizedTarget,
            info: p.info || '',
            source: 'Telegram OSINT Feed',
            ...p
          }))
        : (botText ? [{ query: normalizedTarget, info: botText, source: 'Telegram OSINT Feed' }] : []);
      pagination = data.pagination || null;

      if (!botText && packets.length > 0) {
        botText = packets.map(p => p.info || '').join('\n\n');
      }

      // Tag any packet that carries demo/fallback text so the UI can label it honestly.
      packets = packets.map(pkt => {
        const info = pkt.info || '';
        const simulated = /demo mode|simulated|no live data|demonstration/i.test(info);
        return simulated ? { ...pkt, isSimulated: true, source: 'Telegram OSINT Feed' } : { ...pkt, source: 'Telegram OSINT Feed' };
      });

      // Extract high-level Finding metadata
      if (botText && !/no\s*results?(\s*found)?/i.test(botText) && !/service busy/i.test(botText)) {
        const exposureCheck = analyzeExposure(botText, normalizedTarget);
        const dataClasses = [];
        if (exposureCheck.entities.phoneCount > 0) dataClasses.push('PHONE');
        if (exposureCheck.entities.passwordCount > 0) dataClasses.push('PASSWORD_HASH');
        if (exposureCheck.entities.emailCount > 0) dataClasses.push('EMAIL');
        if (exposureCheck.entities.hasDocument) dataClasses.push('NATIONAL_ID');
        if (exposureCheck.entities.hasAddress) dataClasses.push('PHYSICAL_ADDRESS');
        if (dataClasses.length === 0) dataClasses.push('IDENTITY');

        // Flag demo-mode / fallback text: the upstream scraper served simulated
        // packets (e.g. no Telegram credentials, paywall, rate-limit fallback).
        const isSimulated = /demo mode|simulated|no live data|demonstration/i.test(botText);

        hits.push({
          source: 'Telegram OSINT Feed',
          title: 'Telegram Live OSINT Leak Intelligence',
          year: new Date().getFullYear().toString(),
          dataClasses,
          sourceType: isSimulated ? 'LOCAL' : 'LIVE_SCRAPER',
          isSimulated,
          raw: botText
        });

        // Auto-Cache Live Found Breach (METADATA ONLY — NO RAW PERSISTENCE)
        ingestRecord(
          normalizedTarget,
          'Telegram_OSINT_Feed',
          dataClasses,
          new Date().getFullYear().toString(),
          {
            target: normalizedTarget,
            source: 'Telegram_OSINT_Feed',
            dataClasses,
            exposure_score: exposureCheck.score,
            threat_level: exposureCheck.riskLevel,
            discovered_at: new Date().toISOString()
          }
        );
      }
    } catch (err) {
      console.warn('[TelegramScraperSource] Scraper offline or timed out; skipping live feed:', err.message);
    }

    return {
      sourceName: this.sourceName,
      hits,
      packets,
      pagination
    };
  }
}

module.exports = {
  TelegramScraperSource
};
