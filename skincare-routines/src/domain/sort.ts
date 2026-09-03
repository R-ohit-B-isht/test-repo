import type { ProductRow } from '../lib/types';

export type SortKey = 'score' | 'trust' | 'skin' | 'ingredients' | 'experience' | 'rating' | 'reviews' | 'priceAsc' | 'priceDesc';

type Cmp = (a: ProductRow, b: ProductRow) => number;

const byScore: Cmp = (a, b) => b.s - a.s || a.p - b.p;
const byDim = (k: keyof ProductRow['sc']): Cmp => (a, b) => b.sc[k] - a.sc[k] || byScore(a, b);

/** Strategy pattern: one comparator per sort option; price never feeds the score itself. */
export const SORT_STRATEGIES: Record<SortKey, { label: string; cmp: Cmp }> = {
  score: { label: 'Overall score', cmp: byScore },
  trust: { label: 'Brand trust & rating', cmp: byDim('trust') },
  skin: { label: 'Skin safety claims', cmp: byDim('skin') },
  ingredients: { label: 'Actives & ingredients', cmp: byDim('ingredients') },
  experience: { label: 'Format & experience', cmp: byDim('experience') },
  rating: { label: 'Buyer rating', cmp: (a, b) => (b.r ?? -1) - (a.r ?? -1) || (b.rc ?? 0) - (a.rc ?? 0) || byScore(a, b) },
  reviews: { label: 'Most reviewed', cmp: (a, b) => (b.rc ?? 0) - (a.rc ?? 0) || byScore(a, b) },
  priceAsc: { label: 'Price: low → high', cmp: (a, b) => a.p - b.p || byScore(a, b) },
  priceDesc: { label: 'Price: high → low', cmp: (a, b) => b.p - a.p || byScore(a, b) },
};

export const SORT_KEYS = Object.keys(SORT_STRATEGIES) as SortKey[];
export const isSortKey = (s: string | null): s is SortKey => !!s && s in SORT_STRATEGIES;

export function sortPositions(items: ProductRow[], positions: Uint32Array, key: SortKey): Uint32Array {
  const cmp = SORT_STRATEGIES[key].cmp;
  const arr = Array.from(positions);
  arr.sort((x, y) => cmp(items[x], items[y]));
  return Uint32Array.from(arr);
}
