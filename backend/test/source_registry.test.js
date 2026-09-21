const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { getEnabledSources, TelegramScraperSource } = require('../sources/registry');

describe('BreachSource Registry (sources/registry.js) - Exclusive Telegram OSINT Feed', () => {

  it('5.1: getEnabledSources() returns active OSINT source adapters including TelegramScraperSource', () => {
    const sources = getEnabledSources({ pythonServiceUrl: 'http://127.0.0.1:8001/query' });
    
    assert.ok(sources.length >= 1, 'Should have active source adapters registered');
    assert.ok(sources.some(s => s instanceof TelegramScraperSource), 'TelegramScraperSource is registered among active sources');
  });

  it('5.2: TelegramScraperSource adheres to BreachSource search() contract shape', async () => {
    const scraper = new TelegramScraperSource('http://127.0.0.1:8001/query');
    assert.equal(scraper.sourceName, 'TelegramScraperSource');
  });

  it('5.3: rule-based heuristic sources are labeled isSimulated / LOCAL, never claiming live data', async () => {
    const sources = getEnabledSources({ pythonServiceUrl: 'http://127.0.0.1:8001/query' });
    const phish = sources.find(s => s.constructor.name === 'PhishingFeedSource');
    const intel = sources.find(s => s.constructor.name === 'ThreatIntelSource');
    assert.ok(phish && intel, 'Both heuristic sources registered');

    const phishRes = await phish.search('is@verify.com', 'A'.repeat(64));
    const intelRes = await intel.search('login.secure.example.com', 'B'.repeat(64));

    for (const res of [phishRes, intelRes]) {
      assert.ok(res.hits.length === 1, 'Heuristic match produces a hit');
      assert.ok(res.hits[0].isSimulated === true, 'Hit must be flagged simulated');
      assert.equal(res.hits[0].sourceType, 'LOCAL');
      assert.ok(/no live|SIMULATED/i.test(res.packets[0].info), 'Packet text must not claim a live feed');
      assert.ok(!/\bPUBLIC (PHISHING|THREAT INTEL) FEED\b/i.test(res.packets[0].info), 'Must not impersonate a public live feed');
    }
  });
});
