import { clsx } from 'clsx';
import type { FacetRow, SegmentDef } from '../../lib/types';

interface Props { segment: SegmentDef; rows: FacetRow[]; selected: string[]; onToggle: (tag: string) => void; onClear: () => void }

/** Zillow-style segmented control over the category's own split (capacity class, wattage band …) — multi-select, always visible above the list. Order comes from the site schema; "unstated" is kept as its own segment, never folded in. */
export function SegmentControl({ segment, rows, selected, onToggle, onClear }: Props) {
  const ordered = segment.options.map((o) => rows.find((r) => r.tag === `${segment.key}:${o.id}`)).filter((r): r is FacetRow => !!r);
  if (ordered.length < 2) return null;
  const none = selected.length === 0;
  const cls = 'press flex h-10 shrink-0 items-center gap-2 rounded-full px-3.5 text-[13px] font-bold transition-colors sm:px-4';
  return (
    <div role="group" aria-label={`${segment.label}, read from the stated specification`} className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:inline-flex sm:rounded-full sm:border sm:border-line sm:bg-surface sm:p-1 sm:px-1">
      <button type="button" aria-pressed={none} onClick={onClear} className={clsx(cls, none ? 'bg-primary text-page' : 'text-secondary hover:bg-raised hover:text-display')}>
        All
      </button>
      {ordered.map((r) => {
        const on = selected.includes(r.tag);
        const unstated = r.tag.endsWith(':unstated');
        return (
          <button key={r.tag} type="button" aria-pressed={on} onClick={() => onToggle(r.tag)}
            className={clsx(cls, on ? 'bg-primary text-page' : 'text-secondary hover:bg-raised hover:text-display')}>
            <span className={clsx('h-2 w-2 rounded-full', on ? 'bg-page' : unstated ? 'bg-line-strong' : 'bg-accent')} aria-hidden />
            {r.label}
            <span className={clsx('mono text-[12px]', on ? 'text-page/70' : 'text-muted')}>{r.count.toLocaleString('en-IN')}</span>
          </button>
        );
      })}
    </div>
  );
}
