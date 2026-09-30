// Evidence-first specification resolver shared by every site.
//
// Each site declares its fields (scripts/sites/*.mjs). For every field the resolver looks, in order, at
//   1. the manufacturer's own product page (tier "official", full credit)      — verified
//   2. the marketplace's structured specification table (tier "listing", 60%) — stated by the seller in a
//      structured field the marketplace holds them to; not verified by the maker
//   3. the listing title / seller bullets (tier "claimed", 0 credit)            — marketing, shown but never scored
//   4. nothing (tier "none", 0)                                                 — honestly missing
// Values that fail the field's plausibility rule are tier "rejected" (0) with the reason kept.
// Official and listing values that disagree are kept as a conflict note; the official value is used.
const TIER = {
  official: { credit: 1.0, label: 'Verified on the manufacturer’s product page' },
  listing: { credit: 0.6, label: 'Stated in the marketplace specification table (not maker-verified)' },
  claimed: { credit: 0, label: 'Claimed in the listing title / seller text — not scored' },
  rejected: { credit: 0, label: 'Implausible seller value — rejected, not scored' },
  none: { credit: 0, label: 'Not stated anywhere we could read' },
};

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const EMPTY = /^(?:na|n\/a|-|none|nil|not applicable)$/i;
// A key that names another model ("Nova NHT 1052 USB Runtime") comes from a sibling-product carousel, not this product.
const SIBLING_KEY = /\b[A-Z]{2,4}[ -]?\d{3,}\b/;

// Official kv tables use the maker's own labels; candidates are every entry whose normalised key equals, then
// contains, a declared label — in label order. The first candidate the field parser accepts wins.
function officialCandidates(kv, labels, exclude = null) {
  if (!kv) return [];
  const entries = Object.entries(kv).filter(([k, v]) => String(v).trim() && !EMPTY.test(String(v).trim()) && !(exclude && exclude.test(k)));
  const out = [];
  for (const l of labels) {
    const n = norm(l);
    for (const [k, v] of entries) if (norm(k) === n && !out.includes(v)) out.push(v);
    for (const [k, v] of entries) if (norm(k).includes(n) && !out.includes(v) && !SIBLING_KEY.test(k) && norm(k).length <= n.length + 30) out.push(v);
  }
  return out;
}

function listingCandidates(kv, labels) {
  if (!kv) return [];
  const map = new Map(Object.entries(kv).map(([k, v]) => [norm(k), v]));
  const out = [];
  for (const l of labels) {
    const v = map.get(norm(l));
    if (v !== undefined && String(v).trim() && !EMPTY.test(String(v).trim())) out.push(v);
  }
  return out;
}

function firstParsed(candidates, parse) {
  for (const c of candidates) {
    const v = parse(c);
    if (v !== null && v !== undefined) return v;
  }
  return null;
}

function allParsed(candidates, parse) {
  const out = [];
  for (const c of candidates) {
    const v = parse(c);
    if (v !== null && v !== undefined) out.push(v);
  }
  return out;
}

// Maker spec pages often state one quantity in several rows (video resolution per mode, photo size per mode, run
// time per mode). Rows whose key matches `officialExclude` are skipped. A field with `officialPick: 'max'` takes the largest; otherwise the first row wins and any other
// row (or the page's own prose) that disagrees is kept as a conflict note.
function officialValue(f, official) {
  if (!official) return { value: null, conflict: null };
  const labels = f.official || [f.label];
  let vals = allParsed(officialCandidates(official.kv, labels, f.officialExclude || null), f.parse);
  const prose = f.prose && official.text ? f.prose(official.text) : null;
  if (!vals.length && f.officialExclude) {
    // No spec row states it: fall back to the crawler's "(page text)" reads of the maker page, flagged as such.
    const pageText = Object.fromEntries(Object.entries(official.kv || {}).filter(([k]) => /\(page text\)$/i.test(k)));
    vals = allParsed(officialCandidates(pageText, labels), f.parse);
    if (vals.length) return { value: f.officialPick === 'max' && typeof vals[0] === 'number' ? Math.max(...vals) : vals[0], conflict: `Read from the maker page's text (${f.display(vals[0])}), not from a spec-table row` };
  }
  if (!vals.length) return { value: prose !== null && prose !== undefined ? prose : null, conflict: null };
  const distinct = vals.filter((v, i) => vals.findIndex((x) => same(x, v)) === i);
  let value = vals[0];
  if (f.officialPick === 'max' && typeof value === 'number') value = Math.max(...vals);
  else if (typeof value === 'boolean' && distinct.length > 1) value = true;
  let conflict = null;
  if (typeof value === 'number' && f.officialPick !== 'max' && distinct.length > 1) {
    conflict = `Maker page states ${distinct.map(f.display).join(' and ')} in different spec rows — first row used`;
  } else if (typeof value === 'number' && prose !== null && prose !== undefined && !same(prose, value) && (f.officialPick !== 'max' || prose > value)) {
    conflict = `Maker spec table states ${f.display(value)}; the same page's text states ${f.display(prose)} — table row used`;
  }
  return { value, conflict };
}

const same = (a, b) => (Array.isArray(a) ? JSON.stringify([...a].sort()) === JSON.stringify([...(b || [])].sort()) : a === b);

/**
 * @param {object} site        site schema (fields, ...)
 * @param {object} src         { official: {kv,text?,url,title,matchScore,region,fetchedAt} | null, listing: kv | null, text: string (title + seller bullets) }
 * Fields with a `prose` reader may also take a value from the maker page's own text (tier official) when no kv row states it.
 * @returns {{ fields: object[], counts: object, status: string }}
 */
