// Match marketplace listings to maker catalogue products — exact or demonstrably the same model only.
//   node scripts/official/match.mjs power-banks
// Reads data/<site>.json (listings) + $GEAR_OUT/official/<site>.catalog.json, writes data/official/<site>.json
// ({ listingId: { url, title, region, fetchedAt, matchScore, matchedOn, kv } }) and an audit report beside the catalogue.
//
// Rules: a listing needs a model identifier (marketplace "Model Number" / "Model Name", or the model words in its
// title) that appears in exactly one maker product; capacity / output stated by both sides must agree; two maker
// products fitting equally well = ambiguous = no match. Generic titles ("20000 mAh 22.5 W Power Bank") never match.
// A base-name match ("Smart Tank") is not enough when the maker also sells same-capacity siblings ("Smart Tank Pro",
// "Smart Tank III"): a seller who dropped the suffix looks identical, so unless the listing carries the maker's model
// number / an alphanumeric model code, or its spec-table Model Name is exactly the base name, the listing is ambiguous.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITES } from '../lib/registry.mjs';
import { modelCodes, codeIndex, isBundle, BUNDLE_NOUNS } from './model-codes.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '..', '..');
const siteId = process.argv[2];
const site = SITES.find((s) => s.id === siteId);
if (!site) throw new Error(`unknown site ${siteId}`);
const makers = (await import(`./makers/${siteId}.mjs`)).default;
const OUT = path.join(process.env.GEAR_OUT || path.join(process.env.HOME || '', 'gear'), 'official');
const catalog = JSON.parse(fs.readFileSync(path.join(OUT, `${siteId}.catalog.json`), 'utf8'));
const listings = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', `${siteId}.json`), 'utf8'));
const CODES = codeIndex(catalog);
const BUNDLE_WORDS = site.match?.bundleNouns || BUNDLE_NOUNS;

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const words = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9.]+/g, ' ').split(' ').filter(Boolean);
// Descriptive words that never identify a model: colours, connectives, generic marketing words, plus the category
// vocabulary each site schema supplies in `match.descriptive`. Variant words (pro / max / plus / mini / ultra / neo /
// turbo / air / lite / duo / numbers / single letters) are kept because makers use them to tell siblings apart.
const COLOURS = new Set(['black', 'white', 'blue', 'red', 'grey', 'gray', 'green', 'purple', 'pink', 'orange', 'navy', 'midnight', 'olive', 'silver', 'gold', 'mocha', 'burgundy', 'beige', 'multicolor', 'multicolour',
  'brown', 'yellow', 'teal', 'maroon', 'khaki', 'tan', 'charcoal', 'graphite', 'rose', 'coral', 'lavender', 'mint', 'cream', 'ivory', 'copper', 'bronze', 'matte', 'glossy', 'skyblue', 'aqua', 'brick']);
const DESCRIPTIVE = new Set(['with', 'and', 'for', 'the', 'of', 'in', 'to', 'by', 'or', 'fast', 'pocket', 'size', 'portable', 'new', 'edition', 'series', 'na', 'n', 'a', ...COLOURS,
  'men', 'mens', 'women', 'womens', 'unisex', 'kids', 'boys', 'girls', 'premium', 'professional', 'original', 'best', 'super', 'superfast', 'digital', 'smart', 'built', 'led', 'display',
  ...(site.match?.descriptive || [])]);
// An alphanumeric model code in the listing ("pb400", "10r4", "mw67") identifies the model as firmly as a model number.
const isCode = (w) => /[a-z]/.test(w) && /\d/.test(w) && w.length >= 4;
// Unit-bearing quantities ("20000mah", "50l", "1200w") are compared by the numeric guards, not as name tokens.
const sig = (s) => words(s).filter((w) => !DESCRIPTIVE.has(w) && !/^\d+(?:\.\d+)?(?:mah|w|l|ltrs?|ml|oz|litres?|liters?|min|mins|hrs?|kg|g|gm|cm|mm|rpm)$/.test(w));

