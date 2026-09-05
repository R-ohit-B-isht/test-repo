import type { CategoryData, FacetRow, ProductRow, SegmentDef } from '../lib/types';

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

/** Resolver for a listing's segment option (e.g. capacity class) from its tag indices; falls back to the `unstated` option. */
export function segmentResolver(idx: CategoryIndex, seg: SegmentDef): (t: number[]) => { id: string; label: string } {
  const byPos = new Map<number, { id: string; label: string }>();
  for (const o of seg.options) { const p = idx.tagPos.get(`${seg.key}:${o.id}`); if (p !== undefined) byPos.set(p, o); }
  const fallback = seg.options.find((o) => o.id === 'unstated') ?? { id: 'unstated', label: 'Not stated' };
  return (t) => { for (const x of t) { const o = byPos.get(x); if (o) return o; } return fallback; };
}
