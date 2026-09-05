// Evidence-first scorer shared by every site generator.
//   specs   → verified technical specification (official page full credit, marketplace spec table 60%, title 0)
//   safety  → verified protection / certification / safety features, same tiers
//   maker   → accountable manufacturer (verified corporate identity) + verified warranty
//   buyers  → real marketplace rating × review depth, bounded so it can only support a score
// Seller adjectives ("premium", "heavy duty", "100% safe") are worth exactly 0.
const { resolveFields, dimensionScore, unscoredClaims } = require('./evidence.cjs');
const { makerOf } = require('./makers.cjs');

const r1 = (v) => Math.round(v * 10) / 10;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// rating "4.3", count "7,725" → 0–10. No rating = 0 (unknown, not neutral).
function buyerEvidence(rating, ratingCount) {
  const r = rating ? Number(rating) : null;
  const parsed = ratingCount ? parseInt(String(ratingCount).replace(/[^\d]/g, ''), 10) : 0;
  const n = Number.isFinite(parsed) ? parsed : 0;
  if (!r || !Number.isFinite(r)) return { score: 0, note: 'No buyer ratings yet' };
  const depth = clamp(Math.log10(n + 1) * 1.4, 0, 5.0);
  const quality = clamp((r - 3.4) * 3.2, 0, 5.0);
  return { score: r1(depth + quality), note: `${r}★ from ${n.toLocaleString('en-IN')} ratings` };
}

// Warranty credit on top of maker identity: verified on the maker's page counts in full, a marketplace
// warranty field at 60%, a title claim ("1 year warranty") 0.
function warrantyCredit(fields) {
  const w = fields.find((f) => f.key === 'warranty');
  if (!w || w.value === null || w.credit === 0) return { pts: 0, note: w && w.value !== null ? `Warranty ${w.display} only claimed in seller text — not credited` : 'Warranty not stated' };
  const base = w.value >= 24 ? 2.5 : w.value >= 12 ? 2 : w.value >= 6 ? 1 : 0.5;
  return { pts: r1(base * w.credit), note: `${w.display} warranty (${w.tier === 'official' ? 'maker page' : 'marketplace spec table'})` };
}

/**
 * @param {object} site   site schema
 * @param {object} rec    { brand, title, rating, ratingCount, sellerText, listingKv, official }
 */
function scoreProduct(site, rec) {
  const maker = makerOf(rec.brand);
  const text = [rec.title, ...(rec.sellerText || [])].join('\n');
  const ev = resolveFields(site, { official: rec.official || null, listing: rec.listingKv || null, text });
  const warranty = warrantyCredit(ev.fields);
  const buyers = buyerEvidence(rec.rating, rec.ratingCount);
  const scores = {
    specs: dimensionScore(ev.fields, 'specs'),
    safety: dimensionScore(ev.fields, 'safety'),
    maker: r1(clamp(maker.pts + warranty.pts, 0, 10)),
    buyers: buyers.score,
  };
  const evidence = {
    status: ev.status,
    official: rec.official ? { url: rec.official.url, title: rec.official.title, matchScore: rec.official.matchScore, region: rec.official.region, fetchedAt: rec.official.fetchedAt } : null,
    fields: ev.fields.map(({ weight: _w, pts, credit, ...f }) => ({ ...f, credited: Math.round(pts * credit * 100) })),
    counts: ev.counts,
    claims: unscoredClaims(text),
    maker: { ...maker, warranty: warranty.note },
    buyers: buyers.note,
  };
  return { scores, evidence };
}

const STATUS_LABEL = {
  official: 'Specifications verified on the manufacturer’s product page',
  listing: 'Specifications from the marketplace spec table only — stated by the seller, not maker-verified (credited at 60%)',
  claimed: 'Only title / seller-text claims — nothing verifiable, specs unscored',
  none: 'No specifications published anywhere we could read — specs unscored',
};

module.exports = { scoreProduct, buyerEvidence, STATUS_LABEL };
