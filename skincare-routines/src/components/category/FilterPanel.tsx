import { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { clsx } from 'clsx';
import type { FacetGroupDef, FacetRow } from '../../lib/types';
import type { CategoryIndex } from '../../domain/index';
import type { ViewState } from '../../state/useFilterState';
import { rupees } from '../../lib/format';

interface Props {
  idx: CategoryIndex;
  groups: Record<string, FacetGroupDef>;
  order: string[];
  live: { base: Uint32Array; byGroup: Map<string, Uint32Array> };
  state: ViewState;
  onToggle: (tag: string) => void;
  onToggleAll: (group: string) => void;
  onClearGroup: (group: string) => void;
  onPrice: (max: number | null) => void;
}

const HIDDEN = new Set(['scope']); // scope has its own segmented control above the list
const OPEN_BY_DEFAULT = new Set(['format', 'ing', 'claim', 'spf', 'sun', 'step']);
const SHOW_LIMIT = 8;

/** Multi-select facet panel. OR within a group (switchable to "match all" for ingredients / free-from), AND across groups. */
export function FilterPanel({ idx, groups, order, live, state, onToggle, onToggleAll, onClearGroup, onPrice }: Props) {
  const priceCap = Math.ceil(idx.priceMax / 100) * 100;
  return (
    <div className="space-y-2">
      <PriceFacet cap={priceCap} value={state.priceMax} onChange={onPrice} />
      {order.filter((g) => !HIDDEN.has(g) && idx.facets[g]?.length).map((g) => (
        <FacetGroup key={g} id={g} def={groups[g]} rows={idx.facets[g]} idx={idx} liveCounts={live.byGroup.get(g) ?? live.base} state={state}
          onToggle={onToggle} onToggleAll={onToggleAll} onClear={onClearGroup} />
      ))}
    </div>
  );
}

function PriceFacet({ cap, value, onChange }: { cap: number; value: number | null; onChange: (v: number | null) => void }) {
  const v = value ?? cap;
  return (
    <section className="card p-4">
      <div className="flex items-center justify-between">
        <h3 className="label">Price ceiling</h3>
        <span className="mono text-[12px] text-primary">{value === null ? 'Any' : `≤ ${rupees(v)}`}</span>
      </div>
      <input type="range" className="range mt-2" min={100} max={cap} step={50} value={v} aria-label="Maximum price"
        onChange={(e) => onChange(Number(e.target.value) >= cap ? null : Number(e.target.value))} />
      <p className="mt-1 text-[11px] text-muted">Price is a filter only — it never affects the score.</p>
    </section>
  );
}

interface GroupProps {
  id: string; def: FacetGroupDef; rows: FacetRow[]; idx: CategoryIndex; liveCounts: Uint32Array; state: ViewState;
  onToggle: (tag: string) => void; onToggleAll: (g: string) => void; onClear: (g: string) => void;
}

function FacetGroup({ id, def, rows, idx, liveCounts, state, onToggle, onToggleAll, onClear }: GroupProps) {
  const [open, setOpen] = useState(OPEN_BY_DEFAULT.has(id));
  const [showAll, setShowAll] = useState(false);
  const [q, setQ] = useState('');
  const selected = state.tags.filter((t) => t.startsWith(id + ':'));
  const matchAll = state.allGroups.includes(id);
  const searchable = rows.length > 12;
  const visibleRows = rows.filter((r) => !q || r.label.toLowerCase().includes(q.toLowerCase()));
  const shown = showAll || q ? visibleRows : visibleRows.slice(0, SHOW_LIMIT);
  return (
    <section className="card">
      <button type="button" className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={`facet-${id}`}>
        <span>
          <span className="label !text-primary">{def.label}</span>
          {selected.length > 0 && <span className="mono ml-2 rounded-full bg-primary px-1.5 text-[10px] text-black">{selected.length}</span>}
          <span className="mt-0.5 block text-[11px] text-muted">{def.hint}</span>
        </span>
        <ChevronDown size={16} className={clsx('shrink-0 text-muted transition-transform duration-200', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <div id={`facet-${id}`} className="border-t border-line px-4 pb-4 pt-3">
          {(searchable || def.mode === 'and') && (
            <div className="mb-3 flex items-center gap-2">
              {searchable && (
                <label className="relative flex-1">
                  <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${def.label.toLowerCase()}`} className="field h-8 w-full pl-7 text-[11px]" aria-label={`Search ${def.label}`} />
                </label>
              )}
              {def.mode === 'and' && (
                <button type="button" aria-pressed={matchAll} onClick={() => onToggleAll(id)} title="Require every selected item instead of any"
                  className={clsx('label h-8 shrink-0 rounded border px-2 transition-colors', matchAll ? 'border-primary bg-primary !text-black' : 'border-line-strong')}>
                  {matchAll ? 'Match all' : 'Match any'}
                </button>
              )}
            </div>
          )}
          <ul className="space-y-0.5">
            {shown.map((r) => {
              const pos = idx.tagPos.get(r.tag)!;
              const live = liveCounts[pos];
              const on = selected.includes(r.tag);
              return (
                <li key={r.tag}>
                  <button type="button" role="checkbox" aria-checked={on} onClick={() => onToggle(r.tag)} disabled={!on && live === 0}
                    className={clsx('press flex w-full items-center gap-2.5 rounded px-1.5 py-1.5 text-left text-[13px] transition-colors hover:bg-raised disabled:cursor-not-allowed disabled:opacity-40', on && 'text-display')}>
                    <span className={clsx('flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border', on ? 'border-primary bg-primary' : 'border-line-strong')} aria-hidden>
                      {on && <span className="h-2 w-2 bg-black" />}
                    </span>
                    <span className="flex-1 truncate">{r.label}</span>
                    <span className="mono text-[11px] text-muted tabular-nums">{live.toLocaleString('en-IN')}</span>
                  </button>
                </li>
              );
            })}
            {!shown.length && <li className="px-1.5 py-1 text-[12px] text-muted">No match in this group.</li>}
          </ul>
          <div className="mt-2 flex items-center justify-between">
            {visibleRows.length > SHOW_LIMIT && !q ? (
              <button type="button" className="label hover:text-primary" onClick={() => setShowAll((s) => !s)}>{showAll ? 'Show fewer' : `Show all ${visibleRows.length}`}</button>
            ) : <span />}
            {selected.length > 0 && <button type="button" className="label hover:text-primary" onClick={() => onClear(id)}>Clear</button>}
          </div>
        </div>
      )}
    </section>
  );
}
