const { BreachSource } = require('./BreachSource');

class PhishingFeedSource extends BreachSource {
  constructor() {
    super('PublicPhishingFeedSource');
    this.feedUrl = process.env.PHISHING_FEED_URL || 'https://raw.githubusercontent.com/mitchellkrogza/Phishing.Database/master/phishing-links-ACTIVE.txt';
  }

  async search(normalizedTarget, targetHash) {
    const hits = [];
    const packets = [];
    
    // Only query phishing feed if input looks like domain/email/URL
    if (!normalizedTarget || (!normalizedTarget.includes('@') && !normalizedTarget.includes('.'))) {
      return { sourceName: this.sourceName, hits, packets };
    }

    try {
      const targetDomain = normalizedTarget.includes('@') ? normalizedTarget.split('@')[1] : normalizedTarget;
      
      // Simulated/Local Feed match fallback for fast, deterministic search
      if (/phish|verify|bank|account|update|crypto/i.test(targetDomain)) {
        const matchingUrl = `http://${targetDomain}/verify-login.php`;
        hits.push({
          source: 'Public_Phishing_Feed',
          year: new Date().getFullYear().toString(),
          dataClasses: ['PHISHING_URL', 'MALICIOUS_DOMAIN'],
          sourceType: 'LOCAL',
          isSimulated: true,
          raw: `[RULE-BASED MATCH] Domain ${targetDomain} matched local phishing heuristic (no live feed consulted). Simulated URL shown for analysis only.`
        });

        packets.push({
          query: normalizedTarget,
          info: `[SIMULATED PHISHING MATCH - NO LIVE FEED CONSULTED]\nDomain: ${targetDomain}\nURL: ${matchingUrl}\nThreat Type: Phishing / Credential Harvesting\nNOTE: Rule-based heuristic result shown for demonstration only.`,
          source: 'Public_Phishing_Feed',
          isSimulated: true
        });
      }
    } catch (err) {
      console.warn('[PhishingFeedSource] Error checking phishing feed:', err.message);
    }

    return {
      sourceName: this.sourceName,
      hits,
      packets
    };
  }
}

module.exports = { PhishingFeedSource };
