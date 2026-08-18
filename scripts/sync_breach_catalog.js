const https = require('https');
const fs = require('fs');
const path = require('path');

const CATALOG_DIR = path.join(__dirname, '..', 'services', 'api-gateway', 'data', 'catalog');
const OUTPUT_FILE = path.join(CATALOG_DIR, 'breaches.json');
const INDEX_FILE = path.join(CATALOG_DIR, 'breaches_index.json');

async function syncBreachCatalog() {
  console.log('🔄 Fetching 100% free public breach catalog from HaveIBeenPwned API v3...');

  if (!fs.existsSync(CATALOG_DIR)) {
    fs.mkdirSync(CATALOG_DIR, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    const req = https.get('https://haveibeenpwned.com/api/v3/breaches', {
      headers: {
        'User-Agent': 'OSINT-BreachShield-Engine/2.0 (Security-Research)'
      }
    }, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to fetch catalog: HTTP ${res.statusCode}`));
      }

      let rawData = '';
      res.on('data', chunk => rawData += chunk);
      res.on('end', () => {
        try {
          const rawBreaches = JSON.parse(rawData);
          console.log(`✅ Received ${rawBreaches.length} global breach records!`);

          // Normalize and enrich
          const normalized = rawBreaches.map(b => ({
            name: b.Name,
            title: b.Title,
            domain: b.Domain || '',
            breachDate: b.BreachDate,
            addedDate: b.AddedDate,
            modifiedDate: b.ModifiedDate,
            pwnCount: b.PwnCount || 0,
            description: b.Description || '',
            logoPath: b.LogoPath || '',
            dataClasses: Array.isArray(b.DataClasses) ? b.DataClasses : [],
            isVerified: Boolean(b.IsVerified),
            isFabricated: Boolean(b.IsFabricated),
            isSensitive: Boolean(b.IsSensitive),
            isSpamList: Boolean(b.IsSpamList),
            isMalware: Boolean(b.IsMalware),
            isSubscriptionFree: Boolean(b.IsSubscriptionFree)
          }));

          // Save main catalog
          fs.writeFileSync(OUTPUT_FILE, JSON.stringify(normalized, null, 2), 'utf8');
          console.log(`📁 Saved full catalog to: ${OUTPUT_FILE}`);

          // Build fast lookups by name and domain
          const index = {
            byName: {},
            byDomain: {},
            totalBreaches: normalized.length,
            totalExposedAccounts: normalized.reduce((acc, b) => acc + (b.pwnCount || 0), 0),
            syncedAt: new Date().toISOString()
          };

          for (const b of normalized) {
            index.byName[b.name.toLowerCase()] = b;
            if (b.domain) {
              const dom = b.domain.toLowerCase();
              if (!index.byDomain[dom]) index.byDomain[dom] = [];
              index.byDomain[dom].push(b.name);
            }
          }

          fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2), 'utf8');
          console.log(`⚡ Saved fast search index to: ${INDEX_FILE}`);
          console.log(`📊 Total Known Exposed Accounts Tracked: ${index.totalExposedAccounts.toLocaleString()}`);

          resolve(normalized);
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
  });
}

if (require.main === module) {
  syncBreachCatalog()
    .then(() => console.log('🎉 Breach Catalog Sync Complete!'))
    .catch(err => {
      console.error('❌ Sync failed:', err.message);
      process.exit(1);
    });
}

module.exports = { syncBreachCatalog };
