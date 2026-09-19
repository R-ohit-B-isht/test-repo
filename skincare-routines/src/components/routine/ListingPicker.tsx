import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { ProductSnippet } from './ProductSnippet';
import { EvidenceBadge, ScoreBadge } from '../ui/primitives';
import { rupees } from '../../lib/format';
import type { InciStatus } from '../../lib/types';
import { searchListings } from '../../schedule/listingSearch';
import type { StepProduct } from '../../schedule/model';

interface Props {
  product: StepProduct | null;
  category: string | null;
  categoryLabel: (id: string) => string;
  onChange: (product: StepProduct | null) => void;
  /** Search-only use (the caller shows the current pick itself). */
  hideEmpty?: boolean;
}

type Results = { phase: 'loading' } | { phase: 'ready'; items: StepProduct[]; query: string } | { phase: 'error'; message: string };

const isInciStatus = (v: string | null): v is InciStatus => v === 'full' || v === 'partial' || v === 'garbled' || v === 'none';

/** Pin any listing the site ranks to a step. Search covers every page by brand/name (narrowed to the step's category when one
 *  is set); with no query, a category shows its top ranks. "No product" is a first-class state, not a failure. */
export function ListingPicker({ product, category, categoryLabel, onChange, hideEmpty = false }: Props) {
  const [expanded, setOpen] = useState(false);
  const open = expanded || product === null;
  const [query, setQuery] = useState('');
  const [fetched, setResults] = useState<Results>({ phase: 'loading' });
  const idle = !query.trim() && !category;
  const results: Results | { phase: 'idle' } = idle ? { phase: 'idle' } : fetched.phase === 'ready' && fetched.query !== query ? { phase: 'loading' } : fetched;

  useEffect(() => {
    if (!open || idle) return;
    let live = true;
    const t = window.setTimeout(() => {
      setResults({ phase: 'loading' });
      searchListings(query, category).then(
        (items) => { if (live) setResults({ phase: 'ready', items, query }); },
        (e: unknown) => { if (live) setResults({ phase: 'error', message: e instanceof Error ? e.message : 'Search failed' }); },
      );
    }, query.trim() ? 180 : 0);
    return () => { live = false; window.clearTimeout(t); };
  }, [open, idle, query, category]);

  return (
    <div className="space-y-2">
      {product ? (
        <>
          <ProductSnippet product={product} categoryLabel={categoryLabel} />
          <div className="flex flex-wrap gap-1.5">
            <button type="button" className="btn h-9" aria-expanded={open} onClick={() => setOpen((o) => !o)}><Search size={13} aria-hidden />{open ? 'Hide search' : 'Swap listing'}</button>
            <button type="button" className="btn h-9" onClick={() => onChange(null)}><X size={13} aria-hidden />No product</button>
          </div>
        </>
      ) : hideEmpty ? null : (
        <p className="rounded-[12px] border border-dashed border-line-strong px-3 py-2 text-[12.5px] text-secondary">No product pinned — the step stays on the plan as a reminder. Pick one below, or leave it.</p>
      )}
      {open && (
        <div className="rounded-[12px] border border-line bg-surface p-2.5">
          <label className="relative block">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
            <input className="field w-full pl-9" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off"
              placeholder={category ? `Search ${categoryLabel(category)} by brand or name…` : 'Search every page by brand or name…'} aria-label="Search listings" />
          </label>
          <div className="mt-2" aria-live="polite">
            {results.phase === 'idle' && <p className="px-1 text-[12px] text-muted">Type a brand or product name — results come from the site's ranked pages only.</p>}
            {results.phase === 'loading' && <p className="px-1 text-[12px] text-muted">Searching…</p>}
            {results.phase === 'error' && <p className="px-1 text-[12px] font-semibold text-danger" role="alert">{results.message}</p>}
            {results.phase === 'ready' && results.items.length === 0 && (
              <p className="px-1 text-[12px] text-secondary">Nothing ranked matches “{results.query}”{category ? ` in ${categoryLabel(category)}` : ''}. Try fewer words{category ? ', or clear the category to search every page' : ''}.</p>
            )}
            {results.phase === 'ready' && results.items.length > 0 && (
              <ul className="max-h-72 space-y-1 overflow-y-auto" aria-label="Matching listings">
                {!results.query.trim() && category && <li className="label px-1 pb-1">Top of {categoryLabel(category)}</li>}
                {results.items.map((p) => (
                  <li key={`${p.category}:${p.id}`}>
                    <button type="button" aria-pressed={product?.id === p.id && product.category === p.category}
                      className="press flex w-full items-center gap-2.5 rounded-[10px] px-2 py-2 text-left hover:bg-raised aria-pressed:bg-accent-soft/60"
                      onClick={() => { onChange(p); setOpen(false); setQuery(''); }}>
                      {p.score != null ? <ScoreBadge score={p.score} showVerdict={false} /> : <span className="score" aria-label="Unscored">—</span>}
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-[13px] font-bold leading-snug text-display">{p.brand ? `${p.brand} · ` : ''}{p.title}</span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-secondary">
                          {isInciStatus(p.inciStatus) && <EvidenceBadge status={p.inciStatus} />}
                          {p.rank != null && <span>#{p.rank}{p.of != null ? ` of ${p.of.toLocaleString('en-IN')}` : ''}{!category ? ` in ${categoryLabel(p.category)}` : ''}</span>}
                          {p.priceInr != null && <span>{rupees(p.priceInr)}</span>}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
