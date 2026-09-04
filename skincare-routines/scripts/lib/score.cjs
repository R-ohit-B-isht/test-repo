// Evidence-first product scorer shared by every category generator.
//   ingredients → formula: evidence-graded actives on the VERIFIED INCI list (0 when no list is published)
//   skin        → safety: named irritants/allergens on the VERIFIED INCI list (0 when no list is published)
//   trust       → maker accountability (parent company verified) + ingredient transparency
//   experience  → buyer evidence: marketplace rating × review depth (small weight, never a quality proxy)
// Seller adjectives ("dermatologically tested", "paraben-free", "natural", "brightening") are worth exactly 0.
const { classify } = require('./inci.cjs');
const { formulaScore, safetyScore } = require('./inci-score.cjs');
const { makerOf } = require('./makers.cjs');

const r1 = (v) => Math.round(v * 10) / 10;
const r2 = (v) => Math.round(v * 100) / 100;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// rating "4.3", count "7,725" → 0–10. No rating = 0 (unknown, not neutral).
function buyerEvidence(rating, ratingCount) {
  const r = rating ? Number(rating) : null;
  const parsed = ratingCount ? parseInt(String(ratingCount).replace(/[^\d]/g, ''), 10) : 0;
  const n = Number.isFinite(parsed) ? parsed : 0;
  if (!r || !Number.isFinite(r)) return { score: 0, note: 'No buyer ratings yet' };
  const depth = clamp(Math.log10(n + 1) * 1.4, 0, 5.0);      // 10 ratings ≈ 1.5, 1 000 ≈ 4.2, 10 000+ = 5
  const quality = clamp((r - 3.4) * 3.2, 0, 5.0);            // 4.0★ ≈ 1.9, 4.5★ ≈ 3.5, 4.96★ = 5
  return { score: r1(depth + quality), note: `${r}★ from ${n.toLocaleString('en-IN')} ratings` };
}

// How much an INCI declaration can be relied on: a list published under an identifiable, accountable
// manufacturer (regulated, recallable) counts in full; one pasted under an unidentifiable brand is discounted.
// Only ever a discount — nothing can raise a declaration above what the list itself supports.
const DECLARATION_CONFIDENCE = { pharma: 1.0, global: 1.0, india: 1.0, d2c: 0.9, unknown: 0.7 };

// Where the declaration was read. The listing and the maker's own site are first-party declarations; a
// third-party database (user-uploaded label transcriptions) is not, so it is discounted and earns less
// transparency credit — the brand did not publish it where the buyer shops.
const SOURCE_KINDS = {
  listing: { confidence: 1.0, transparency: 2.0, label: 'marketplace listing' },
  'brand-site': { confidence: 1.0, transparency: 2.0, label: 'official brand website' },
  secondary: { confidence: 0.9, transparency: 1.0, label: 'third-party ingredient database' },
};

// inci: { text, source, kind?, url?, region?, matchedTitle?, matchScore? } | null
//   source: human label of where the list was read; kind: key of SOURCE_KINDS (default 'listing');
//   url / matchedTitle / matchScore: provenance of an external (non-listing) declaration.
function scoreProduct({ category, brand, rating, ratingCount, inci }) {
  const maker = makerOf(brand);
  const cls = inci && inci.text ? classify(inci.text, { category }) : { status: 'none', tokens: [], known: [] };
  const verified = cls.status === 'full';
  const formula = verified ? formulaScore(category, cls.known) : null;
  const safety = verified ? safetyScore(category, cls.known, cls.tokens) : null;
  const src = SOURCE_KINDS[(inci && inci.kind) || 'listing'] || SOURCE_KINDS.listing;
  const transparency = verified ? src.transparency : cls.status === 'partial' ? 0.3 : 0;
  const conf = r2(DECLARATION_CONFIDENCE[maker.kind] * src.confidence);
  const buyers = buyerEvidence(rating, ratingCount);
  const scores = {
    ingredients: formula ? r1(formula.score * conf) : 0,
    skin: safety ? r1(safety.score * conf) : 0,
    trust: r1(clamp(maker.pts + transparency, 0, 10)),
    experience: buyers.score,
  };
  const evidence = {
    inci: cls.status,                                   // full | partial | garbled | none
    inciSource: inci && inci.text ? inci.source : null,
    inciSourceKind: inci && inci.text ? (inci.kind || 'listing') : null,
    inciSourceUrl: inci && inci.text && inci.url ? inci.url : null,
    inciSourceRegion: inci && inci.text && inci.region ? inci.region : null,
    inciMatchedTitle: inci && inci.text && inci.matchedTitle ? inci.matchedTitle : null,
    inciMatchScore: inci && inci.text && inci.matchScore != null ? inci.matchScore : null,
    inciText: verified ? inci.text : null,
    inciUnverified: !verified && inci && inci.text ? inci.text.slice(0, 400) : null,
    inciNote: cls.reason || null,                       // why a present list was not scored (combo listing, corrupt text)
    declarationConfidence: verified ? conf : null,
    recognised: cls.recognised ?? null,
    actives: formula ? formula.actives : [],
    support: formula ? formula.support : [],
    formulaNotes: formula ? formula.notes : [],
    flags: safety ? safety.flags : [],
    maker,
    buyers: buyers.note,
  };
  return { scores, evidence };
}

const INCI_LABEL = {
  full: 'Full INCI list published on the listing — formula and safety scored from it',
  'full:brand-site': 'Full INCI list read from the brand\'s official website (not printed on the listing) — formula and safety scored from it',
  'full:secondary': 'Full INCI list read from a third-party ingredient database (not on the listing or brand site) — scored with a 10% confidence discount',
  partial: 'Only a seller-chosen "key ingredients" line — not a full INCI list, so formula and safety are unscored (0)',
  garbled: 'Ingredient text on the listing is unreadable / marketing copy — treated as not published (0)',
  none: 'No ingredient list published on the listing — formula and safety unscored (0)',
};

module.exports = { scoreProduct, buyerEvidence, INCI_LABEL, SOURCE_KINDS };
