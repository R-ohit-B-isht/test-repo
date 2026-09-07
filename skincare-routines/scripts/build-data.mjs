// Converts the generated marketplace data (data/*.js, real listings only) into
// compact per-category JSON the app loads on demand:
//   public/data/manifest.json          — categories, counts, facet group defs, weights
//   public/data/<cat>.json             — list rows + facet counts + tag index
//   public/data/<cat>.d<n>.json        — lazy detail shards (spec sheet, gallery, pros/cons)
//   public/data/routines.json          — the 142 routines with phase-tagged steps
// Nothing is invented here: every field is copied from the generated records.

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { CATEGORIES, WEIGHTS, CRITERIA, ROUTINE_WEIGHTS, ROUTINE_CRITERIA, PHASES, phaseOf, ROUTINE_CATEGORY_LABELS, ZONE_LABELS, SCOPE_KEYS, scopeGroupOf } from './lib/registry.mjs';
import { assertBenchmarkSet, matchBenchmark, publicBenchmark } from './lib/benchmarks.mjs';

const require = createRequire(import.meta.url);
const { GROUPS, labelFor } = require('./lib/facets.cjs');
const { CONCERNS } = require('./lib/concerns.cjs');
const { SOURCES } = require('./lib/inci-kb.cjs');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');
const OUT = path.join(ROOT, 'public', 'data');
const SHARDS = 12;
fs.mkdirSync(OUT, { recursive: true });

function loadGlobal(file, name) {
  const src = fs.readFileSync(path.join(DATA, file), 'utf8').replace(/^const /gm, 'var ');
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(src, ctx, { filename: file });
  const v = ctx[name];
  if (!Array.isArray(v)) throw new Error(`${file}: global ${name} missing`);
  return v;
}

const overall = (scores) => Math.round(Object.keys(WEIGHTS).reduce((s, k) => s + (scores[k] ?? 0) * WEIGHTS[k], 0) * 100) / 10;

