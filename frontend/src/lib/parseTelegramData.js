/**
 * Utility to strip all emojis, pictograms, and symbols from text
 */
export function stripEmojis(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{2B50}\u{203C}\u{2049}\u{2122}\u{2139}\u{2194}-\u{2199}\u{21A9}-\u{21AA}\u{231A}-\u{231B}\u{2328}\u{23CF}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{24C2}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}]/gu, '')
    .replace(/\*\*\s+/g, '**')
    .replace(/^[ \t]+/gm, '')
    .replace(/[ \t]{2,}/g, ' ');
}

/**
 * Parses a raw Telegram page text into structured breach data:
 * - title: database or incident name (e.g., HiTeckGroop.in, TrueCaller India)
 * - description: background narrative/leak explanation
 * - fields: array of { key, value, type }
 * - isSummary: boolean flag if page is just a search overview
 */
export function parseTelegramPage(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { title: '', description: '', fields: [], isSummary: false, rawClean: '' };
  }

  // 1. Strip emojis
  let text = stripEmojis(rawText);

  // 2. Separate merged bold title and following text (e.g. **HiTeckGroop.in**In early 2025 -> **HiTeckGroop.in**\n\nIn early 2025)
  text = text.replace(/\*\*([^*]+)\*\*([A-Za-z0-9])/g, '**$1**\n\n$2');

  // Strip third-party bot ads
  const lines = text.split('\n')
    .map(l => l.trim())
    .filter(l => {
      const low = l.toLowerCase();
      if (low.includes('free version of the bot')) return false;
      if (low.includes('buying a subscription')) return false;
      if (low.includes('subscription is over') || low.includes('trial period lasted')) return false;
      if (low.includes('mirror (in case of removal') || l.includes('mirrors:')) return false;
      if (low.includes('search time')) return false;
      return true;
    });

  let title = '';
  let description = '';
  const fields = [];
  const descLines = [];

  let inFields = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Check if line is a Key-Value field:
    // 1. **Key: **Value or **Key:** Value
    const boldKvMatch = line.match(/^\*\*([^*:]+)(?::\s*|\s*:\s*)\*\*\s*(.*)$/);
    // 2. **Key Value (missing second colon like **Mobile 917795005788)
    const boldLooseMatch = !boldKvMatch ? line.match(/^\*\*([A-Za-z]+)\s+([0-9+]+.*)$/) : null;
    // 3. Plain Key: Value (like "Request: +91...", "Number of results: 4")
    const plainKvMatch = (!boldKvMatch && !boldLooseMatch && line.includes(':'))
      ? line.match(/^([A-Za-z0-9\s'/]+?):\s*(.*)$/)
      : null;

    if (boldKvMatch || boldLooseMatch || (plainKvMatch && (inFields || plainKvMatch[1].length < 28))) {
      inFields = true;
      let k = '';
      let v = '';
      if (boldKvMatch) {
        k = boldKvMatch[1].replace(/[*_`]/g, '').trim();
        v = boldKvMatch[2].replace(/[*_`]/g, '').trim();
      } else if (boldLooseMatch) {
        k = boldLooseMatch[1].replace(/[*_`]/g, '').trim();
        v = boldLooseMatch[2].replace(/[*_`]/g, '').trim();
      } else if (plainKvMatch) {
        k = plainKvMatch[1].replace(/[*_`]/g, '').trim();
        v = plainKvMatch[2].replace(/[*_`]/g, '').trim();
      }

      if (k && v) {
        // Normalize common field names
        let cleanKey = k;
        if (/^adres$/i.test(cleanKey)) cleanKey = 'Address';
        if (/^the name of the father$/i.test(cleanKey)) cleanKey = "Father's Name";
        if (/^the date of registration$/i.test(cleanKey)) cleanKey = 'Registration Date';
        if (/^telephone$/i.test(cleanKey)) cleanKey = 'Telephone';
        if (/^document number$/i.test(cleanKey)) cleanKey = 'Document Number';
        if (/^full name$/i.test(cleanKey)) cleanKey = 'Full Name';
        if (/^mobile operator$/i.test(cleanKey)) cleanKey = 'Mobile Operator';

        // Categorize field type for styling badges
        let type = 'text';
        const lowKey = cleanKey.toLowerCase();
        if (lowKey.includes('phone') || lowKey.includes('mobile') || lowKey.includes('telephone')) type = 'phone';
        else if (lowKey.includes('document') || lowKey.includes('aadhaar') || lowKey.includes('passport')) type = 'document';
        else if (lowKey.includes('name')) type = 'name';
        else if (lowKey.includes('address') || lowKey.includes('region') || lowKey.includes('state')) type = 'address';
        else if (lowKey.includes('date')) type = 'date';

        fields.push({ key: cleanKey, value: v, type });
        continue;
      }
    }

    // Check for title header (e.g. **HiTeckGroop.in** or **TrueCaller India**)
    const titleMatch = line.match(/^\*\*([^*]+)\*\*$/);
    if (titleMatch && !title && !inFields) {
      title = titleMatch[1].trim();
      continue;
    }

    // Accumulate description text
    if (!inFields) {
      const cleanLine = line.replace(/^\*\*([^*]+)\*\*/, '$1').replace(/[*_`]/g, '').trim();
      if (cleanLine) {
        if (!title && cleanLine.length < 40 && !cleanLine.includes(':')) {
          title = cleanLine;
        } else {
          descLines.push(cleanLine);
        }
      }
    }
  }

  description = descLines.join(' ');
  const isSummary = fields.some(f => f.key.toLowerCase().includes('number of leaks') || f.key.toLowerCase().includes('number of results'));

  const parsedObj = {
    title: title || (isSummary ? 'Search Query Overview' : (fields.length ? 'Breach Record' : '')),
    description,
    fields,
    isSummary
  };

  parsedObj.rawClean = formatParsedTelegram(parsedObj);
  return parsedObj;
}

/**
 * Formats a parsed Telegram page object into neatly aligned text without any ** asterisks:
 * Labels aligned at fixed column spacing with colons.
 */
export function formatParsedTelegram(parsed) {
  if (!parsed) return '';
  const parts = [];

  if (parsed.title) {
    parts.push(`[ ${parsed.title.toUpperCase()} ]`);
  }
  if (parsed.description) {
    parts.push(parsed.description);
    parts.push('');
  }

  if (parsed.fields && parsed.fields.length > 0) {
    const maxKeyLen = Math.min(26, Math.max(...parsed.fields.map(f => f.key.length)));
    for (const f of parsed.fields) {
      const paddedKey = f.key.padEnd(maxKeyLen, ' ');
      parts.push(`${paddedKey} : ${f.value}`);
    }
  }

  return parts.join('\n');
}

/**
 * Formats Telegram text into neatly aligned text without any ** asterisks
 */
export function formatCleanTelegramText(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  const parsed = parseTelegramPage(rawText);
  return parsed.rawClean || '';
}