// Every identifying word of the maker's product name must be present in the listing text; "10k" / "20" style
// tokens are satisfied by the listing's stated capacity, and a maker range ("1400-1600 Watts") by a listing value
// inside it.
// The model name is what precedes the category noun or the first feature connector ("Stonex 60 L | Backpack with…").
const NOUN_CUT = /\b(?:with|for|featuring|and|&|backpacks?|rucksacks?|bags?|daypack|hair\s*dryers?|hairdryers?|dryers?|trimmers?|clippers?|shavers?|groomers?|induction|cooktops?|stoves?|cookers?|blenders?|juicers?|tumblers?|bottles?|flasks?|sippers?|mugs?|shoes?|boots?|sneakers?|footwear|power\s*banks?|powerbanks?|lighters?)\b/i;
const modelOf = (catalogTitle) => { const head = catalogTitle.split(/[|,(:–—-]\s|\s-\s/)[0]; const cut = head.split(NOUN_CUT)[0]; return sig(cut).length ? cut : head; };
const rangesIn = (s) => [...String(s).matchAll(/(\d{3,5})\s*-\s*(\d{3,5})/g)].map((m) => [Number(m[1]), Number(m[2])]);
function discriminatorsMissing(c, listingText, listingCap) {
  const lt = norm(listingText);
  const lw = new Set(words(listingText));
  const model = modelOf(c.title);
  const inRange = rangesIn(model).some(([lo, hi]) => listingCap !== null && listingCap >= lo && listingCap <= hi);
  return modelWords(c).filter((w) => {
    const k = /^(\d+)k$/.exec(w);
    if (k) return !(listingCap === Number(k[1]) * 1000 || lt.includes(w));
    if (/^\d+$/.test(w)) return !(lw.has(w) || listingCap === Number(w) || listingCap === Number(w) * 1000 || lt.includes(w) || (inRange && rangesIn(model).some(([lo, hi]) => Number(w) === lo || Number(w) === hi)));
    if (w.length <= 3) return !lw.has(w);
    return !lt.includes(norm(w));
  });
}

// Numeric guards: a quantity both sides state must agree (site.match.numeric = [{ label, listing(l), catalog(c), tol }]).
// catalog() may return [lo, hi] for makers that publish a range. The first guard is also used to satisfy
// "10k"-style tokens in maker names (the discriminator check below).
const GUARDS = site.match?.numeric || [];
const agrees = (lv, cv, tol = 0) => (Array.isArray(cv) ? lv >= cv[0] - tol && lv <= cv[1] + tol : Math.abs(lv - cv) <= tol);
const showV = (g, v) => (Array.isArray(v) ? `${g.show ? g.show(v[0]) : v[0]}–${g.show ? g.show(v[1]) : v[1]}` : g.show ? g.show(v) : v);

function makerFor(brand) {
  return makers.find((m) => m.brand.test(String(brand || '').trim()));
}

// Model identifiers a listing carries: marketplace model number / name (when not a placeholder) and the
// non-generic words of the title up to the first separator.
function listingIds(l) {
  const spec = l.listingSpec || {};
  const stated = (re) => { const k = Object.keys(spec).find((key) => re.test(key.trim())); const v = k ? String(spec[k]).trim() : ''; return v && !/^(?:na|n\/a|-|none|generic)$/i.test(v) ? v : null; };
  const no = stated(/^(?:model(?:\s*(?:number|no\.?|code))?|item model number|model_number)$/i);
  const name = stated(/^model[\s_]?name$/i);
  const cut = truncatedTitle(l.title) ? l.title.replace(/\s*\S*$/, '') : l.title;
  const head = cut.split(/[|,(:]|\bwith\b/i)[0].replace(new RegExp(`^${l.brand.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s*`, 'i'), '');
  const bw = brandWords(l.brand);
  const m = makerFor(l.brand);
  const unbrand = (ws) => ws.filter((w) => !bw.has(w) && !(m && m.brand.test(w)));
  // A parenthesised alias in the model fields ("Zeb-EnergiTank 20MR1 (Zeb-PB 15)") is a second code, not more name.
  const unalias = (s) => (s ? s.replace(/\s*\([^)]*\)/g, '').trim() : null);
  const bare = unalias(name);
  return { no, noBare: unalias(no), name, headWords: unbrand(sig(head)), nameWords: unbrand(sig(bare || name)) };
}
// Flipkart card titles are clipped at ~65 characters mid-word ("… Rain Cove"); the clipped final word is a fragment,
// not an identifier. It is dropped only from the title head — every other check still runs on what remains.
const truncatedTitle = (t) => t.length >= 63 && t.length <= 65 && !/[)\].!]$/.test(t);
// The maker's own name never identifies a model ("Bajaj" in "Bajaj ICX 140TS"). Only that product's brand is
// stripped: a marketplace row mis-branded "NHT" must not erase the NHT prefix from every Nova model code.
const brandWords = (brand) => new Set(words(brand).filter((w) => w.length > 1));
// A maker's short self-name ("Zeb" in "Zeb EnergiPod 10MR1") is a brand alias the maker list declares, not a model word.
const isBrandWord = (c, w) => brandWords(c.brand).has(w) || makers.some((m) => m.base === c.maker && m.brand.test(w));
const modelWords = (c) => sig(modelOf(c.title)).filter((w) => !isBrandWord(c, w));

