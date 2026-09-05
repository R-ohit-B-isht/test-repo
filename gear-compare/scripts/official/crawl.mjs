// Crawl maker catalogues for one site and extract the specs each product page publishes.
//   node scripts/official/crawl.mjs power-banks
// Output: $GEAR_OUT/official/<site>.catalog.json (outside the repo; the matcher turns it into data/official/<site>.json)
//
// Maker entry kinds (scripts/official/makers/<site>.mjs):
//   shopify  — storefront /products.json                      { base, isProduct(p) }
//   sitemap  — XML sitemap(s) + URL pattern                    { base, sitemap, urlFilter, childFilter?, titleFilter?, isProduct(p) }
//   philips  — Philips PRX API keyed by the listings' own CTNs { base, isProduct(summary) }
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITES } from '../lib/registry.mjs';
import { shopifyCatalog } from './shopify.mjs';
import { sitemapCatalog } from './sitemap.mjs';
import { philipsCatalog } from './philips.mjs';
import { fetchText, today } from './fetch.mjs';
import { extractSpecs, labelPatterns } from './extract.mjs';
import { modelCodes } from './model-codes.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '..', '..');
const siteId = process.argv[2];
const site = SITES.find((s) => s.id === siteId);
if (!site) throw new Error(`unknown site ${siteId}`);
const makers = (await import(`./makers/${siteId}.mjs`)).default;
const OUT = path.join(process.env.GEAR_OUT || path.join(process.env.HOME || '', 'gear'), 'official');
fs.mkdirSync(OUT, { recursive: true });
const listingsFile = path.join(ROOT, 'data', `${siteId}.json`);
const listings = fs.existsSync(listingsFile) ? JSON.parse(fs.readFileSync(listingsFile, 'utf8')) : [];

const labels = labelPatterns(site);
const prose = site.officialProse || {};
const brandName = (m) => listings.find((l) => m.brand.test(l.brand))?.brand ?? m.brand.source.replace(/[\^$()?:|\\]/g, '');
const listingCount = (m) => listings.filter((l) => m.brand.test(l.brand)).length;

function catalogueFor(m) {
  if (m.kind === 'shopify') return shopifyCatalog(m.base).filter(m.isProduct);
  if (m.kind === 'sitemap') return sitemapCatalog(m.sitemap, { urlFilter: m.urlFilter, childFilter: m.childFilter, titleFilter: m.titleFilter, maxUrls: m.maxUrls }).filter(m.isProduct);
  if (m.kind === 'philips') return philipsCatalog(m.base, listings.filter((l) => m.brand.test(l.brand)), { isProduct: m.isProduct });
  throw new Error(`unknown maker kind ${m.kind}`);
}

const catalog = [];
for (const m of makers) {
  if (!listingCount(m)) {
    console.log(`${m.base.padEnd(40)} ${m.kind.padEnd(8)} → skipped, no ${site.unit} listings carry this brand`);
    continue;
  }
  const picked = catalogueFor(m);
  let withSpecs = 0;
  for (const p of picked) {
    const html = p.html ?? (m.kind === 'philips' ? '' : fetchText(p.url));
    if (!html && m.kind !== 'philips') continue;
    const page = html ? extractSpecs(html, labels, p.title) : { kv: {}, text: '', anchored: false };
    const { kv } = page;
    let text = page.anchored ? page.text : '';
    for (const [k, v] of Object.entries(p.kv || {})) kv[k] = v; // API/structured values win over page scraping
    if (p.bodyHtml) {
      const b = extractSpecs(p.bodyHtml, labels, p.title);
      for (const [k, v] of Object.entries(b.kv)) kv[k] ??= v;
      text = `${b.text}\n${text}`;
    }
    if (!text) text = page.text;
    // The maker's own product name is part of its published statement ("… (2000 W, Rose Gold)").
    text = `${p.title}\n${text}`;
    for (const [k, fn] of Object.entries(prose)) {
      const v = fn(text);
      if (v) kv[k] ??= v;
    }
    // A key naming another model of the same maker ("Nova NHT 1052 USB Runtime") is storefront navigation, not a
    // specification of this product.
    const own = new Set(modelCodes(`${p.title} ${p.handle || ''} ${p.ctn || ''}`));
    for (const k of Object.keys(kv)) if (modelCodes(k).some((code) => !own.has(code))) delete kv[k];
    const known = Object.keys(kv).filter((k) => labels.some((re) => re.test(k)));
    if (known.length) withSpecs++;
    catalog.push({
      maker: m.base, region: m.region, brand: brandName(m),
      title: p.title, url: p.url, handle: p.handle, variants: p.variants, kv, specKeys: known.length, fetchedAt: today(),
      ctn: p.ctn, ambiguousBase: p.ambiguousBase, image: p.image,
      text: text.slice(0, 8000),
    });
  }
  console.log(`${m.base.padEnd(40)} ${m.kind.padEnd(8)} → ${String(picked.length).padStart(3)} ${site.unit}s, ${withSpecs} with recognisable spec keys`);
}
const out = path.join(OUT, `${siteId}.catalog.json`);
fs.writeFileSync(out, JSON.stringify(catalog, null, 1));
console.log(`${catalog.length} maker products → ${out}`);
