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
  'high', 'heavy', 'ultra', 'super', 'pro', 'max', 'multi', 'multipurpose', 'compact', 'digital', 'automatic', 'rechargable', 'flameless', 'windproof', 'safe', 'safety', 'kitchen', 'trek', 'travelling', 'camping', 'laptop', 'school', 'college',
  'packing', 'cubes', 'cube', 'organizer', 'organiser', 'organizers', 'organisers', 'shoe', 'shoes', 'slipper', 'toiletry', 'toiletries', 'hanging', 'cosmetic', 'makeup', 'passport', 'holder', 'cable', 'electronics', 'gadget', 'laundry', 'dirty', 'underwear', 'polyester', 'nylon', 'mesh', 'pouch', 'pouches', 'bag', 'bags', 'luggage', 'compression', 'clothes', 'storage', 'foldable', 'large', 'small', 'medium', 'big', 'rfid', 'family', 'document', 'documents', 'wallet', 'cover', 'case', 'kit', 'pcs', 'pc', 'piece', 'pieces', 'zipper', 'unisex']);
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

// Sites with `brandStore: true` also list the maker's own storefront products (crawled catalogue with a live
// price): the row's only evidence is the maker page itself, so every field is tier "official" or missing, and it
// carries no marketplace rating.
const GEAR_OUT = process.env.GEAR_OUT || path.join(process.env.HOME || '', 'gear');
function brandStoreRows(site) {
  if (!site.brandStore) return [];
  const f = path.join(GEAR_OUT, 'official', `${site.id}.catalog.json`);
  if (!fs.existsSync(f)) return [];
  const rows = [];
  for (const c of JSON.parse(fs.readFileSync(f, 'utf8'))) {
    if (!(c.price > 0) || !c.available || !c.image || c.region !== 'IN') continue;
    if (!site.include(c.title) && !(site.includeOfficial && site.includeOfficial(c))) continue;
    const idSeed = `store-${c.handle || c.url.split('/').pop()}`.slice(0, 60);
    const id = `${c.brand}-${idSeed}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    rows.push({
      idSeed, title: c.title, brand: c.brand, price: c.price, rating: null, ratingCount: null,
      images: [c.image], buyUrl: c.url, buyStore: 'maker', kv: {}, seller: [],
      official: { [id]: { url: c.url, title: c.title, region: c.region, fetchedAt: c.fetchedAt, matchScore: 1, matchedOn: ['maker’s own storefront listing'], kv: c.kv, text: c.text || '' } },
    });
  }
  return rows;
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
  const amByAsin = new Map();
  for (const p of load(site.sources.amazon)) {
    const prev = amByAsin.get(p.asin);
    if (!prev || (!prev.pageOk && p.pageOk)) amByAsin.set(p.asin, p);
  }
  const am = [...amByAsin.values()];
  const rows = [];
  for (const p of fk) {
    const fkImages = p.images?.length ? p.images : p.cardImg ? [p.cardImg] : [];
    if (!p.price || !fkImages.length || !p.title || !p.href) continue;
    const title = p.title.replace(/\s+/g, ' ').replace(/\.\.\.more$/, '').trim();
    if (!site.include(title)) continue;
    const { kv, seller } = parseSpecText([p.specText, p.warranty, p.mfg].filter(Boolean).join('\n'));
    if (p.desc) seller.push(...parseSpecText(p.desc).seller, ...p.desc.split('\n').map((s) => s.trim()).filter((s) => s.length >= 60 && s.length < 1500));
    if (site.deriveKv) Object.assign(kv, site.deriveKv(kv));
    const idSeed = (p.href.split('/p/')[1] || p.href).split('?')[0].slice(0, 24);
    rows.push({
      idSeed, title, brand: brandOf(title, kv.Brand), price: p.price, ...starRating(p.rating, p.ratingCount),
      images: fkImages, buyUrl: 'https://www.flipkart.com' + p.href.split('?')[0], buyStore: 'flipkart', kv, seller, official,
    });
  }
  for (const p of am) {
    if (!p.price || !p.title || !(p.images?.length || p.img) || !p.url) continue;
    const price = Number(String(p.price).replace(/[^\d.]/g, ''));
    if (!(price > 0)) continue;
    const title = p.title.replace(/\s+/g, ' ').trim();
    if (!site.include(title)) continue;
    const { kv, seller } = amazonSpecs(p);
    if (site.deriveKv) Object.assign(kv, site.deriveKv(kv));
    const images = (p.images?.length ? p.images : [p.img]).map(amazonLarge);
    rows.push({
      idSeed: p.asin, title, brand: brandOf(title, kv.Brand || kv['Brand Name']), price, ...starRating(p.rating, p.ratingCount),
      images, buyUrl: p.url, buyStore: 'amazon', kv, seller, official,
    });
  }
  rows.push(...brandStoreRows(site));
  unifyBrandCase(rows);
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    const rec = record(site, r);
    if (seen.has(rec.id)) continue;
    seen.add(rec.id);
    out.push(rec);
  }
  return site.collapseVariants ? collapseVariants(out) : out;
}

// Marketplaces list each colour of the same product as its own page with an identical title and price; keep the
// one with the most review evidence (ties: most credited fields) so a list is not five rows of one pouch.
function collapseVariants(recs) {
  const best = new Map();
  for (const rec of recs) {
    const key = `${rec.buyStore}|${rec.title.toLowerCase().replace(/\s+/g, ' ').trim()}|${rec.price}`;
    const prev = best.get(key);
    if (!prev || better(rec, prev)) best.set(key, rec);
  }
  const keep = new Set(best.values());
  return recs.filter((r) => keep.has(r));
}

function better(a, b) {
  const ra = a.ratingCount || 0, rb = b.ratingCount || 0;
  if (ra !== rb) return ra > rb;
  const credited = (r) => r.evidence.fields.filter((f) => f.credited > 0).length;
  return credited(a) > credited(b);
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
    ...(site.pack ? { pack: site.pack(F, { title: r.title }) } : {}),
    ...(site.cover ? { cover: site.cover(F, { title: r.title, kv: r.kv, seller: r.seller, official: off }) } : {}),
  };
}

for (const site of sites) {
  const recs = build(site);
  const outFile = path.join(ROOT, 'data', `${site.id}.json`);
  fs.writeFileSync(outFile, JSON.stringify(recs));
  const by = (k) => recs.filter((x) => x.evidence.status === k).length;
  console.log(`${site.id}: ${recs.length} records (flipkart ${recs.filter((x) => x.buyStore === 'flipkart').length}, amazon ${recs.filter((x) => x.buyStore === 'amazon').length}, maker store ${recs.filter((x) => x.buyStore === 'maker').length}) — official ${by('official')} · listing ${by('listing')} · claimed ${by('claimed')} · none ${by('none')} → ${path.relative(ROOT, outFile)}`);
}
