import { groupOf, type CategoryIndex } from './index';

export interface FilterState {
  tags: string[];          // selected facet tags, e.g. 'ing:vitamin-c'
  allGroups: string[];     // groups where the selection is matched with AND instead of OR
  priceMax: number | null; // ₹ ceiling
  query: string;           // brand / title text search
}

export const EMPTY_FILTER: FilterState = { tags: [], allGroups: [], priceMax: null, query: '' };

/**
 * Filter semantics (documented in the UI):
 *  - within one facet group, selected tags are OR'ed (unless the group is switched to "match all")
 *  - across groups, results are AND'ed
 *  - price and text search are further AND constraints
 * Returns the matching item positions in index order.
 */
export function applyFilter(idx: CategoryIndex, f: FilterState): Uint32Array {
  const n = idx.items.length;
  let mask: Uint8Array | null = null;

  const byGroup = new Map<string, number[]>();
  for (const tag of f.tags) {
    const pos = idx.tagPos.get(tag);
    if (pos === undefined) { byGroup.set(tag, [-1]); continue; } // unknown tag → matches nothing
    const g = groupOf(tag);
    const list = byGroup.get(g) ?? [];
    list.push(pos);
    byGroup.set(g, list);
  }

  for (const [g, positions] of byGroup) {
    const groupMask = new Uint8Array(n);
    if (positions[0] === -1) { mask = groupMask; break; }
    if (f.allGroups.includes(g) && positions.length > 1) {
      const hits = new Uint8Array(n);
      for (const p of positions) for (const i of idx.postings[p]) hits[i]++;
      for (let i = 0; i < n; i++) if (hits[i] === positions.length) groupMask[i] = 1;
    } else {
      for (const p of positions) for (const i of idx.postings[p]) groupMask[i] = 1;
    }
    if (!mask) mask = groupMask;
    else for (let i = 0; i < n; i++) mask[i] &= groupMask[i];
  }

  const q = f.query.trim().toLowerCase();
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    if (mask && !mask[i]) continue;
    const it = idx.items[i];
    if (f.priceMax !== null && it.p > f.priceMax) continue;
    if (q && !(it.b.toLowerCase().includes(q) || it.m.toLowerCase().includes(q))) continue;
    out.push(i);
  }
  return Uint32Array.from(out);
}

/** Facet counts for a result set, so options show how many listings each would leave. */
export function facetCounts(idx: CategoryIndex, matched: Uint32Array): Uint32Array {
  const counts = new Uint32Array(idx.tagIndex.length);
  for (const i of matched) for (const t of idx.items[i].t) counts[t]++;
  return counts;
}

/**
 * Per-group live counts. For a group that already has selections, its options are counted
 * with that group's own constraint lifted — so OR alternatives never show 0 / disabled.
 */
export function liveCountsByGroup(idx: CategoryIndex, f: FilterState, matched: Uint32Array): { base: Uint32Array; byGroup: Map<string, Uint32Array> } {
  const base = facetCounts(idx, matched);
  const byGroup = new Map<string, Uint32Array>();
  for (const g of new Set(f.tags.map(groupOf))) {
    const without = { ...f, tags: f.tags.filter((t) => groupOf(t) !== g) };
    byGroup.set(g, facetCounts(idx, applyFilter(idx, without)));
  }
  return { base, byGroup };
}
