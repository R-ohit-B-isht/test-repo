import type { CategoryData, FacetRow, PlaceTag, ProductRow, ScopeGroup } from '../lib/types';

/** Inverted index: tag → sorted item positions. Built once per category load. */
export interface CategoryIndex {
  id: string;
  items: ProductRow[];
  tagIndex: string[];
  tagPos: Map<string, number>;
  postings: Uint32Array[];
  facets: Record<string, FacetRow[]>;
  priceMax: number;
  brands: string[];
  rank: Uint32Array; // 1-based overall rank per position (score desc, then price asc)
}

export function buildIndex(data: CategoryData): CategoryIndex {
  const n = data.items.length;
  const counts = new Uint32Array(data.tagIndex.length);
  for (const it of data.items) for (const t of it.t) counts[t]++;
  const postings = Array.from(counts, (c) => new Uint32Array(c));
  const fill = new Uint32Array(data.tagIndex.length);
  for (let i = 0; i < n; i++) for (const t of data.items[i].t) postings[t][fill[t]++] = i;
  const tagPos = new Map<string, number>();
  data.tagIndex.forEach((tag, i) => tagPos.set(tag, i));
  let priceMax = 0;
  const brandSet = new Set<string>();
  for (const it of data.items) { if (it.p > priceMax) priceMax = it.p; brandSet.add(it.b); }
  const order = Array.from({ length: n }, (_, i) => i).sort((x, y) => data.items[y].s - data.items[x].s || data.items[x].p - data.items[y].p);
  const rank = new Uint32Array(n);
  order.forEach((pos, r) => { rank[pos] = r + 1; });
  return { id: data.id, items: data.items, tagIndex: data.tagIndex, tagPos, postings, facets: data.facets, priceMax, brands: [...brandSet].sort(), rank };
}

export const groupOf = (tag: string) => tag.slice(0, tag.indexOf(':'));

const PLACE_KEYS: Record<ScopeGroup, readonly string[]> = { scope: ['face', 'body', 'both', 'unstated'], area: ['scalp', 'lengths', 'both', 'beard', 'unstated'] };

/** Resolver for a listing's placement tag in the category's configured group (`scope:*` for skincare, `area:*` for hair). */
export function placeResolver(idx: CategoryIndex, group: ScopeGroup): (t: number[]) => PlaceTag {
  const byPos = new Map<number, PlaceTag>();
  for (const k of PLACE_KEYS[group]) { const tag = `${group}:${k}` as PlaceTag; const p = idx.tagPos.get(tag); if (p !== undefined) byPos.set(p, tag); }
  const fallback = `${group}:unstated` as PlaceTag;
  return (t) => { for (const x of t) { const tag = byPos.get(x); if (tag) return tag; } return fallback; };
}
