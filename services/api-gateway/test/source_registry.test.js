const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { getEnabledSources, LocalKAnonSource, BreachCatalogSource, TelegramScraperSource } = require('../sources/registry');

describe('BreachSource Registry (sources/registry.js)', () => {
  const originalEnv = process.env.ENABLE_TELEGRAM_SCRAPER;

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.ENABLE_TELEGRAM_SCRAPER = originalEnv;
    } else {
      delete process.env.ENABLE_TELEGRAM_SCRAPER;
    }
  });

  it('5.1: getEnabledSources() returns only Local and Catalog sources by default (ENABLE_TELEGRAM_SCRAPER unset)', () => {
    delete process.env.ENABLE_TELEGRAM_SCRAPER;
    const sources = getEnabledSources();
    
    assert.equal(sources.length, 2, 'Should have exactly 2 active sources by default');
    assert.ok(sources.some(s => s instanceof LocalKAnonSource), 'LocalKAnonSource is registered');
    assert.ok(sources.some(s => s instanceof BreachCatalogSource), 'BreachCatalogSource is registered');
    assert.ok(!sources.some(s => s instanceof TelegramScraperSource), 'TelegramScraperSource is NOT registered by default');
  });

  it('5.2: getEnabledSources() includes TelegramScraperSource when ENABLE_TELEGRAM_SCRAPER=true', () => {
    process.env.ENABLE_TELEGRAM_SCRAPER = 'true';
    const sources = getEnabledSources({ pythonServiceUrl: 'http://127.0.0.1:8001/query' });
    
    assert.equal(sources.length, 3, 'Should have 3 active sources when scraper is enabled');
    assert.ok(sources.some(s => s instanceof LocalKAnonSource), 'LocalKAnonSource is registered');
    assert.ok(sources.some(s => s instanceof BreachCatalogSource), 'BreachCatalogSource is registered');
    assert.ok(sources.some(s => s instanceof TelegramScraperSource), 'TelegramScraperSource is registered');
  });

  it('5.3: BreachSource subclasses adhere to search() contract shape', async () => {
    const local = new LocalKAnonSource();
    const res = await local.search('test@example.com', 'a'.repeat(64));
    assert.ok(res && typeof res === 'object', 'Returns an object');
    assert.equal(res.sourceName, 'LocalKAnonSource');
    assert.ok(Array.isArray(res.hits), 'hits is an array');

    const catalog = new BreachCatalogSource();
    const catRes = await catalog.search('test@000webhost.com', 'b'.repeat(64));
    assert.ok(catRes && typeof catRes === 'object');
    assert.equal(catRes.sourceName, 'BreachCatalogSource');
    assert.ok(Array.isArray(catRes.hits));
  });
});
