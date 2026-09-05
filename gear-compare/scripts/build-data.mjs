// Converts data/<site>.json (real listings, scored) into compact JSON the app loads on demand:
//   public/data/manifest.json      — sites, counts, facet group defs, weights, tier labels, benchmarks
//   public/data/<site>.json        — list rows + facet counts + tag index
//   public/data/<site>.d<n>.json   — lazy detail shards (evidence fields, gallery, listing spec table)
// Nothing is invented here: every field is copied from the generated records.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SITES, WEIGHTS, CRITERIA, FAMILIES } from './lib/registry.mjs';
import { assertBenchmarkSet, matchBenchmark, publicBenchmark } from './lib/benchmarks.mjs';
import { GLOBAL_GROUPS, groupDefsFor, labelFor } from './lib/facet-labels.mjs';

const require = createRequire(import.meta.url);
const { TIER } = require('./lib/evidence.cjs');
const { STATUS_LABEL } = require('./lib/score.cjs');
const { KIND } = require('./lib/makers.cjs');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');
const OUT = path.join(ROOT, 'public', 'data');
const SHARDS = 8;
fs.mkdirSync(OUT, { recursive: true });

const overall = (scores) => Math.round(Object.keys(WEIGHTS).reduce((s, k) => s + (scores[k] ?? 0) * WEIGHTS[k], 0) * 100) / 10;

function shardOf(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % SHARDS;
}

const HTTP = /^https?:\/\//;
function assertReal(rec, file) {
  const problems = [];
  if (!rec.id) problems.push('id');
  if (!(rec.price > 0)) problems.push('price');
  if (!HTTP.test(rec.buyUrl || '')) problems.push('buyUrl');
  if (!Array.isArray(rec.images) || !rec.images.length || !HTTP.test(rec.images[0])) problems.push('images');
  if (!['flipkart', 'amazon'].includes(rec.buyStore)) problems.push('buyStore');
  if (!Array.isArray(rec.tags)) problems.push('tags');
  for (const k of Object.keys(WEIGHTS)) if (typeof rec.scores?.[k] !== 'number') problems.push('scores.' + k);
  if (!Object.keys(STATUS_LABEL).includes(rec.evidence?.status)) problems.push('evidence.status');
  if (rec.evidence?.status === 'official' && !HTTP.test(rec.evidence.official?.url || '')) problems.push('evidence.official.url');
  for (const f of rec.evidence?.fields || []) if (f.tier === 'official' && !HTTP.test(f.source || '')) problems.push(`field ${f.key} official without source`);
  if (problems.length) throw new Error(`${file}: record ${rec.id} missing real fields: ${problems.join(', ')}`);
}

const manifest = {
  generatedAt: new Date().toISOString(),
  weights: WEIGHTS,
  criteria: CRITERIA,
  families: FAMILIES,
  tiers: Object.fromEntries(Object.entries(TIER).map(([k, v]) => [k, v.label])),
  statusLabels: STATUS_LABEL,
  makerKinds: Object.fromEntries(Object.entries(KIND).map(([k, v]) => [k, v.label])),
  groups: {},
  shards: SHARDS,
  categories: [],
  benchmarks: [],
};

const BENCHMARKS = (await import(pathToFileURL(path.join(DATA, 'benchmarks.js')).href)).default;
if (!Array.isArray(BENCHMARKS)) throw new Error('benchmarks.js: default export must be an array');
assertBenchmarkSet(BENCHMARKS, new Set(SITES.map((s) => s.id)));

