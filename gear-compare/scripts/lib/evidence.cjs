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

// Official kv tables use the maker's own labels; candidates are every entry whose normalised key equals, then
// contains, a declared label — in label order. The first candidate the field parser accepts wins.
function officialCandidates(kv, labels) {
  if (!kv) return [];
  const entries = Object.entries(kv).filter(([, v]) => String(v).trim() && !EMPTY.test(String(v).trim()));
  const out = [];
  for (const l of labels) {
    const n = norm(l);
    for (const [k, v] of entries) if (norm(k) === n && !out.includes(v)) out.push(v);
    for (const [k, v] of entries) if (norm(k).includes(n) && !out.includes(v)) out.push(v);
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

const same = (a, b) => (Array.isArray(a) ? JSON.stringify([...a].sort()) === JSON.stringify([...(b || [])].sort()) : a === b);

/**
 * @param {object} site        site schema (fields, ...)
 * @param {object} src         { official: {kv,url,title,matchScore,region,fetchedAt} | null, listing: kv | null, text: string (title + seller bullets) }
 * @returns {{ fields: object[], counts: object, status: string }}
 */
function resolveFields(site, src) {
  const fields = [];
  for (const f of site.fields) {
    let value = null;
    let tier = 'none';
    let conflict = null;
    let reason = null;
    const offVal = src.official ? firstParsed(officialCandidates(src.official.kv, f.official || [f.label]), f.parse) : null;
    const lstVal = firstParsed(listingCandidates(src.listing, f.listing || []), f.parse);
    if (offVal !== null) {
      value = offVal; tier = 'official';
      if (lstVal !== null && !same(lstVal, offVal)) conflict = `Listing states ${f.display(lstVal)}; maker page states ${f.display(offVal)} — maker value used`;
    } else if (lstVal !== null) {
      value = lstVal; tier = 'listing';
    } else if (f.title) {
      const tv = f.parse(src.text);
      if (tv !== null) { value = tv; tier = 'claimed'; }
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
