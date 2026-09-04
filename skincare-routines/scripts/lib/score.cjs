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

// inci: { text, source } | null   — source is a human label of where the list was read
function scoreProduct({ category, brand, rating, ratingCount, inci }) {
  const maker = makerOf(brand);
  const cls = inci && inci.text ? classify(inci.text, { category }) : { status: 'none', tokens: [], known: [] };
  const verified = cls.status === 'full';
  const formula = verified ? formulaScore(category, cls.known) : null;
  const safety = verified ? safetyScore(category, cls.known, cls.tokens) : null;
  const transparency = verified ? 2.0 : cls.status === 'partial' ? 0.3 : 0;
  const conf = DECLARATION_CONFIDENCE[maker.kind];
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
  partial: 'Only a seller-chosen "key ingredients" line — not a full INCI list, so formula and safety are unscored (0)',
  garbled: 'Ingredient text on the listing is unreadable / marketing copy — treated as not published (0)',
  none: 'No ingredient list published on the listing — formula and safety unscored (0)',
};

module.exports = { scoreProduct, buyerEvidence, INCI_LABEL };
