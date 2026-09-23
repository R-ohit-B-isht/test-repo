import { useMemo, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { clsx } from 'clsx';
import type { FacetGroupDef, FacetRow, ProductRow } from '../../lib/types';
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
const OPEN_BY_DEFAULT = new Set(['format', 'ing', 'claim', 'spf', 'sun', 'water', 'step']);
const SHOW_LIMIT = 8;

/** Multi-select facet panel. OR within a group (switchable to "match all" for ingredients / free-from), AND across groups. */
export function FilterPanel({ idx, groups, order, live, state, onToggle, onToggleAll, onClearGroup, onPrice }: Props) {
  const priceCap = Math.ceil(idx.priceMax / 100) * 100;
  return (
    <div className="space-y-2">
      <PriceFacet cap={priceCap} value={state.priceMax} onChange={onPrice} items={idx.items} />
      {order.filter((g) => !HIDDEN.has(g) && idx.facets[g]?.length).map((g) => (
        <FacetGroup key={g} id={g} def={groups[g]} rows={idx.facets[g]} idx={idx} liveCounts={live.byGroup.get(g) ?? live.base} state={state}
          onToggle={onToggle} onToggleAll={onToggleAll} onClear={onClearGroup} />
      ))}
    </div>
  );
}

const BINS = 28;

/** Booking / Airbnb price filter: a real distribution of listing prices sits above the slider so the ceiling is chosen against the data, not blind. */
function PriceFacet({ cap, value, onChange, items }: { cap: number; value: number | null; onChange: (v: number | null) => void; items: ProductRow[] }) {
  const v = value ?? cap;
  const bins = useMemo(() => {
    const b = new Array<number>(BINS).fill(0);
    for (const it of items) b[Math.min(BINS - 1, Math.floor((it.p / cap) * BINS))] += 1;
    const peak = Math.max(1, ...b);
    return b.map((n) => ({ n, h: n === 0 ? 0 : Math.max(8, Math.round((n / peak) * 100)) }));
  }, [items, cap]);
  const under = useMemo(() => (value === null ? items.length : items.reduce((a, it) => a + (it.p <= value ? 1 : 0), 0)), [items, value]);
  return (
    <section className="card p-4">
      <div className="flex items-center justify-between">
        <h3 className="label">Price ceiling</h3>
        <span className="mono text-[13px] font-extrabold text-display">{value === null ? 'Any price' : `≤ ${rupees(v)}`}</span>
      </div>
      <div className="mt-3 flex h-10 items-end gap-px" role="img" aria-label={`Price distribution of ${items.length.toLocaleString('en-IN')} listings, ${under.toLocaleString('en-IN')} at or under the ceiling`}>
        {bins.map((b, i) => {
          const binStart = (i / BINS) * cap;
          const on = binStart < v;
          return <span key={i} className={`flex-1 rounded-t-[2px] transition-colors duration-200 ${on ? 'bg-accent' : 'bg-line-strong'}`} style={{ height: `${b.h}%` }} title={`${rupees(Math.round(binStart))}–${rupees(Math.round(((i + 1) / BINS) * cap))}: ${b.n.toLocaleString('en-IN')}`} />;
        })}
      </div>
      <input type="range" className="range mt-1" min={100} max={cap} step={50} value={v} aria-label="Maximum price" aria-valuetext={value === null ? 'Any price' : `Up to ${rupees(v)}, ${under.toLocaleString('en-IN')} listings`}
        onChange={(e) => onChange(Number(e.target.value) >= cap ? null : Number(e.target.value))} />
      <p className="mt-1 text-[12px] text-muted">{value === null ? 'Price is a filter only — it never affects the score.' : `${under.toLocaleString('en-IN')} listings at or under — price never affects the score.`}</p>
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
          <span className="text-[14px] font-extrabold text-display">{def.label}</span>
          {selected.length > 0 && <span className="mono ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-extrabold text-accent-ink">{selected.length}</span>}
          <span className="mt-0.5 block text-[12px] text-muted">{def.hint}</span>
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
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${def.label.toLowerCase()}`} className="field h-9 w-full pl-8 text-[13px]" aria-label={`Search ${def.label}`} />
                </label>
              )}
              {def.mode === 'and' && (
                <button type="button" aria-pressed={matchAll} onClick={() => onToggleAll(id)} title="Require every selected item instead of any"
                  className={clsx('chip !h-9 shrink-0 !px-3 !text-[12px]')} aria-label={matchAll ? 'Requiring every selected item' : 'Matching any selected item'}>
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
                    className={clsx('press flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[14px] transition-colors hover:bg-raised disabled:cursor-not-allowed disabled:opacity-40', on ? 'font-bold text-display' : 'text-primary')}>
                    <span className={clsx('flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors', on ? 'border-accent bg-accent text-accent-ink' : 'border-line-strong')} aria-hidden>
                      {on && <Check size={12} strokeWidth={3} />}
                    </span>
                    <span className="flex-1 truncate">{r.label}</span>
                    <span className="mono text-[12px] text-muted">{live.toLocaleString('en-IN')}</span>
                  </button>
                </li>
              );
            })}
            {!shown.length && <li className="px-2 py-1 text-[13px] text-muted">No match in this group.</li>}
          </ul>
          <div className="mt-2 flex items-center justify-between">
            {visibleRows.length > SHOW_LIMIT && !q ? (
              <button type="button" className="label !text-accent hover:underline" onClick={() => setShowAll((s) => !s)}>{showAll ? 'Show fewer' : `Show all ${visibleRows.length}`}</button>
            ) : <span />}
            {selected.length > 0 && <button type="button" className="label hover:text-display hover:underline" onClick={() => onClear(id)}>Clear</button>}
          </div>
        </div>
      )}
    </section>
  );
}
