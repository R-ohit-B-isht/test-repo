// Generates data/<site>.json from the live marketplace page captures (Flipkart specification tabs, Amazon.in
// product pages) plus the official-page matches in data/official/<site>.json. Nothing is invented: every field
// is copied from a captured page, tiered by where it was read, and scored by scripts/lib/score.cjs.
//   RAW=/path/to/captures node scripts/generate.mjs power-banks
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { SITES } from './lib/registry.mjs';

const require = createRequire(import.meta.url);
const { parseSpecText, amazonSpecs } = require('./lib/fk-spec.cjs');
const { scoreProduct } = require('./lib/score.cjs');
const { fieldMap } = require('./lib/fields.cjs');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW = process.env.RAW || path.join(process.env.HOME || '', 'pwtest');
const ids = process.argv.slice(2);
const sites = ids.length ? SITES.filter((s) => ids.includes(s.id)) : SITES;
if (!sites.length) throw new Error(`unknown site(s): ${ids.join(', ')}`);

const GENERIC = new Set(['power', 'powerbank', 'bank', 'fast', 'charging', 'portable', 'charger', 'mah', 'the', 'new', 'premium', 'mini', 'slim', 'best', 'solar', 'outdoor', 'one', 'just', 'original', 'combo', 'pack', 'set', 'men', 'women', 'unisex', 'kids', 'professional', 'rechargeable', 'electric', 'usb', 'wireless', 'hair', 'beard', 'trimmer', 'induction', 'cooktop', 'tumbler', 'trekking', 'hiking', 'shoes', 'backpack', 'rucksack', 'lighter', 'blender', 'dryer',
  'stainless', 'steel', 'insulated', 'vacuum', 'pink', 'yellow', 'glass', 'plastic', 'travel', 'coffee', 'water', 'personalised', 'personalized', 'cute', 'ice', 'home', 'hot', 'cold',
  'waterproof', 'cordless', 'corded', 'dual', 'gas', 'usb-c', 'type-c', 'arc', 'plasma', 'candle', 'smart', 'stylish', 'transparent', 'polycarbonate', 'exquisite', 'handheld', 'foldable',
  'men\'s', 'men’s', 'mens', 'women\'s', 'womens', 'boys', 'girls', 'army', 'military', 'combat', 'leather', 'face', 'coasters', 'sports', 'running', 'casual', 'toy', 'juicer', 'mixer', 'grinder', 'bottle', 'sipper', 'flask', 'mug', 'cup',
  'high', 'heavy', 'ultra', 'super', 'pro', 'max', 'multi', 'multipurpose', 'compact', 'digital', 'automatic', 'rechargable', 'flameless', 'windproof', 'safe', 'safety', 'kitchen', 'trek', 'travelling', 'camping', 'laptop', 'school', 'college']);
