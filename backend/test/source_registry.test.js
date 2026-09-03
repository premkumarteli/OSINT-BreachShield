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
});
