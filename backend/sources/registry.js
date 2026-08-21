/**
 * @file registry.js
 * @description Exclusive BreachSource registry configured purely for the Live Telegram OSINT Feed.
 */

const { TelegramScraperSource } = require('./TelegramScraperSource');

/**
 * Returns an array containing solely the active Telegram OSINT Scraper source.
 * @param {Object} [options] - Optional runtime overrides
 * @param {string} [options.pythonServiceUrl] - Override URL for python scraper service
 * @returns {import('./BreachSource').BreachSource[]}
 */
function getEnabledSources(options = {}) {
  return [
    new TelegramScraperSource(options.pythonServiceUrl)
  ];
}

module.exports = {
  getEnabledSources,
  TelegramScraperSource
};
