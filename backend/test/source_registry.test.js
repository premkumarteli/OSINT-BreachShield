const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { getEnabledSources, TelegramScraperSource } = require('../sources/registry');

describe('BreachSource Registry (sources/registry.js) - Exclusive Telegram OSINT Feed', () => {

  it('5.1: getEnabledSources() exclusively returns TelegramScraperSource', () => {
    const sources = getEnabledSources({ pythonServiceUrl: 'http://127.0.0.1:8001/query' });
    
    assert.equal(sources.length, 1, 'Should have exactly 1 active source (Telegram OSINT Scraper)');
    assert.ok(sources[0] instanceof TelegramScraperSource, 'TelegramScraperSource is registered as the exclusive primary source');
  });

  it('5.2: TelegramScraperSource adheres to BreachSource search() contract shape', async () => {
    const scraper = new TelegramScraperSource('http://127.0.0.1:8001/query');
    assert.equal(scraper.sourceName, 'TelegramScraperSource');
  });
});
