/** Shape store records into compact, evidence-preserving objects for the model — twin of chat_api/tools/present.py.
 * Nothing is inferred here: every field is copied from the generated data and uncertainty states are spelled out. */
import type { Benchmark, CategoryMeta, InciSourceKind, InciStatus, ProductDetail } from '../../../lib/types';
import type { Hit } from '../search';
import type { CategoryView } from '../store';
import { categoryUrl, productUrl, type Json, type ToolContext } from './base';

const INCI_STATE: Record<InciStatus, string> = {
  full: 'full INCI list verified — formula and safety are scored',
  partial: 'only a key-ingredients line — formula and safety NOT scored (0)',
  garbled: 'ingredient text on the listing is garbled/unusable — NOT scored (0)',
  none: 'no ingredient list published anywhere we could verify — NOT scored (0)',
};
const INCI_SOURCE: Record<InciSourceKind, string> = {
  listing: 'printed on the marketplace listing itself',
  'brand-site': "read from the brand's official website (exact product matched)",
  secondary: 'third-party ingredient database (labelled as lower-confidence)',
};

export function inciSentence(status: InciStatus, source: InciSourceKind | null | undefined): string {
  let text = INCI_STATE[status] ?? status;
  if (status === 'full' && source) text += `; source: ${INCI_SOURCE[source] ?? source}`;
  return text;
}

export function rowSummary(cat: CategoryView, pos: number, ctx: ToolContext): Json {
  const item = cat.items[pos];
  return {
    id: item.id, category: cat.id, rank: cat.ranks[pos], of: cat.items.length,
    brand: item.b, title: item.m, score: item.s, breakdown: item.sc, priceInr: item.p, quantity: item.q, store: item.st,
    rating: item.r, ratingCount: item.rc,
    inci: inciSentence(item.ev, item.es ?? (item.ev === 'full' ? 'listing' : null)),
    inciStatus: item.ev, inciSourceKind: item.es ?? null,
    tags: cat.tagsOf(item), url: productUrl(ctx, cat.id, item.id),
  };
}

export function hitSummary(hit: Hit, strength: number, ctx: ToolContext, total: number | null): Json {
  return {
    id: hit.id, category: hit.category, rank: hit.rank, of: total, brand: hit.brand, title: hit.title,
    score: hit.score, priceInr: hit.price, store: hit.store,
    inci: inciSentence(hit.inci, hit.inciSource ?? (hit.inci === 'full' ? 'listing' : null)),
    inciStatus: hit.inci, inciSourceKind: hit.inciSource,
    match: Number.isInteger(strength) ? 'exact tokens' : 'partial (prefix) match — confirm with the user',
    url: productUrl(ctx, hit.category, hit.id),
  };
}

const pick = (spec: Record<string, string>, keys: string[]) => Object.fromEntries(keys.filter((k) => k in spec).map((k) => [k, spec[k]]));

export function detailSummary(detail: ProductDetail): Json {
  const ev = detail.evidence;
  const spec = detail.fullSpec ?? {};
  return {
    fullTitle: detail.title, summary: detail.highlight, pros: detail.pros ?? [], cons: detail.cons ?? [],
    buyUrl: detail.buyUrl, buyStore: detail.buyStore,
    evidence: {
      inciStatus: ev.inci, inciStatusMeaning: inciSentence(ev.inci, ev.inciSourceKind),
      inciSource: ev.inciSource, inciSourceKind: ev.inciSourceKind, inciSourceUrl: ev.inciSourceUrl, inciSourceRegion: ev.inciSourceRegion,
      inciMatchedOfficialTitle: ev.inciMatchedTitle, inciMatchScore: ev.inciMatchScore, inciNote: ev.inciNote,
      inciList: ev.inciText, unverifiedIngredientLine: ev.inciUnverified, recognisedIngredients: ev.recognised,
      evidenceActives: ev.actives ?? [], safetyFlags: ev.flags ?? [], formulaNotes: ev.formulaNotes ?? [],
      maker: ev.maker, buyerEvidence: ev.buyers, supportingIngredientsOnInci: ev.support ?? [],
    },
    listingFacts: pick(spec, ['quantity', 'pricePer100', 'format', 'skinType', 'hairType', 'madeIn', 'rating']),
    sellerClaimsShownNotScored: pick(spec, ['keyIngredients', 'freeFrom', 'dermTested', 'nonComedogenic', 'benefit', 'naturalClaim', 'waterResistance']),
  };
}

export function benchmarkSummary(bench: Benchmark, ctx: ToolContext): Json {
  const market = bench.market;
  const out: Json = {
    category: bench.category, brand: bench.brand, name: bench.name, variant: bench.variant,
    role: 'fixed reference ceiling = 100; this is NOT a marketplace listing score and sits outside the ranking',
    why: bench.why, facts: bench.facts ?? [], evidence: bench.evidence ?? [], makerPage: bench.maker, caution: bench.caution,
    marketplaceStatus: market.status, marketplaceNote: market.note,
  };
  if (market.status !== 'not-found') {
    out.marketplaceListing = {
      id: market.id, rank: market.rank, of: market.of, listingScore: market.score, priceInr: market.price, store: market.store,
      title: market.title, inci: market.ev, url: productUrl(ctx, bench.category, market.id),
      identity: market.status === 'found' ? 'exact same product' : 'RELATED listing only — not verified identical',
    };
  }
  return out;
}

export function categorySummary(meta: CategoryMeta, ctx: ToolContext, bench: Benchmark | null): Json {
  return {
    id: meta.id, label: meta.label, zone: meta.zone, step: meta.kicker, blurb: meta.blurb, listings: meta.count,
    byConcern: meta.byConcern ?? {}, stores: meta.stores ?? {},
    referenceCeiling: bench ? `${bench.brand} ${bench.name}` : null, url: categoryUrl(ctx, meta.id),
  };
}