function resolveFields(site, src) {
  const fields = [];
  for (const f of site.fields) {
    let value = null;
    let tier = 'none';
    let conflict = null;
    let reason = null;
    // A field may read the maker page as a whole (`officialRule`): it can settle the value from an explicit
    // statement ("5 m body waterproof, 30 m with the case" → 5) or rule the field out for the product ("30 m
    // waterproof with a case" and nothing body-only → veto). Either outranks spec rows, listing and title values.
    const rule = f.officialRule && src.official ? f.officialRule(src.official) : null;
    const veto = rule && rule.veto ? rule.veto : null;
    const off = veto ? { value: null, conflict: null } : rule && rule.value !== undefined && rule.value !== null ? { value: rule.value, conflict: rule.note || null } : officialValue(f, src.official);
    const offVal = off.value;
    const lstVal = veto ? null : firstParsed(listingCandidates(src.listing, f.listing || []), f.parse);
    const titleVal = f.title && !veto ? (typeof f.title === 'function' ? f.title(src.text) : f.parse(src.text)) : null;
    if (veto) conflict = veto;
    // A spec-table value the field marks as weak (e.g. "Pack of: 1" meaning one sales unit) does not outrank a
    // title that states something else; the title value is kept but stays a claim.
    const weakWhy = lstVal !== null && f.weak && titleVal !== null && !same(titleVal, lstVal) ? f.weak(lstVal, titleVal) : null;
    const weakListing = Boolean(weakWhy);
    if (offVal !== null) {
      value = offVal; tier = 'official';
      if (lstVal !== null && !same(lstVal, offVal)) conflict = `Listing states ${f.display(lstVal)}; maker page states ${f.display(offVal)} — maker value used`;
      if (off.conflict) conflict = conflict ? `${off.conflict}. ${conflict}` : off.conflict;
    } else if (lstVal !== null && !weakListing) {
      value = lstVal; tier = 'listing';
    } else if (titleVal !== null) {
      value = titleVal; tier = 'claimed';
      if (weakListing) conflict = `Spec table states ${f.display(lstVal)} (${typeof weakWhy === 'string' ? weakWhy : 'a sales-unit count'}); title states ${f.display(titleVal)} — title used, unverified`;
    }
    if (value !== null && f.plausible) {
      const ok = f.plausible(value);
      if (ok !== true) { reason = typeof ok === 'string' ? ok : 'fails plausibility check'; tier = 'rejected'; }
    }
    const pts = value !== null && (tier === 'official' || tier === 'listing') ? clamp01(f.points ? f.points(value) : 1) : 0;
    fields.push({
      key: f.key, label: f.label, group: f.group, dim: f.dim, weight: f.weight ?? 1,
      value, display: value !== null ? f.display(value) : null, tier, credit: TIER[tier].credit, pts,
      ...(conflict ? { conflict } : {}), ...(reason ? { reason } : {}),
      ...(tier === 'official' && src.official ? { source: src.official.url } : {}),
    });
  }
  const counts = { official: 0, listing: 0, claimed: 0, rejected: 0, none: 0 };
  for (const f of fields) counts[f.tier]++;
  const status = counts.official ? 'official' : counts.listing ? 'listing' : counts.claimed || counts.rejected ? 'claimed' : 'none';
  return { fields, counts, status };
}

const clamp01 = (v) => Math.min(1, Math.max(0, Number(v) || 0));

// Weighted, credit-discounted points over the fields of one dimension → 0–10. Missing fields count 0.
function dimensionScore(fields, dim) {
  const rows = fields.filter((f) => f.dim === dim);
  const wsum = rows.reduce((s, f) => s + f.weight, 0);
  if (!wsum) return 0;
  const got = rows.reduce((s, f) => s + f.weight * f.pts * f.credit, 0);
  return Math.round((got / wsum) * 100) / 10;
}

// Adjectives in seller text that carry no verifiable specification. Shown on the sheet as "unscored claims".
const CLAIM_WORDS = [
  'premium', 'best', 'ultra', 'super', 'pro', 'advanced', 'smart', 'powerful', 'high quality', 'high-quality', 'heavy duty', 'heavy-duty',
  'durable', 'long lasting', 'long-lasting', 'fast', 'rapid', 'quick', 'compact', 'slim', 'lightweight', 'portable', 'stylish', 'elegant',
  'luxury', 'professional', 'salon', 'top rated', 'trending', 'latest', 'new', 'original', 'genuine', 'branded', 'imported', 'export quality',
  'safe', 'safety', 'protection', 'guaranteed', 'certified', 'approved', 'eco friendly', 'eco-friendly', 'unbreakable', 'leak proof', 'leakproof',
  'waterproof', 'shockproof', 'dustproof', 'windproof', 'anti-slip', 'non-slip', 'multi-purpose', 'multipurpose', 'all in one', 'all-in-one',
];
function unscoredClaims(text) {
  const t = String(text || '').toLowerCase();
  const out = [];
  for (const w of CLAIM_WORDS) if (new RegExp(`\\b${w.replace(/[-\s]/g, '[-\\s]?')}\\b`).test(t)) out.push(w);
  return [...new Set(out)].slice(0, 12);
}

module.exports = { TIER, resolveFields, dimensionScore, unscoredClaims, norm };
