const { BreachSource } = require('./BreachSource');

class ThreatIntelSource extends BreachSource {
  constructor() {
    super('PublicThreatIntelSource');
  }

  async search(normalizedTarget, targetHash) {
    const hits = [];
    const packets = [];

    // Query threat intelligence indicators
    if (normalizedTarget && (normalizedTarget.includes('.com') || normalizedTarget.includes('.org') || normalizedTarget.includes('.net') || normalizedTarget.includes('.xyz'))) {
      const isSuspicious = /verify|auth|login|secure|account|update|crypto|bank/i.test(normalizedTarget);
      if (isSuspicious) {
        hits.push({
          source: 'Public_Threat_Intel_Feed',
          year: new Date().getFullYear().toString(),
          dataClasses: ['MALICIOUS_IOC', 'THREAT_INDICATOR'],
          sourceType: 'LOCAL',
          isSimulated: true,
          raw: `[RULE-BASED REPUTATION] Target ${normalizedTarget} matched local heuristic (no live intel feed consulted).`
        });

        packets.push({
          query: normalizedTarget,
          info: `[SIMULATED THREAT INTEL MATCH - NO LIVE FEED CONSULTED]\nIndicator: ${normalizedTarget}\nRisk Tag: HIGH_SUSPICION_DOMAIN\nNOTE: Rule-based heuristic result shown for demonstration only.`,
          source: 'Public_Threat_Intel_Feed',
          isSimulated: true
        });
      }
    }

    return {
      sourceName: this.sourceName,
      hits,
      packets
    };
  }
}

module.exports = { ThreatIntelSource };
