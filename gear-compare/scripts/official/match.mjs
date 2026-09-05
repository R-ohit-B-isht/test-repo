// Match marketplace listings to maker catalogue products — exact or demonstrably the same model only.
//   node scripts/official/match.mjs power-banks
// Reads data/<site>.json (listings) + $GEAR_OUT/official/<site>.catalog.json, writes data/official/<site>.json
// ({ listingId: { url, title, region, fetchedAt, matchScore, matchedOn, kv } }) and an audit report beside the catalogue.
//
// Rules: a listing needs a model identifier (marketplace "Model Number" / "Model Name", or the model words in its
// title) that appears in exactly one maker product; capacity / output stated by both sides must agree; two maker
// products fitting equally well = ambiguous = no match. Generic titles ("20000 mAh 22.5 W Power Bank") never match.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { SITES } from '../lib/registry.mjs';

const require = createRequire(import.meta.url);
const { mah, watts } = require('../lib/parse.cjs');
const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '..', '..');
const siteId = process.argv[2];
const site = SITES.find((s) => s.id === siteId);
if (!site) throw new Error(`unknown site ${siteId}`);
const makers = (await import(`./makers/${siteId}.mjs`)).default;
const OUT = path.join(process.env.GEAR_OUT || path.join(process.env.HOME || '', 'gear'), 'official');
const catalog = JSON.parse(fs.readFileSync(path.join(OUT, `${siteId}.catalog.json`), 'utf8'));
const listings = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', `${siteId}.json`), 'utf8'));

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const words = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9.]+/g, ' ').split(' ').filter(Boolean);
// Descriptive words that never identify a model (marketplace size descriptors, colours, generic spec words).
// Variant words (pro / max / plus / mini / ultra / neo / turbo / air / lite / duo / numbers / single letters) are kept.
const DESCRIPTIVE = new Set(['power', 'bank', 'powerbank', 'mah', 'w', 'wh', 'with', 'and', 'for', 'the', 'of', 'fast', 'charging', 'charge', 'charger', 'compact', 'slim', 'pocket', 'size',
  'portable', 'wired', 'wireless', 'magsafe', 'magnetic', 'lithium', 'polymer', 'ion', 'li', 'type', 'usb', 'pd', 'qc', 'quick', 'super', 'superfast', 'output', 'input', 'ports', 'port',
  'black', 'white', 'blue', 'red', 'grey', 'gray', 'green', 'purple', 'pink', 'orange', 'navy', 'midnight', 'olive', 'silver', 'gold', 'mocha', 'burgundy', 'beige', 'multicolor', 'digital',
  'display', 'led', 'built', 'in', 'cable', 'cables', 'smart', 'phone', 'mobile', 'tablet', 'laptop', 'earbuds', 'smartwatch', 'new', 'edition', 'series', 'na', 'n', 'a', 'powerbank']);
const sig = (s) => words(s).filter((w) => !DESCRIPTIVE.has(w) && !/^\d+(?:\.\d+)?(?:mah|w)$/.test(w));

