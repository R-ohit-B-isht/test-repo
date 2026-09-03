import { SearchX, X } from 'lucide-react';
import type { FacetGroupDef } from '../../lib/types';
import type { CategoryIndex } from '../../domain/index';
import { groupOf } from '../../domain/index';
import type { ViewState } from '../../state/useFilterState';
import { rupees } from '../../lib/format';

interface Props {
  idx: CategoryIndex; groups: Record<string, FacetGroupDef>; state: ViewState;
  onRemove: (tag: string) => void; onPrice: (v: number | null) => void; onQuery: (q: string) => void; onClearAll: () => void;
}

/** Blinkist / Tasty "no results" recovery: one line of why, then the exact constraints to lift — each removable — and one clear-all. */
export function EmptyResults({ idx, groups, state, onRemove, onPrice, onQuery, onClearAll }: Props) {
  const labelOf = (tag: string) => idx.facets[groupOf(tag)]?.find((r) => r.tag === tag)?.label ?? tag.split(':')[1];
  const constraints: { key: string; text: string; remove: () => void }[] = state.tags.map((tag) => ({
    key: tag, text: `${groups[groupOf(tag)]?.label ?? groupOf(tag)}: ${labelOf(tag)}`, remove: () => onRemove(tag),
  }));
  if (state.priceMax !== null) constraints.push({ key: 'price', text: `Under ${rupees(state.priceMax)}`, remove: () => onPrice(null) });
  if (state.query) constraints.push({ key: 'q', text: `“${state.query}”`, remove: () => onQuery('') });
  return (
    <div className="card fade-in mx-auto my-12 max-w-lg p-8 text-center" role="status">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent" aria-hidden><SearchX size={22} /></span>
      <p className="mt-4 text-[20px] font-extrabold text-display">No listing matches every filter</p>
      <p className="mt-2 text-[14px] text-secondary">
        Nothing in the {idx.items.length.toLocaleString('en-IN')} captured listings fits this combination. Lift one of these:
      </p>
      {constraints.length > 0 && (
        <ul className="mt-5 flex flex-wrap justify-center gap-2" aria-label="Active constraints">
          {constraints.map((c) => (
            <li key={c.key}>
              <button type="button" onClick={c.remove} className="chip press" aria-label={`Remove ${c.text}`}>{c.text}<X size={12} aria-hidden /></button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6 flex justify-center">
        <button type="button" className="btn btn-accent" onClick={onClearAll}>Clear all filters</button>
      </div>
    </div>
  );
}