function parseRating(s) {
  const m = /^(\d(?:\.\d)?)\/5(?:\s*\((?:([\d,]+) ratings?, )?)?/.exec(s || '');
  if (!m) return { r: null, rc: null };
  return { r: Number(m[1]), rc: m[2] ? Number(m[2].replace(/,/g, '')) : null };
}

function shardOf(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % SHARDS;
}

function assertReal(rec, file) {
  const problems = [];
  if (!rec.id) problems.push('id');
  if (!(rec.price > 0)) problems.push('price');
  if (!/^https?:\/\//.test(rec.buyUrl || '')) problems.push('buyUrl');
  if (!Array.isArray(rec.images) || !rec.images.length || !/^https?:\/\//.test(rec.images[0])) problems.push('images');
  if (!rec.buyStore) problems.push('buyStore');
  if (!Array.isArray(rec.tags)) problems.push('tags');
  for (const k of Object.keys(WEIGHTS)) if (typeof rec.scores?.[k] !== 'number') problems.push('scores.' + k);
  if (!['full', 'partial', 'garbled', 'none'].includes(rec.evidence?.inci)) problems.push('evidence.inci');
  if (rec.evidence?.inciSourceKind && rec.evidence.inciSourceKind !== 'listing' && !/^https?:\/\//.test(rec.evidence.inciSourceUrl || '')) problems.push('evidence.inciSourceUrl');
  if (problems.length) throw new Error(`${file}: record ${rec.id} missing real fields: ${problems.join(', ')}`);
}

const manifest = {
  generatedAt: new Date().toISOString(),
  weights: WEIGHTS,
  criteria: CRITERIA,
  routineWeights: ROUTINE_WEIGHTS,
  routineCriteria: ROUTINE_CRITERIA,
  routineCategoryLabels: ROUTINE_CATEGORY_LABELS,
  zoneLabels: ZONE_LABELS,
  groups: GROUPS,
  concerns: CONCERNS.map(([id, label]) => ({ id, label })),
  sources: SOURCES,
  phases: PHASES,
  shards: SHARDS,
  categories: [],
  benchmarks: [],
};

const BENCHMARKS = loadGlobal('benchmarks.js', 'BENCHMARKS');
assertBenchmarkSet(BENCHMARKS, new Set(CATEGORIES.map((c) => c.id)));

let grandTotal = 0;
for (const cat of CATEGORIES) {
  const raw = loadGlobal(cat.file, cat.global);
  const seen = new Set();
  const tagIndex = [];
  const tagPos = new Map();
  const tagCount = new Map();
  const items = [];
  const details = Array.from({ length: SHARDS }, () => ({}));
  const scopeGroup = scopeGroupOf(cat);
  const byScope = Object.fromEntries(SCOPE_KEYS[scopeGroup].map((k) => [k, 0]));
  for (const rec of raw) {
    assertReal(rec, cat.file);
    if (seen.has(rec.id)) continue;
    seen.add(rec.id);
    const t = rec.tags.map((tag) => {
      if (!tagPos.has(tag)) { tagPos.set(tag, tagIndex.length); tagIndex.push(tag); }
      tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      return tagPos.get(tag);
    });
    const scope = rec.tags.find((x) => x.startsWith(scopeGroup + ':'))?.slice(scopeGroup.length + 1) || 'unstated';
    byScope[scope] = (byScope[scope] || 0) + 1;
    const { r, rc } = parseRating(rec.fullSpec?.rating);
    items.push({
      id: rec.id, b: rec.brand, m: rec.model, p: rec.price, st: rec.buyStore,
      s: overall(rec.scores), sc: { trust: rec.scores.trust, skin: rec.scores.skin, ingredients: rec.scores.ingredients, experience: rec.scores.experience },
      img: rec.images[0], q: rec.capacityLine, f: rec.featureLine, r, rc, t, ev: rec.evidence.inci,
      ...(rec.evidence.inci === 'full' && rec.evidence.inciSourceKind && rec.evidence.inciSourceKind !== 'listing' ? { es: rec.evidence.inciSourceKind } : {}),
      ...(rec.step ? { step: rec.step } : {}),
    });
    details[shardOf(rec.id)][rec.id] = {
      title: rec.title, highlight: rec.highlight, pros: rec.pros, cons: rec.cons, fullSpec: rec.fullSpec,
      images: rec.images, buyUrl: rec.buyUrl, buyStore: rec.buyStore, tags: rec.tags, evidence: rec.evidence,
    };
  }
  const facets = {};
  for (const g of cat.facets) {
    const rows = [...tagCount.entries()].filter(([tag]) => tag.startsWith(g + ':'))
      .map(([tag, count]) => ({ tag, label: labelFor(tag), count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    if (rows.length) facets[g] = rows;
  }
  fs.writeFileSync(path.join(OUT, `${cat.id}.json`), JSON.stringify({ id: cat.id, count: items.length, tagIndex, facets, items }));
  details.forEach((d, i) => fs.writeFileSync(path.join(OUT, `${cat.id}.d${i}.json`), JSON.stringify(d)));
  manifest.categories.push({
    id: cat.id, label: cat.label, kicker: cat.kicker, zone: cat.zone, blurb: cat.blurb, facets: cat.facets, scopeGroup,
    featured: cat.featured.filter((tag) => tagCount.has(tag)), count: items.length, byScope,
    byConcern: Object.fromEntries([...tagCount.entries()].filter(([tag]) => tag.startsWith('target:')).map(([tag, n]) => [tag.slice(7), n])),
    stores: { flipkart: tagCount.get('store:flipkart') || 0, amazon: tagCount.get('store:amazon') || 0 },
    priceMax: Math.max(...items.map((x) => x.p)),
  });
  grandTotal += items.length;
  const bench = BENCHMARKS.find((b) => b.category === cat.id);
  const market = matchBenchmark(bench, items);
  manifest.benchmarks.push(publicBenchmark(bench, market));
  const marketLine = market.status === 'not-found' ? 'no listing' : `${market.status} #${market.rank}/${market.of} ${market.title.slice(0, 50)}`;
  const scopeLine = SCOPE_KEYS[scopeGroup].map((k) => `${k} ${byScope[k]}`).join(' / ');
  console.log(`${cat.id.padEnd(13)} ${String(items.length).padStart(5)}  facets=${Object.keys(facets).length}  tags=${tagIndex.length}  ${scopeLine}  benchmark=${bench.brand} ${bench.name} → ${marketLine}`);
}

// Routines (data.js .. data4.js push into one ROUTINES array)
{
  const src = ['data.js', 'data2.js', 'data3.js', 'data4.js'].map((f) => fs.readFileSync(path.join(DATA, f), 'utf8').replace(/^const /gm, 'var ')).join('\n');
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  const routines = ctx.ROUTINES.map((r) => {
    const steps = {};
    for (const slot of ['morning', 'evening', 'weekly']) steps[slot] = (r.steps[slot] || []).map((s) => ({ ...s, phase: phaseOf(s) }));
    const phases = [...new Set(Object.values(steps).flat().map((s) => s.phase))];
    const score = Math.round(Object.keys(ROUTINE_WEIGHTS).reduce((sum, k) => sum + r.scores[k] * ROUTINE_WEIGHTS[k], 0) * 100) / 10;
    if (!/^https?:\/\//.test(r.sourceUrl || '')) throw new Error(`routine ${r.id} has no real sourceUrl`);
    return { ...r, steps, phases, score };
  });
  fs.writeFileSync(path.join(OUT, 'routines.json'), JSON.stringify({ count: routines.length, items: routines }));
  manifest.routines = { count: routines.length, categories: [...new Set(routines.map((r) => r.category))] };
  console.log(`routines      ${String(routines.length).padStart(5)}`);
}

manifest.total = grandTotal;
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest));
console.log(`total products ${grandTotal} → ${path.relative(ROOT, OUT)}`);
