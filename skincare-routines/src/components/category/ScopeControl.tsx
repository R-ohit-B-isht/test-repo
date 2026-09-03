import { clsx } from 'clsx';
import type { FacetRow } from '../../lib/types';

interface Props { rows: FacetRow[]; selected: string[]; onToggle: (tag: string) => void; onClear: () => void }

const ORDER = ['scope:face', 'scope:both', 'scope:body', 'scope:unstated'];
const TONE: Record<string, string> = { 'scope:face': 'zone-face', 'scope:both': 'zone-both', 'scope:body': 'zone-body', 'scope:unstated': 'text-secondary' };

/** Segmented Face / Face+body / Body / Not-stated control — multi-select, always visible above the list. */
export function ScopeControl({ rows, selected, onToggle, onClear }: Props) {
  const ordered = ORDER.map((tag) => rows.find((r) => r.tag === tag)).filter((r): r is FacetRow => !!r);
  if (ordered.length < 2) return null;
  const none = selected.length === 0;
  return (
    <div role="group" aria-label="Where the listing says to use it" className="scrollbar-thin -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <button type="button" aria-pressed={none} onClick={onClear}
        className={clsx('press label h-10 shrink-0 rounded border px-3 transition-colors', none ? 'border-primary bg-primary !text-black' : 'border-line-strong hover:border-secondary')}>
        All
      </button>
      {ordered.map((r) => {
        const on = selected.includes(r.tag);
        return (
          <button key={r.tag} type="button" aria-pressed={on} onClick={() => onToggle(r.tag)}
            className={clsx('press label flex h-10 shrink-0 items-center gap-2 rounded border px-3 transition-colors', on ? 'border-primary bg-primary !text-black' : 'border-line-strong hover:border-secondary')}>
            <span className={clsx('h-1.5 w-1.5 rounded-full bg-current', !on && TONE[r.tag])} aria-hidden />
            {r.label}
            <span className={on ? 'text-muted' : 'text-muted'}>{r.count.toLocaleString('en-IN')}</span>
          </button>
        );
      })}
    </div>
  );
}