function scoreCandidate(l, ids, c) {
  const hay = norm(c.title + ' ' + c.handle + ' ' + (c.variants || []).join(' ') + ' ' + Object.entries(c.kv).filter(([k]) => /model/i.test(k)).map(([, v]) => v).join(' '));
  const hayText = norm(c.text || '');
  const titleWords = new Set([...words(c.title), ...c.handle.split('-')]);
  let score = 0;
  const on = [];
  const bundle = isBundle(l.title, c.title, BUNDLE_WORDS);
  if (bundle) return { score: 0, on: [bundle] };
  // Maker model codes the listing prints: one that the maker's catalogue assigns to a different product rules this
  // candidate out; one that only this product carries identifies it as firmly as a model number.
  let byCode = false;
  for (const code of modelCodes(`${l.title} ${ids.no || ''} ${ids.name || ''}`)) {
    const holders = CODES.holders(c.maker, code);
    if (!holders.length) continue;
    if (!holders.includes(c)) return { score: 0, on: [`listing names model ${code.toUpperCase()}, a different ${site.unit} of this maker`] };
    if (holders.length === 1 && !byCode) { byCode = true; score += 0.6; on.push(`model number ${code.toUpperCase()} (maker's code)`); }
  }
  const noKey = norm(ids.noBare || ids.no);
  if (ids.no && !byCode && noKey.length >= 4 && (hay.includes(noKey) || hayText.includes(noKey))) { score += 0.6; on.push(`model number ${ids.noBare || ids.no}`); }
  const nameWords = ids.nameWords.length ? ids.nameWords : ids.headWords;
  if (nameWords.some((w) => /[a-z]/.test(w))) {
    const hit = nameWords.filter((w) => titleWords.has(w) || (w.length > 3 && hay.includes(norm(w))));
    if (hit.length === nameWords.length) { score += 0.5; on.push(`model name "${nameWords.join(' ')}"`); }
    else if (hit.length >= 2 && hit.length / nameWords.length >= 0.67) { score += 0.25; on.push(`partial name ${hit.join(' ')}`); }
  }
  // CTN-keyed catalogues (Philips): the listing's own model code is the identity; a bare base model only counts when
  // the maker answers for exactly one CTN with that base.
  if (c.ctn) {
    const lt = norm(`${l.title} ${ids.no || ''} ${ids.name || ''}`);
    const full = lt.includes(norm(c.ctn));
    const base = lt.includes(norm(c.ctn.split('/')[0]));
    if (!full && !(base && !c.ambiguousBase)) return { score: 0, on: [c.ambiguousBase ? `maker sells several ${c.ctn.split('/')[0]} variants; listing does not state which` : `CTN ${c.ctn} not in listing`] };
    score = 0.6 + (full ? 0.2 : 0);
    on.length = 0;
    on.push(full ? `model number ${c.ctn}` : `model ${c.ctn.split('/')[0]} (maker's only Indian CTN: ${c.ctn})`);
  }
  let first = null;
  for (const g of GUARDS) {
    const lv = g.listing(l);
    const cv = g.catalog(c);
    if (first === null) first = lv;
    if (lv === null || cv === null) continue;
    if (agrees(lv, cv, g.tol)) { score += 0.05; on.push(`${g.label} ${showV(g, lv)}`); }
    else return { score: 0, on: [`${g.label} differs (${showV(g, lv)} vs ${showV(g, cv)})`] };
  }
  if (!c.ctn && !byCode) {
    const model = sig(modelOf(c.title));
    if (!model.length && !on.some((o) => o.startsWith('model number'))) return { score: 0, on: ['maker title carries no identifying model words; only a model number can match it'] };
    const missing = discriminatorsMissing(c, `${l.title} ${ids.name || ''} ${ids.no || ''}`, first);
    if (missing.length) return { score: 0, sibling: score >= 0.5, on: [`maker model has "${missing.join(' ')}" — not in listing`] };
  }
  return { score, on };
}

