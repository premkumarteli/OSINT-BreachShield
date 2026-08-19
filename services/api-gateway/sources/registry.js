/**
 * @file registry.js
 * @description Centralized registry and factory for enabled BreachSource providers.
 * 
 * NOTE: To integrate new breach intelligence sources (e.g. DeHashed, IntelX, Snusbase),
 * implement the BreachSource interface in sources/ and register it here in getEnabledSources().
 * Do NOT add inline source logic or if/else branches in index.js.
 */

const { LocalKAnonSource } = require('./LocalKAnonSource');
const { BreachCatalogSource } = require('./BreachCatalogSource');
const { HudsonRockSource } = require('./HudsonRockSource');
const { HIBPApiSource } = require('./HIBPApiSource');
const { TelegramScraperSource } = require('./TelegramScraperSource');

/**
 * Returns an array of active, instantiated BreachSource instances based on environment flags.
 * @param {Object} [options] - Optional runtime overrides
 * @param {string} [options.pythonServiceUrl] - Override URL for python scraper service
 * @returns {import('./BreachSource').BreachSource[]}
 */
function getEnabledSources(options = {}) {
  const sources = [
    new LocalKAnonSource(),
    new BreachCatalogSource(),
    new HudsonRockSource(),
    new HIBPApiSource()
  ];

  // Secondary live OSINT scraper — opt-in via ENABLE_TELEGRAM_SCRAPER=true (default OFF)
  if (process.env.ENABLE_TELEGRAM_SCRAPER === 'true') {
    sources.push(new TelegramScraperSource(options.pythonServiceUrl));
  }

  return sources;
}

module.exports = {
  getEnabledSources,
  LocalKAnonSource,
  BreachCatalogSource,
  HudsonRockSource,
  HIBPApiSource,
  TelegramScraperSource
};
