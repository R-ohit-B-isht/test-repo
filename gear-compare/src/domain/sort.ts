import type { ProductRow } from '../lib/types';

export type SortKey = 'score' | 'specs' | 'safety' | 'maker' | 'buyers' | 'verified' | 'rating' | 'reviews' | 'priceAsc' | 'priceDesc';

type Cmp = (a: ProductRow, b: ProductRow) => number;

const byScore: Cmp = (a, b) => b.s - a.s || a.p - b.p;
const byDim = (k: keyof ProductRow['sc']): Cmp => (a, b) => b.sc[k] - a.sc[k] || byScore(a, b);

/** Strategy pattern: one comparator per sort option; price never feeds the score itself. */
export const SORT_STRATEGIES: Record<SortKey, { label: string; hint: string; cmp: Cmp }> = {
  score: { label: 'Overall score', hint: 'Weighted total of the four dimensions', cmp: byScore },
  specs: { label: 'Verified specs', hint: 'Specification fields a maker page or spec table actually states', cmp: byDim('specs') },
  safety: { label: 'Protection & certification', hint: 'Named protections and safety registrations', cmp: byDim('safety') },
  maker: { label: 'Maker & warranty', hint: 'Accountable manufacturer + stated warranty', cmp: byDim('maker') },
  buyers: { label: 'Buyer evidence', hint: 'Real star rating and review depth, bounded', cmp: byDim('buyers') },
  verified: { label: 'Most maker-verified fields', hint: 'Fields read on the maker’s own product page, then spec-table fields', cmp: (a, b) => b.vf - a.vf || b.sf - a.sf || byScore(a, b) },
  rating: { label: 'Buyer rating', hint: 'Stars first, review count breaks ties', cmp: (a, b) => (b.r ?? -1) - (a.r ?? -1) || (b.rc ?? 0) - (a.rc ?? 0) || byScore(a, b) },
  reviews: { label: 'Most reviewed', hint: 'Review count, unrated last', cmp: (a, b) => (b.rc ?? 0) - (a.rc ?? 0) || byScore(a, b) },
  priceAsc: { label: 'Price: low → high', hint: 'Price never affects the score itself', cmp: (a, b) => a.p - b.p || byScore(a, b) },
  priceDesc: { label: 'Price: high → low', hint: 'Price never affects the score itself', cmp: (a, b) => b.p - a.p || byScore(a, b) },
};

export const SORT_KEYS = Object.keys(SORT_STRATEGIES) as SortKey[];

export interface SortOption { value: SortKey; label: string; hint: string }
export const SORT_OPTIONS: SortOption[] = SORT_KEYS.map((k) => ({ value: k, label: SORT_STRATEGIES[k].label, hint: SORT_STRATEGIES[k].hint }));

export const isSortKey = (s: string | null): s is SortKey => !!s && s in SORT_STRATEGIES;

export function sortPositions(items: ProductRow[], positions: Uint32Array, key: SortKey): Uint32Array {
  const cmp = SORT_STRATEGIES[key].cmp;
  const arr = Array.from(positions);
  arr.sort((x, y) => cmp(items[x], items[y]));
  return Uint32Array.from(arr);
}
