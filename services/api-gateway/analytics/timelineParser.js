/**
 * OSINT BreachShield - Breach Timeline Parser
 * Extracts chronological years, breach names, and leak events from raw intelligence text.
 */

function parseBreachTimeline(rawText = '') {
  const text = String(rawText || '');
  if (!text.trim() || /no\s*results?(\s*found)?/i.test(text)) {
    return [];
  }

  const events = [];
  const seenKeys = new Set();

  // 1. Extract explicit Markdown source headers like `**💾 HiTeckGroop.in **`
  const sourceMatches = Array.from(text.matchAll(/\*\*[\s💾]*([a-zA-Z0-9._-]+\.[a-zA-Z]{2,}|[a-zA-Z0-9._ -]+)\*\*/g));
  
  // 2. Extract years mentioned (e.g. "In early 2025", "leaked in 2021", etc.)
  const yearMatches = Array.from(text.matchAll(/\b(20[1-3][0-9])\b/g)).map(m => parseInt(m[1], 10));
  const primaryYear = yearMatches.length ? yearMatches[0] : new Date().getFullYear();

  for (const match of sourceMatches) {
    const srcName = match[1].trim();
    if (!srcName || seenKeys.has(srcName.toLowerCase())) continue;
    seenKeys.add(srcName.toLowerCase());

    // Try finding specific year around this breach
    const surroundingText = text.slice(Math.max(0, match.index - 50), Math.min(text.length, match.index + 200));
    const yr = surroundingText.match(/\b(20[1-3][0-9])\b/);
    const eventYear = yr ? parseInt(yr[1], 10) : primaryYear;

    let category = 'Telecom / ISP Breach';
    if (/mobile|operator|telecom/i.test(surroundingText)) category = 'Telecom Operator Leak';
    else if (/financial|bank|pay/i.test(surroundingText)) category = 'Financial Platform Leak';
    else if (/social|chat|forum/i.test(surroundingText)) category = 'Social Media Leak';
    else if (/stealer|malware|botnet/i.test(surroundingText)) category = 'Stealer Log Compilation';

    events.push({
      year: eventYear,
      source: srcName,
      category,
      severity: 'CRITICAL',
      description: surroundingText.slice(0, 140).replace(/[*`_]/g, '').trim() + '...'
    });
  }

  // 3. Known Breach Dictionary fallback
  const knownDatabases = [
    { name: 'HiTeckGroop.in', defaultYear: 2025, category: 'Telecom Operator Leak' },
    { name: 'Dominos India', defaultYear: 2021, category: 'Food Delivery Platform' },
    { name: 'Air India', defaultYear: 2021, category: 'Airlines Passenger Database' },
    { name: 'BigBasket', defaultYear: 2020, category: 'E-Commerce Database' },
    { name: 'Truecaller', defaultYear: 2020, category: 'Caller ID Leak' },
    { name: 'Canva', defaultYear: 2019, category: 'Design Platform' },
    { name: 'Collection #1', defaultYear: 2019, category: 'Credential Compilation' },
    { name: 'LinkedIn', defaultYear: 2016, category: 'Professional Network' },
    { name: 'Adobe', defaultYear: 2013, category: 'Creative Cloud Database' }
  ];

  for (const b of knownDatabases) {
    if (seenKeys.has(b.name.toLowerCase())) continue;
    const reg = new RegExp(`\\b${b.name.replace(/[.#]/g, '\\$&')}\\b`, 'i');
    if (reg.test(text)) {
      seenKeys.add(b.name.toLowerCase());
      events.push({
        year: b.defaultYear,
        source: b.name,
        category: b.category,
        severity: 'HIGH',
        description: `Exposed identity records identified in ${b.name} compilation archive.`
      });
    }
  }

  // 4. If no named breach found, extract year sentences or fallback event
  if (events.length === 0) {
    events.push({
      year: primaryYear,
      source: 'Operator Identity Exposure',
      category: 'Direct OSINT Record',
      severity: 'HIGH',
      description: 'Active records circulating in Telegram threat intelligence feeds.'
    });
  }

  // Sort oldest to newest
  events.sort((a, b) => a.year - b.year);

  return events;
}

module.exports = { parseBreachTimeline };
