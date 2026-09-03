import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SORT_KEYS, SORT_STRATEGIES, type SortKey } from '../../domain/sort';
import type { CategoryIndex } from '../../domain/index';

interface Props {
  idx: CategoryIndex; featured: string[]; selected: string[]; live: { base: Uint32Array; byGroup: Map<string, Uint32Array> };
  sort: SortKey; onSort: (k: SortKey) => void; query: string; onQuery: (q: string) => void;
  onToggle: (tag: string) => void; onOpenFilters: () => void; activeCount: number; resultCount: number;
}

/** Search + featured chips (Etsy / Kayak) and an IMDb-style "N results · Sorted by ▾" line. Only tags that exist in the data appear. */
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
      <div className="flex items-center gap-2">
        <label className="relative min-w-0 flex-1">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search brand or product" className="field h-12 w-full !rounded-full pl-11 pr-10" aria-label="Search brand or product" />
          {q && <button type="button" onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted hover:bg-raised hover:text-primary" aria-label="Clear search"><X size={14} /></button>}
        </label>
        <button type="button" onClick={onOpenFilters} className="btn h-12 w-12 shrink-0 px-0 lg:hidden" aria-label={`Open filters${activeCount ? ` (${activeCount} active)` : ''}`}>
          <span className="relative"><SlidersHorizontal size={16} />{activeCount > 0 && <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-extrabold text-accent-ink">{activeCount}</span>}</span>
        </button>
      </div>
      {quick.length > 0 && (
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Quick filters">
          {quick.map((tag) => {
            const row = idx.facets[tag.slice(0, tag.indexOf(':'))]?.find((r) => r.tag === tag);
            const on = selected.includes(tag);
            const n = (live.byGroup.get(tag.slice(0, tag.indexOf(':'))) ?? live.base)[idx.tagPos.get(tag)!];
            return (
              <button key={tag} type="button" className="chip shrink-0" aria-pressed={on} onClick={() => onToggle(tag)} disabled={!on && n === 0}>
                {row?.label ?? tag}<span className="chip-count mono">{n.toLocaleString('en-IN')}</span>
              </button>
            );
          })}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <p className="text-[14px] text-secondary" aria-live="polite">
          <span className="mono font-extrabold text-display">{resultCount.toLocaleString('en-IN')}</span> of {idx.items.length.toLocaleString('en-IN')} listings
        </p>
        <label className="relative flex items-center gap-1.5 text-[14px] text-secondary">
          Sorted by
          <select value={sort} onChange={(e) => onSort(e.target.value as SortKey)} className="appearance-none rounded-full bg-transparent py-1 pl-1 pr-6 font-extrabold text-display" aria-label="Sort by">
            {SORT_KEYS.map((k) => <option key={k} value={k}>{SORT_STRATEGIES[k].label}</option>)}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-1 text-display" aria-hidden />
        </label>
      </div>
    </div>
  );
}
