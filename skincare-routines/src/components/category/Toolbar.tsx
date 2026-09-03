import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SORT_KEYS, SORT_STRATEGIES, type SortKey } from '../../domain/sort';
import type { CategoryIndex } from '../../domain/index';

interface Props {
  idx: CategoryIndex; featured: string[]; selected: string[]; live: { base: Uint32Array; byGroup: Map<string, Uint32Array> };
  sort: SortKey; onSort: (k: SortKey) => void; query: string; onQuery: (q: string) => void;
  onToggle: (tag: string) => void; onOpenFilters: () => void; activeCount: number; resultCount: number;
}

/** Featured category-specific quick filters (only tags that exist in the data), search, sort, and the mobile filter button. */
export function Toolbar({ idx, featured, selected, live, sort, onSort, query, onQuery, onToggle, onOpenFilters, activeCount, resultCount }: Props) {
  const [q, setQ] = useState(query);
  const [seen, setSeen] = useState(query);
  if (query !== seen) { setSeen(query); setQ(query); }
  useEffect(() => {
    if (q === query) return;
    const t = setTimeout(() => onQuery(q), 220);
    return () => clearTimeout(t);
  }, [q, query, onQuery]);
  const quick = featured.filter((tag) => idx.tagPos.has(tag) && !tag.startsWith('scope:'));
  return (
    <div className="space-y-3">
      {quick.length > 0 && (
        <div className="scrollbar-thin -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Quick filters">
          {quick.map((tag) => {
            const row = idx.facets[tag.slice(0, tag.indexOf(':'))]?.find((r) => r.tag === tag);
            const on = selected.includes(tag);
            const n = (live.byGroup.get(tag.slice(0, tag.indexOf(':'))) ?? live.base)[idx.tagPos.get(tag)!];
            return (
              <button key={tag} type="button" className="chip shrink-0" aria-pressed={on} onClick={() => onToggle(tag)} disabled={!on && n === 0}>
                {row?.label ?? tag}<span className="chip-count tabular-nums">{n.toLocaleString('en-IN')}</span>
              </button>
            );
          })}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative flex-1 min-w-[180px]">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search brand or product" className="field w-full pl-9 pr-8" aria-label="Search brand or product" />
          {q && <button type="button" onClick={() => setQ('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-primary" aria-label="Clear search"><X size={14} /></button>}
        </label>
        <label className="flex items-center gap-2">
          <span className="label">Sort</span>
          <select value={sort} onChange={(e) => onSort(e.target.value as SortKey)} className="field" aria-label="Sort by">
            {SORT_KEYS.map((k) => <option key={k} value={k}>{SORT_STRATEGIES[k].label}</option>)}
          </select>
        </label>
        <button type="button" onClick={onOpenFilters} className="btn lg:hidden" aria-label="Open filters">
          <SlidersHorizontal size={14} />Filters{activeCount > 0 && <span className="rounded-full bg-primary px-1.5 text-[10px] text-black">{activeCount}</span>}
        </button>
        <span className="mono ml-auto text-[12px] text-secondary tabular-nums" aria-live="polite">{resultCount.toLocaleString('en-IN')} of {idx.items.length.toLocaleString('en-IN')}</span>
      </div>
    </div>
  );
}
