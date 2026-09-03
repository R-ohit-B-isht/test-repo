import { X } from 'lucide-react';
import type { FacetGroupDef } from '../../lib/types';
import type { CategoryIndex } from '../../domain/index';
import type { ViewState } from '../../state/useFilterState';
import { groupOf } from '../../domain/index';
import { rupees } from '../../lib/format';

interface Props { idx: CategoryIndex; groups: Record<string, FacetGroupDef>; state: ViewState; onRemove: (tag: string) => void; onPrice: (v: number | null) => void; onQuery: (q: string) => void; onClearAll: () => void }

/** Everything currently narrowing the list, each removable on its own, plus clear-all. */
export function ActiveChips({ idx, groups, state, onRemove, onPrice, onQuery, onClearAll }: Props) {
  const labelOf = (tag: string) => idx.facets[groupOf(tag)]?.find((r) => r.tag === tag)?.label ?? tag.split(':')[1];
  const chips: { key: string; text: string; onRemove: () => void }[] = [
    ...state.tags.map((tag) => ({ key: tag, text: `${groups[groupOf(tag)]?.label ?? groupOf(tag)}: ${labelOf(tag)}`, onRemove: () => onRemove(tag) })),
  ];
  if (state.priceMax !== null) chips.push({ key: 'price', text: `≤ ${rupees(state.priceMax)}`, onRemove: () => onPrice(null) });
  if (state.query) chips.push({ key: 'q', text: `“${state.query}”`, onRemove: () => onQuery('') });
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
      {chips.map((c) => (
        <button key={c.key} type="button" onClick={c.onRemove} className="chip press !h-8 !border-accent-soft !bg-accent-soft !text-accent" aria-label={`Remove filter ${c.text}`}>
          {c.text}<X size={12} aria-hidden />
        </button>
      ))}
      <button type="button" onClick={onClearAll} className="label press h-8 px-2 hover:text-display hover:underline">Clear all</button>
    </div>
  );
}