let grandTotal = 0;
for (const site of SITES) {
  const file = `${site.id}.json`;
  const raw = JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'));
  const seen = new Set();
  const tagIndex = [];
  const tagPos = new Map();
  const tagCount = new Map();
  const items = [];
  const details = Array.from({ length: SHARDS }, () => ({}));
  const bySegment = Object.fromEntries(site.segment.options.map((o) => [o.id, 0]));
  const groupDefs = groupDefsFor(site);
  Object.assign(manifest.groups, Object.fromEntries(Object.entries(groupDefs).map(([g, d]) => [`${site.id}/${g}`, d])));
  for (const rec of raw) {
    assertReal(rec, file);
    if (seen.has(rec.id)) continue;
    seen.add(rec.id);
    const t = rec.tags.map((tag) => {
      if (!tagPos.has(tag)) { tagPos.set(tag, tagIndex.length); tagIndex.push(tag); }
      tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      return tagPos.get(tag);
    });
    const seg = rec.tags.find((x) => x.startsWith('seg:'))?.slice(4) || 'unstated';
    bySegment[seg] = (bySegment[seg] || 0) + 1;
    items.push({
      id: rec.id, b: rec.brand, m: rec.model, p: rec.price, st: rec.buyStore,
      s: overall(rec.scores), sc: rec.scores,
      img: rec.images[0], q: rec.lines.q, f: rec.lines.f, r: rec.rating, rc: rec.ratingCount, t,
      ev: rec.evidence.status, vf: rec.evidence.counts.official, sf: rec.evidence.counts.listing, mk: rec.evidence.maker.kind,
    });
    details[shardOf(rec.id)][rec.id] = {
      title: rec.title, images: rec.images, buyUrl: rec.buyUrl, buyStore: rec.buyStore, tags: rec.tags, evidence: rec.evidence, listingSpec: rec.listingSpec,
    };
  }
  const facetGroups = [...Object.keys(groupDefs)];
  const facets = {};
  for (const g of facetGroups) {
    const rows = [...tagCount.entries()].filter(([tag]) => tag.startsWith(g + ':'))
      .map(([tag, count]) => ({ tag, label: labelFor(site, tag), count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    if (rows.length) facets[g] = rows;
  }
  fs.writeFileSync(path.join(OUT, `${site.id}.json`), JSON.stringify({ id: site.id, count: items.length, tagIndex, facets, items }));
  details.forEach((d, i) => fs.writeFileSync(path.join(OUT, `${site.id}.d${i}.json`), JSON.stringify(d)));
  manifest.categories.push({
    id: site.id, label: site.label, kicker: site.kicker, family: site.family, unit: site.unit, blurb: site.blurb,
    facets: Object.keys(facets), featured: site.featured.filter((tag) => tagCount.has(tag)), count: items.length,
    segment: { key: site.segment.key, label: site.segment.label, options: site.segment.options }, bySegment,
    stores: { flipkart: tagCount.get('store:flipkart') || 0, amazon: tagCount.get('store:amazon') || 0 },
    evidence: Object.fromEntries(Object.keys(STATUS_LABEL).map((k) => [k, tagCount.get(`ev:${k}`) || 0])),
    fields: site.fields.map((f) => ({ key: f.key, label: f.label, group: f.group, dim: f.dim })),
    priceMax: Math.max(...items.map((x) => x.p)),
  });
  grandTotal += items.length;
  const bench = BENCHMARKS.find((b) => b.category === site.id);
  const market = matchBenchmark(bench, items);
  manifest.benchmarks.push(publicBenchmark(bench, market));
  const marketLine = market.status === 'not-found' ? 'no listing' : `${market.status} #${market.rank}/${market.of} ${market.title.slice(0, 50)}`;
  const evLine = Object.keys(STATUS_LABEL).map((k) => `${k} ${tagCount.get(`ev:${k}`) || 0}`).join(' / ');
  console.log(`${site.id.padEnd(18)} ${String(items.length).padStart(5)}  facets=${Object.keys(facets).length}  tags=${tagIndex.length}  ${evLine}  benchmark=${bench.brand} ${bench.name} → ${marketLine}`);
}

manifest.total = grandTotal;
manifest.groupOrder = GLOBAL_GROUPS;
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest));
console.log(`total products ${grandTotal} → ${path.relative(ROOT, OUT)}`);
