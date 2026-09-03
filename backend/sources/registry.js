const { TelegramScraperSource } = require('./TelegramScraperSource');
const { PhishingFeedSource } = require('./PhishingFeedSource');
const { PublicBreachSource } = require('./PublicBreachSource');
const { ThreatIntelSource } = require('./ThreatIntelSource');

/**
 * Returns an array containing all active multi-source OSINT adapters.
 * @param {Object} [options] - Optional runtime overrides
 * @returns {import('./BreachSource').BreachSource[]}
 */
function getEnabledSources(options = {}) {
  return [
    new TelegramScraperSource(options.pythonServiceUrl),
    new PhishingFeedSource(),
    new PublicBreachSource(),
    new ThreatIntelSource()
  ];
}

module.exports = {
  getEnabledSources,
  TelegramScraperSource,
  PhishingFeedSource,
  PublicBreachSource,
  ThreatIntelSource
};