// Every identifying word of the maker's product name must be present in the listing text; "10k" / "20" style
// tokens are satisfied by the listing's stated capacity.
function discriminatorsMissing(catalogTitle, listingText, listingCap) {
  const lt = norm(listingText);
  const lw = new Set(words(listingText));
  const model = catalogTitle.split(/[|,(:–—-]\s|\s-\s/)[0];
  return sig(model).filter((w) => {
    const k = /^(\d+)k$/.exec(w);
    if (k) return !(listingCap === Number(k[1]) * 1000 || lt.includes(w));
    if (/^\d+$/.test(w)) return !(lw.has(w) || listingCap === Number(w) * 1000 || lt.includes(w));
    if (w.length <= 3) return !lw.has(w);
    return !lt.includes(norm(w));
  });
}

const capOf = (s) => mah(s);
const outOf = (s) => watts(s);

function catalogCap(c) {
  const k = Object.entries(c.kv).find(([key, v]) => /capacity/i.test(key) && mah(v) !== null);
  return k ? mah(k[1]) : mah(c.title);
}
function catalogOut(c) {
  const k = Object.entries(c.kv).find(([key, v]) => /(?:max|total|wired|power)\s*output|^output$/i.test(key) && watts(v) !== null);
  return k ? watts(k[1]) : null;
}

function makerFor(brand) {
  return makers.find((m) => m.brand.test(String(brand || '').trim()));
}

// Model identifiers a listing carries: marketplace model number / name (when not a placeholder) and the
// non-generic words of the title up to the first separator.
function listingIds(l) {
  const spec = l.listingSpec || {};
  const no = spec['Model Number'] && !/^(?:na|n\/a|-|none)$/i.test(spec['Model Number']) ? spec['Model Number'] : null;
  const name = spec['Model Name'] && !/^(?:na|n\/a|-|none)$/i.test(spec['Model Name']) ? spec['Model Name'] : null;
  const head = l.title.split(/[|,(:]|\bwith\b/i)[0].replace(new RegExp(`^${l.brand.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s*`, 'i'), '');
  return { no, name, headWords: sig(head), nameWords: sig(name) };
}

function scoreCandidate(l, ids, c) {
  const hay = norm(c.title + ' ' + c.handle + ' ' + (c.variants || []).join(' ') + ' ' + Object.entries(c.kv).filter(([k]) => /model/i.test(k)).map(([, v]) => v).join(' '));
  const hayText = norm(c.text || '');
  const titleWords = new Set([...words(c.title), ...c.handle.split('-')]);
  let score = 0;
  const on = [];
  if (ids.no && norm(ids.no).length >= 4 && (hay.includes(norm(ids.no)) || hayText.includes(norm(ids.no)))) { score += 0.6; on.push(`model number ${ids.no}`); }
  const nameWords = ids.nameWords.length ? ids.nameWords : ids.headWords;
  if (nameWords.some((w) => /[a-z]/.test(w))) {
    const hit = nameWords.filter((w) => titleWords.has(w) || (w.length > 3 && hay.includes(norm(w))));
    if (hit.length === nameWords.length) { score += 0.5; on.push(`model name "${nameWords.join(' ')}"`); }
    else if (hit.length >= 2 && hit.length / nameWords.length >= 0.67) { score += 0.25; on.push(`partial name ${hit.join(' ')}`); }
  }
  const lc = capOf(l.title) ?? capOf((l.listingSpec || {})['Battery Capacity']);
  const cc = catalogCap(c);
  if (lc && cc) { if (lc === cc) { score += 0.1; on.push(`${lc} mAh`); } else return { score: 0, on: [`capacity differs (${lc} vs ${cc} mAh)`] }; }
  const missing = discriminatorsMissing(c.title, `${l.title} ${ids.name || ''} ${ids.no || ''}`, lc);
  if (missing.length) return { score: 0, on: [`maker model has "${missing.join(' ')}" — not in listing`] };
  const lo = outOf(l.title) ?? outOf((l.listingSpec || {})['Maximum Power Output'] || (l.listingSpec || {})['Output Power']);
  const co = catalogOut(c);
  if (lo && co) { if (Math.abs(lo - co) < 0.6) { score += 0.05; on.push(`${lo} W`); } else return { score: 0, on: [`output differs (${lo} vs ${co} W)`] }; }
  return { score, on };
}

const official = {};
const report = { matched: [], ambiguous: [], nomatch: [], nomaker: 0, noIds: 0 };
for (const l of listings) {
  const m = makerFor(l.brand);
  if (!m) { report.nomaker++; continue; }
  const ids = listingIds(l);
  if (!ids.no && !ids.nameWords.length && !ids.headWords.length) { report.noIds++; continue; }
  const cands = catalog.filter((c) => c.maker === m.base).map((c) => ({ c, ...scoreCandidate(l, ids, c) })).filter((x) => x.score >= 0.5).sort((a, b) => b.score - a.score);
  if (!cands.length) { report.nomatch.push({ id: l.id, title: l.title, ids }); continue; }
  const top = cands[0];
  const sameProduct = (a, b) => norm(a.title).slice(0, 60) === norm(b.title).slice(0, 60);
  const rivals = cands.filter((x) => x.score >= top.score - 0.1 && !sameProduct(x.c, top.c));
  if (rivals.length > 0) { report.ambiguous.push({ id: l.id, title: l.title, candidates: rivals.map((r) => r.c.title) }); continue; }
  official[l.id] = { url: top.c.url, title: top.c.title, region: top.c.region, fetchedAt: top.c.fetchedAt, matchScore: Math.round(top.score * 100) / 100, matchedOn: top.on, kv: top.c.kv };
  report.matched.push({ id: l.id, listing: l.title, maker: top.c.title, score: top.score, on: top.on });
}

fs.mkdirSync(path.join(ROOT, 'data', 'official'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'data', 'official', `${siteId}.json`), JSON.stringify(official, null, 1));
fs.writeFileSync(path.join(OUT, `${siteId}.match-report.json`), JSON.stringify(report, null, 1));
console.log(`${siteId}: ${listings.length} listings · maker catalogue for ${listings.length - report.nomaker} · matched ${report.matched.length} · ambiguous ${report.ambiguous.length} · no match ${report.nomatch.length} · no model id ${report.noIds}`);
