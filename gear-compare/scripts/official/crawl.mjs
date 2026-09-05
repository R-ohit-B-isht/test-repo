// Crawl maker catalogues for one site and extract the specs each product page publishes.
//   node scripts/official/crawl.mjs power-banks
// Output: $GEAR_OUT/official/<site>.catalog.json (outside the repo; the matcher turns it into data/official/<site>.json)
import fs from 'node:fs';
import { SITES } from '../lib/registry.mjs';
import { shopifyCatalog } from './shopify.mjs';
import { fetchText, today } from './fetch.mjs';
import { extractSpecs, labelPatterns } from './extract.mjs';

const siteId = process.argv[2];
const site = SITES.find((s) => s.id === siteId);
if (!site) throw new Error(`unknown site ${siteId}`);
const makers = (await import(`./makers/${siteId}.mjs`)).default;
const OUT = path.join(process.env.GEAR_OUT || path.join(process.env.HOME || '', 'gear'), 'official');
fs.mkdirSync(OUT, { recursive: true });

const labels = labelPatterns(site);
const prose = site.officialProse || {};
const catalog = [];
for (const m of makers) {
  const products = m.kind === 'shopify' ? shopifyCatalog(m.base) : [];
  const picked = products.filter(m.isProduct);
  let withSpecs = 0;
  for (const p of picked) {
    const html = fetchText(p.url);
    if (!html) continue;
    const { kv, text } = extractSpecs(html, labels);
    // Shopify body_html is the maker's own description; include its structures too.
    if (p.bodyHtml) {
      const b = extractSpecs(p.bodyHtml, labels);
      for (const [k, v] of Object.entries(b.kv)) kv[k] ??= v;
    }
    for (const [k, fn] of Object.entries(prose)) {
      const v = fn(text);
      if (v) kv[k] ??= v;
    }
    const known = Object.keys(kv).filter((k) => labels.some((re) => re.test(k)));
    if (known.length) withSpecs++;
    catalog.push({
      maker: m.base, region: m.region, brand: m.brand.source.replace(/[\^$()?:|\\]/g, '').split('|')[0],
      title: p.title, url: p.url, handle: p.handle, variants: p.variants, kv, specKeys: known.length, fetchedAt: today(),
      text: text.slice(0, 8000),
    });
  }
  console.log(`${m.base.padEnd(36)} catalogue ${String(products.length).padStart(4)} → ${String(picked.length).padStart(3)} ${site.unit}s, ${withSpecs} with recognisable spec keys`);
}
const out = path.join(OUT, `${siteId}.catalog.json`);
fs.writeFileSync(out, JSON.stringify(catalog, null, 1));
console.log(`${catalog.length} maker products → ${out}`);
