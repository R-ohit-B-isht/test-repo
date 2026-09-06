import { clsx } from 'clsx';
import type { FacetRow, ScopeGroup } from '../../lib/types';

interface Props { group: ScopeGroup; rows: FacetRow[]; selected: string[]; onToggle: (tag: string) => void; onClear: () => void }

/** Segment order and dot colour per placement group: skincare face → body, hair scalp → lengths. */
const SEGMENTS: Record<ScopeGroup, { order: string[]; tone: Record<string, string>; aria: string }> = {
  scope: {
    order: ['scope:face', 'scope:both', 'scope:body', 'scope:unstated'],
    tone: { 'scope:face': 'bg-face', 'scope:both': 'bg-both', 'scope:body': 'bg-body', 'scope:unstated': 'bg-muted' },
    aria: 'Where the listing says to use it: face or body',
  },
  area: {
    order: ['area:scalp', 'area:both', 'area:lengths', 'area:beard', 'area:unstated'],
    tone: { 'area:scalp': 'bg-hair', 'area:both': 'bg-hair', 'area:lengths': 'bg-hair', 'area:beard': 'bg-hair', 'area:unstated': 'bg-muted' },
    aria: 'Where the listing says to use it: scalp or lengths',
  },
};

/** Zillow-style segmented control (For sale / For rent / Sold) over the category's placement group — multi-select, always visible above the list. */
export function ScopeControl({ group, rows, selected, onToggle, onClear }: Props) {
  const seg = SEGMENTS[group];
  const ordered = seg.order.map((tag) => rows.find((r) => r.tag === tag)).filter((r): r is FacetRow => !!r);
  if (ordered.length < 2) return null;
  const none = selected.length === 0;
  const cls = 'press flex h-10 shrink-0 items-center gap-2 rounded-full px-3.5 text-[13px] font-bold transition-colors sm:px-4';
  return (
    <div role="group" aria-label={seg.aria} className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:inline-flex sm:rounded-full sm:border sm:border-line sm:bg-surface sm:p-1 sm:px-1">
      <button type="button" aria-pressed={none} onClick={onClear} className={clsx(cls, none ? 'bg-primary text-page' : 'text-secondary hover:bg-raised hover:text-display')}>
        All
      </button>
      {ordered.map((r) => {
        const on = selected.includes(r.tag);
        return (
          <button key={r.tag} type="button" aria-pressed={on} onClick={() => onToggle(r.tag)}
            className={clsx(cls, on ? 'bg-primary text-page' : 'text-secondary hover:bg-raised hover:text-display')}>
            <span className={clsx('h-2 w-2 rounded-full', on ? 'bg-page' : seg.tone[r.tag])} aria-hidden />
            {r.label}
            <span className={clsx('mono text-[12px]', on ? 'text-page/70' : 'text-muted')}>{r.count.toLocaleString('en-IN')}</span>
          </button>
        );
      })}
    </div>
  );
}
