import { useEffect, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { clsx } from 'clsx';
import type { Routine } from '../../lib/types';
import { PHASE_ORDER, ROUTINE_CATEGORIES, ROUTINE_CATEGORY_ORDER, ROUTINE_SORTS, type RoutineFilter, type RoutineSortKey } from '../../domain/routines';
import { PhaseBadge } from './PhaseBadge';

interface Props { items: Routine[]; state: RoutineFilter; onToggle: (k: 'categories' | 'phases', v: string) => void; onUpdate: (p: Partial<RoutineFilter>) => void; onClearAll: () => void; activeCount: number; resultCount: number }

/** Airbnb-style category tab row + phase chips + one search/sort line. */
export function RoutineFilters({ items, state, onToggle, onUpdate, onClearAll, activeCount, resultCount }: Props) {
  const [q, setQ] = useState(state.query);
  const [seen, setSeen] = useState(state.query);
  if (state.query !== seen) { setSeen(state.query); setQ(state.query); }
  useEffect(() => { if (q === state.query) return; const t = setTimeout(() => onUpdate({ query: q }), 220); return () => clearTimeout(t); }, [q, state.query, onUpdate]);
  const maxSteps = Math.max(...items.map((r) => r.stepsPerDay));
  const catCount = (c: string) => items.filter((r) => r.category === c).length;
  const phaseCount = (p: string) => items.filter((r) => r.phases.includes(p)).length;
  const tab = (on: boolean) => clsx('press relative flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap px-1 text-[14px] font-bold transition-colors sm:px-2',
    'after:absolute after:inset-x-1 after:-bottom-px after:h-[3px] after:rounded-t-full after:bg-accent after:transition-opacity',
    on ? 'text-display after:opacity-100' : 'text-secondary after:opacity-0 hover:text-display');
  return (
    <div className="space-y-5">
      <div role="group" aria-label="Routine type" className="scrollbar-none -mx-4 flex gap-4 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0">
        <button type="button" aria-pressed={state.categories.length === 0} onClick={() => onUpdate({ categories: [] })} className={tab(state.categories.length === 0)}>
          All <span className="mono text-[12px] text-muted">{items.length}</span>
        </button>
        {ROUTINE_CATEGORY_ORDER.map((c) => {
          const on = state.categories.includes(c);
          return (
            <button key={c} type="button" aria-pressed={on} onClick={() => onToggle('categories', c)} className={tab(on)}>
              {ROUTINE_CATEGORIES[c].label} <span className="mono text-[12px] text-muted">{catCount(c)}</span>
            </button>
          );
        })}
      </div>
      <div>
        <p className="label mb-2">Must include phase · pick any</p>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Phases">
          {PHASE_ORDER.map((p) => <PhaseBadge key={p} phase={p} active={state.phases.includes(p)} count={phaseCount(p)} onClick={() => onToggle('phases', p)} />)}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-[200px] flex-1">
          <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search routine, source or author" className="field h-11 w-full !rounded-full pl-10 pr-9" aria-label="Search routines" />
          {q && <button type="button" onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted hover:bg-raised hover:text-primary" aria-label="Clear search"><X size={14} /></button>}
        </label>
        <label className="flex items-center gap-2">
          <span className="label whitespace-nowrap">Max steps/day</span>
          <input type="range" className="range w-28" min={1} max={maxSteps} value={state.maxSteps ?? maxSteps} aria-label="Maximum steps per day"
            onChange={(e) => onUpdate({ maxSteps: Number(e.target.value) >= maxSteps ? null : Number(e.target.value) })} />
          <span className="mono w-8 text-[13px] font-bold text-display">{state.maxSteps ?? 'Any'}</span>
        </label>
        <label className="relative flex items-center gap-1.5 text-[14px] text-secondary">
          Sorted by
          <select className="appearance-none rounded-full bg-transparent py-1 pl-1 pr-6 font-extrabold text-display" value={state.sort} onChange={(e) => onUpdate({ sort: e.target.value as RoutineSortKey })} aria-label="Sort routines">
            {(Object.keys(ROUTINE_SORTS) as RoutineSortKey[]).map((k) => <option key={k} value={k}>{ROUTINE_SORTS[k].label}</option>)}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-1 text-display" aria-hidden />
        </label>
        <span className="ml-auto text-[14px] text-secondary" aria-live="polite"><span className="mono font-extrabold text-display">{resultCount}</span> of {items.length}</span>
        {activeCount > 0 && <button type="button" className="label !text-accent hover:underline" onClick={onClearAll}>Clear all ({activeCount})</button>}
      </div>
    </div>
  );
}
