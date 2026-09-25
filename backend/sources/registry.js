const { TelegramScraperSource } = require('./TelegramScraperSource');
const { PhishingFeedSource } = require('./PhishingFeedSource');
const { PublicBreachSource } = require('./PublicBreachSource');
const { ThreatIntelSource } = require('./ThreatIntelSource');

/**
 * Returns an array containing active OSINT adapters.
 * When exclusiveTelegram: true (used in live search), only TelegramScraperSource is returned.
 * @param {Object} [options] - Optional runtime overrides
 * @returns {import('./BreachSource').BreachSource[]}
 */
function getEnabledSources(options = {}) {
  if (options.exclusiveTelegram || options.onlyTelegram) {
    return [new TelegramScraperSource(options.pythonServiceUrl)];
  }
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