const BRAND_ALIAS = [[/^amazon\s*basics?/i, 'Amazon Basics'], [/^amazon\s*brand\s*-?\s*solimo/i, 'Solimo'], [/^bombay shaving company/i, 'Bombay Shaving Company'], [/^the north face/i, 'The North Face'], [/^american tourister/i, 'American Tourister'], [/^morphy richards/i, 'Morphy Richards'], [/^f\s*gear/i, 'F Gear'], [/^red chief/i, 'Red Chief'], [/^hush puppies/i, 'Hush Puppies'], [/^nutri\s*bullet/i, 'NutriBullet'], [/^mi\b/i, 'Mi'],
  [/^red\s*tape/i, 'Red Tape'], [/^bacca\s*bucci/i, 'Bacca Bucci'], [/^hrx by hrithik roshan|^hrx\b/i, 'HRX'], [/^v-?\s*guard/i, 'V-Guard'], [/^hydro\s*flask/i, 'Hydro Flask'], [/^la sportiva/i, 'La Sportiva'],
  [/^sky spirit/i, 'Sky Spirit'], [/^extreme machine/i, 'Extreme Machine'], [/^fast look/i, 'Fast look'], [/^style look/i, 'Style look'], [/^hiker'?s way/i, "Hiker's Way"], [/^wild\s*craft/i, 'Wildcraft'], [/^the om enterprise/i, 'The OM Enterprise'], [/^da novira/i, 'Da Novira'],
  [/^daily needs shop/i, 'Daily Needs Shop'], [/^pick ur needs/i, 'Pick Ur Needs'], [/^dn brothers/i, 'DN Brothers'], [/^nd brothers/i, 'ND Brothers'], [/^vini enterprise/i, 'Vini enterprise'], [/^ck india/i, 'CK India'], [/^liker travel luggage/i, 'Liker Travel Luggage'], [/^luxe nest/i, 'Luxe Nest'], [/^the yogiraj/i, 'The Yogiraj'], [/^true indian/i, 'True Indian'], [/^jammy zones/i, 'Jammy Zones'], [/^nh enterprises/i, 'NH enterprises'], [/^rss enterprises/i, 'RSS Enterprises'], [/^avya global/i, 'AVYA Global'], [/^aone point/i, 'AONE POINT'], [/^omen changing lives|^omen\b/i, 'Omen'], [/^sheffield classic/i, 'Sheffield Classic'], [/^hpc ultra/i, 'HPC ultra'], [/^khushi udyog/i, 'Khushi Udyog'], [/^afn fashion/i, 'AFN Fashion'], [/^ae excellent/i, 'AE Excellent'], [/^loyal choice/i, 'Loyal Choice'], [/^a fashion/i, 'A Fashion'], [/^hyper adam/i, 'Hyper Adam'], [/^leo'?s\b/i, "Leo's"], [/^riya gold/i, 'Riya Gold'], [/^varman vertex/i, 'Varman vertex'], [/^sukhram enterprise/i, 'Sukhram Enterprise']];
const NO_BRAND = 'Brand not stated';

const generic = (w) => !w || GENERIC.has(w.toLowerCase().replace(/[^a-z0-9'’-]/g, '')) || w.length < 2 || /^\d/.test(w);
function brandOf(title, kvBrand) {
  const kv = (kvBrand || '').trim();
  if (kv && kv.length < 30) {
    for (const [re, name] of BRAND_ALIAS) if (re.test(kv)) return name;
    if (!generic(kv) && !/^(?:generic|no brand|unbranded|others?|na|n\/a)$/i.test(kv)) return kv;
  }
  for (const [re, name] of BRAND_ALIAS) if (re.test(title)) return name;
  const first = title.split(/[\s,(|]/)[0];
  if (generic(first)) return NO_BRAND;
  return first;
}

// One spelling per brand: marketplaces mix "PHILIPS" / "Philips" / "philips"; keep the most frequent form, preferring
// mixed case over shouting caps when both occur. Applied before ids are minted so a brand is one facet value.
function unifyBrandCase(rows) {
  const forms = new Map();
  for (const r of rows) {
    const k = r.brand.toLowerCase();
    const f = forms.get(k) || new Map();
    f.set(r.brand, (f.get(r.brand) || 0) + 1);
    forms.set(k, f);
  }
  const pick = new Map();
  for (const [k, f] of forms) {
    const ranked = [...f.entries()].sort((a, b) => b[1] - a[1]);
    const mixed = ranked.find(([s]) => s !== s.toUpperCase() && s !== s.toLowerCase());
    pick.set(k, (mixed || ranked[0])[0]);
  }
  for (const r of rows) r.brand = pick.get(r.brand.toLowerCase());
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function modelOf(title, brand) {
  let m = brand === NO_BRAND ? title : title.replace(new RegExp('^' + esc(brand) + '\\s*', 'i'), '').trim();
  m = m.replace(/\.\.\.more$/, '…').replace(/\s+/g, ' ');
  if (m.length > 110) m = m.slice(0, 110) + '…';
  return m || title.slice(0, 110);
}

const amazonLarge = (u) => u.replace(/\._AC_[A-Z]{2}\d+_\./, '._SL500_.').replace(/\._[A-Z]{2}\d+_\./, '._SL500_.');

function loadOfficial(site) {
  const f = path.join(ROOT, 'data', 'official', `${site.id}.json`);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {};
}

// Marketplace stars are 1–5; anything else captured in the rating slot (e.g. a "(2800)" pack count) is an
// extraction artefact, so the listing is treated as unrated and its count is dropped with it.
function starRating(raw, rawCount) {
  const r = raw === null || raw === undefined || raw === '' ? NaN : Number(raw);
  if (!Number.isFinite(r) || r < 1 || r > 5) return { rating: null, ratingCount: null };
  return { rating: r, ratingCount: rawCount ?? null };
}

function build(site) {
  const official = loadOfficial(site);
  const load = (names) => [].concat(names || []).filter((n) => fs.existsSync(path.join(RAW, n))).flatMap((n) => JSON.parse(fs.readFileSync(path.join(RAW, n), 'utf8')));
  const fk = load(site.sources.flipkart);
  const am = load(site.sources.amazon);
  const rows = [];
  for (const p of fk) {
    if (!p.price || !p.images?.length || !p.title || !p.href) continue;
    const title = p.title.replace(/\s+/g, ' ').replace(/\.\.\.more$/, '').trim();
    if (!site.include(title)) continue;
    const { kv, seller } = parseSpecText(p.specText);
    const idSeed = (p.href.split('/p/')[1] || p.href).split('?')[0].slice(0, 24);
    rows.push({
      idSeed, title, brand: brandOf(title, kv.Brand), price: p.price, ...starRating(p.rating, p.ratingCount),
      images: p.images, buyUrl: 'https://www.flipkart.com' + p.href.split('?')[0], buyStore: 'flipkart', kv, seller, official,
    });
  }
  for (const p of am) {
    if (!p.price || !p.title || !(p.images?.length || p.img) || !p.url) continue;
    const title = p.title.replace(/\s+/g, ' ').trim();
    if (!site.include(title)) continue;
    const { kv, seller } = amazonSpecs(p);
    const images = (p.images?.length ? p.images : [p.img]).map(amazonLarge);
    rows.push({
      idSeed: p.asin, title, brand: brandOf(title, kv.Brand), price: p.price, ...starRating(p.rating, p.ratingCount),
      images, buyUrl: p.url, buyStore: 'amazon', kv, seller, official,
    });
  }
  unifyBrandCase(rows);
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    const rec = record(site, r);
    if (seen.has(rec.id)) continue;
    seen.add(rec.id);
    out.push(rec);
  }
  return out;
}

function record(site, r) {
  const id = `${r.brand}-${r.idSeed}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const off = r.official[id] || null;
  const { scores, evidence } = scoreProduct(site, {
    brand: r.brand, title: r.title, rating: r.rating, ratingCount: r.ratingCount, sellerText: r.seller, listingKv: r.kv, official: off,
  });
  const F = fieldMap(evidence.fields);
  const tags = [`store:${r.buyStore}`, `ev:${evidence.status}`, `maker:${evidence.maker.kind}`, `seg:${site.segment.of(F)}`];
  for (const fc of site.facets) {
    const v = fc.of(F);
    if (v === null || v === undefined) continue;
    for (const x of Array.isArray(v) ? v : [v]) if (fc.labels[x]) tags.push(`${fc.group}:${x}`);
  }
  const rn = r.rating;
  if (rn !== null) tags.push(rn >= 4.5 ? 'rating:4.5' : rn >= 4 ? 'rating:4' : rn >= 3.5 ? 'rating:3.5' : 'rating:low');
  else tags.push('rating:none');
  return {
    id, brand: r.brand, model: modelOf(r.title, r.brand), title: r.title, price: r.price,
    rating: rn,
    ratingCount: r.ratingCount ? parseInt(String(r.ratingCount).replace(/[^\d]/g, ''), 10) || null : null,
    images: r.images, buyUrl: r.buyUrl, buyStore: r.buyStore,
    lines: { q: site.lines.q(F) || 'Specification not stated', f: site.lines.f(F) || '' },
    tags: [...new Set(tags)], scores, evidence,
    listingSpec: r.kv,
  };
}

for (const site of sites) {
  const recs = build(site);
  const outFile = path.join(ROOT, 'data', `${site.id}.json`);
  fs.writeFileSync(outFile, JSON.stringify(recs));
  const by = (k) => recs.filter((x) => x.evidence.status === k).length;
  console.log(`${site.id}: ${recs.length} records (flipkart ${recs.filter((x) => x.buyStore === 'flipkart').length}, amazon ${recs.filter((x) => x.buyStore === 'amazon').length}) — official ${by('official')} · listing ${by('listing')} · claimed ${by('claimed')} · none ${by('none')} → ${path.relative(ROOT, outFile)}`);
}