const official = {};
const report = { matched: [], ambiguous: [], nomatch: [], nomaker: 0, noIds: 0 };
for (const l of listings) {
  const m = makerFor(l.brand);
  if (!m) { report.nomaker++; continue; }
  const ids = listingIds(l);
  if (!ids.no && !ids.nameWords.length && !ids.headWords.length) { report.noIds++; continue; }
  const scored = catalog.filter((c) => c.maker === m.base).map((c) => ({ c, ...scoreCandidate(l, ids, c) }));
  if (process.env.DEBUG_MATCH && l.title.toLowerCase().includes(process.env.DEBUG_MATCH.toLowerCase())) console.error(l.title, JSON.stringify(ids), JSON.stringify(scored.filter((x) => x.score > 0 || x.sibling).map((x) => [x.c.title, x.score, x.on]), null, 1));
  const cands = scored.filter((x) => x.score >= 0.5).sort((a, b) => b.score - a.score);
  if (!cands.length) { report.nomatch.push({ id: l.id, title: l.title, ids }); continue; }
  // Colour variants of one model are the same product; a CTN or the identifying model words tell products apart.
  const identity = (c) => c.ctn || modelWords(c).join(' ') || norm(c.title).slice(0, 60);
  const sameProduct = (a, b) => identity(a) === identity(b);
  // Among colour variants prefer the one whose colour the listing states, so the provenance URL is the exact page.
  const lw = new Set(words(l.title));
  const colourHit = (c) => words(c.title).filter((w) => COLOURS.has(w) && lw.has(w)).length;
  cands.sort((a, b) => b.score - a.score || colourHit(b.c) - colourHit(a.c));
  const top = cands[0];
  const rivals = cands.filter((x) => x.score >= top.score - 0.1 && !sameProduct(x.c, top.c));
  if (rivals.length > 0) { report.ambiguous.push({ id: l.id, title: l.title, candidates: rivals.map((r) => r.c.title) }); continue; }
  // Size variants of one model (Walker Pro 60 L / 80 L) share the name but not the spec sheet: when the listing states
  // no value for a guarded quantity and the maker sells several, no single page can be the evidence.
  const sizeVariant = GUARDS.map((g) => {
    if (g.listing(l) !== null) return null;
    const vals = new Set(cands.filter((x) => sameProduct(x.c, top.c)).map((x) => JSON.stringify(g.catalog(x.c))).filter((v) => v !== 'null'));
    return vals.size > 1 ? g.label : null;
  }).find(Boolean);
  if (sizeVariant) { report.ambiguous.push({ id: l.id, title: l.title, candidates: cands.filter((x) => sameProduct(x.c, top.c)).map((x) => x.c.title), reason: `maker sells several ${sizeVariant} variants; listing states none` }); continue; }
  const byNumber = top.on.some((o) => o.startsWith('model number')) || Boolean(top.c.ctn);
  // A "model" name shared by many maker pages is a range or collection name (Red Tape "Ozark"), not one product;
  // only a model number can single a page out of it.
  const family = cands.filter((x) => sameProduct(x.c, top.c));
  if (!byNumber && family.length > 6) { report.ambiguous.push({ id: l.id, title: l.title, candidates: family.slice(0, 8).map((x) => x.c.title), reason: `"${identity(top.c)}" names ${family.length} maker products (a range, not a model)` }); continue; }
  const exactName = ids.name && ids.nameWords.length > 0 && ids.nameWords.join(' ') === modelWords(top.c).join(' ');
  const topWords = new Set([...words(top.c.title), ...top.c.handle.split('-')]);
  const byCode = [...ids.nameWords, ...ids.headWords].some((w) => isCode(w) && topWords.has(w));
  const siblings = scored.filter((x) => x.sibling && !sameProduct(x.c, top.c));
  if (!byNumber && !exactName && !byCode && siblings.length) { report.ambiguous.push({ id: l.id, title: l.title, candidates: [top.c.title, ...siblings.map((s) => s.c.title)], reason: 'base name shared with same-capacity siblings; no model number' }); continue; }
  // A maker-style code the listing states but the maker page never prints usually marks a sibling variant (touch vs.
  // push-button, a regional SKU); only an exact model-name match may override it.
  if (ids.no && !byNumber && !exactName && isCode(norm(ids.no))) { report.ambiguous.push({ id: l.id, title: l.title, candidates: [top.c.title], reason: `listing model number ${ids.no} not printed on maker page; name match only` }); continue; }
  if (ids.no && !byNumber) top.on.push(`listing model number ${ids.no} not printed on maker page`);
  official[l.id] = { url: top.c.url, title: top.c.title, region: top.c.region, fetchedAt: top.c.fetchedAt, matchScore: Math.round(top.score * 100) / 100, matchedOn: top.on, kv: top.c.kv };
  report.matched.push({ id: l.id, listing: l.title, maker: top.c.title, score: top.score, on: top.on });
}

fs.mkdirSync(path.join(ROOT, 'data', 'official'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'data', 'official', `${siteId}.json`), JSON.stringify(official, null, 1));
fs.writeFileSync(path.join(OUT, `${siteId}.match-report.json`), JSON.stringify(report, null, 1));
console.log(`${siteId}: ${listings.length} listings · maker catalogue for ${listings.length - report.nomaker} · matched ${report.matched.length} · ambiguous ${report.ambiguous.length} · no match ${report.nomatch.length} · no model id ${report.noIds}`);
