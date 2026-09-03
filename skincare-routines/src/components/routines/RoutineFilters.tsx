import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { clsx } from 'clsx';
import type { Routine } from '../../lib/types';
import { PHASE_ORDER, ROUTINE_CATEGORIES, ROUTINE_CATEGORY_ORDER, ROUTINE_SORTS, type RoutineFilter, type RoutineSortKey } from '../../domain/routines';
import { PhaseBadge } from './PhaseBadge';

interface Props { items: Routine[]; state: RoutineFilter; onToggle: (k: 'categories' | 'phases', v: string) => void; onUpdate: (p: Partial<RoutineFilter>) => void; onClearAll: () => void; activeCount: number; resultCount: number }

export function RoutineFilters({ items, state, onToggle, onUpdate, onClearAll, activeCount, resultCount }: Props) {
  const [q, setQ] = useState(state.query);
  const [seen, setSeen] = useState(state.query);
  if (state.query !== seen) { setSeen(state.query); setQ(state.query); }
  useEffect(() => { if (q === state.query) return; const t = setTimeout(() => onUpdate({ query: q }), 220); return () => clearTimeout(t); }, [q, state.query, onUpdate]);
  const maxSteps = Math.max(...items.map((r) => r.stepsPerDay));
  const catCount = (c: string) => items.filter((r) => r.category === c).length;
  const phaseCount = (p: string) => items.filter((r) => r.phases.includes(p)).length;
  return (
    <div className="space-y-4">
      <div role="group" aria-label="Routine type" className="scrollbar-thin -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        <button type="button" aria-pressed={state.categories.length === 0} onClick={() => onUpdate({ categories: [] })}
          className={clsx('press label h-10 shrink-0 rounded border px-3 transition-colors', state.categories.length === 0 ? 'border-primary bg-primary !text-black' : 'border-line-strong hover:border-secondary')}>All</button>
        {ROUTINE_CATEGORY_ORDER.map((c) => {
          const on = state.categories.includes(c);
          return (
            <button key={c} type="button" aria-pressed={on} onClick={() => onToggle('categories', c)}
              className={clsx('press label h-10 shrink-0 rounded border px-3 transition-colors', on ? 'border-primary bg-primary !text-black' : 'border-line-strong hover:border-secondary')}>
              {ROUTINE_CATEGORIES[c].label} <span className="text-muted">{catCount(c)}</span>
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
        <label className="relative min-w-[180px] flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search routine, source or author" className="field w-full pl-9 pr-8" aria-label="Search routines" />
          {q && <button type="button" onClick={() => setQ('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-primary" aria-label="Clear search"><X size={14} /></button>}
        </label>
        <label className="flex items-center gap-2">
          <span className="label whitespace-nowrap">Max steps/day</span>
          <input type="range" className="range w-32" min={1} max={maxSteps} value={state.maxSteps ?? maxSteps} aria-label="Maximum steps per day"
            onChange={(e) => onUpdate({ maxSteps: Number(e.target.value) >= maxSteps ? null : Number(e.target.value) })} />
          <span className="mono w-8 text-[12px] text-primary">{state.maxSteps ?? 'Any'}</span>
        </label>
        <label className="flex items-center gap-2">
          <span className="label">Sort</span>
          <select className="field" value={state.sort} onChange={(e) => onUpdate({ sort: e.target.value as RoutineSortKey })} aria-label="Sort routines">
            {(Object.keys(ROUTINE_SORTS) as RoutineSortKey[]).map((k) => <option key={k} value={k}>{ROUTINE_SORTS[k].label}</option>)}
          </select>
        </label>
        <span className="mono ml-auto text-[12px] text-secondary" aria-live="polite">{resultCount} of {items.length}</span>
        {activeCount > 0 && <button type="button" className="label hover:text-primary" onClick={onClearAll}>Clear all ({activeCount})</button>}
      </div>
    </div>
  );
}
