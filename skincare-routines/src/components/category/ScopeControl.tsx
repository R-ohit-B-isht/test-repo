import { clsx } from 'clsx';
import type { FacetRow } from '../../lib/types';

interface Props { rows: FacetRow[]; selected: string[]; onToggle: (tag: string) => void; onClear: () => void }

const ORDER = ['scope:face', 'scope:both', 'scope:body', 'scope:unstated'];
const TONE: Record<string, string> = { 'scope:face': 'bg-face', 'scope:both': 'bg-both', 'scope:body': 'bg-body', 'scope:unstated': 'bg-muted' };

/** Zillow-style segmented control (For sale / For rent / Sold) for Face / Face + body / Body / Not stated — multi-select, always visible above the list. */
export function ScopeControl({ rows, selected, onToggle, onClear }: Props) {
  const ordered = ORDER.map((tag) => rows.find((r) => r.tag === tag)).filter((r): r is FacetRow => !!r);
  if (ordered.length < 2) return null;
  const none = selected.length === 0;
  const seg = 'press flex h-10 shrink-0 items-center gap-2 rounded-full px-3.5 text-[13px] font-bold transition-colors sm:px-4';
  return (
    <div role="group" aria-label="Where the listing says to use it" className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:inline-flex sm:rounded-full sm:border sm:border-line sm:bg-surface sm:p-1 sm:px-1">
      <button type="button" aria-pressed={none} onClick={onClear} className={clsx(seg, none ? 'bg-primary text-page' : 'text-secondary hover:bg-raised hover:text-display')}>
        All
      </button>
      {ordered.map((r) => {
        const on = selected.includes(r.tag);
        return (
          <button key={r.tag} type="button" aria-pressed={on} onClick={() => onToggle(r.tag)}
            className={clsx(seg, on ? 'bg-primary text-page' : 'text-secondary hover:bg-raised hover:text-display')}>
            <span className={clsx('h-2 w-2 rounded-full', on ? 'bg-page' : TONE[r.tag])} aria-hidden />
            {r.label}
            <span className={clsx('mono text-[12px]', on ? 'text-page/70' : 'text-muted')}>{r.count.toLocaleString('en-IN')}</span>
          </button>
        );
      })}
    </div>
  );
}
