import { memo } from 'react';
import { clsx } from 'clsx';
import { Check, Plus, Star } from 'lucide-react';
import type { ProductRow } from '../../lib/types';
import { rupees, storeLabel } from '../../lib/format';
import { EvidenceBadge, ScoreBadge, ZoneBadge } from '../ui/primitives';

export type ScopeKey = 'face' | 'body' | 'both' | 'unstated';

interface Props {
  row: ProductRow; rank: number; scope: ScopeKey; compared: boolean; compareFull: boolean;
  onOpen: (id: string) => void; onCompare: (id: string) => void;
}

/** One ranked row (IMDb Top 250 / Goodreads list): rank · image · brand + title + meta line · score badge · price · compare.
 *  Memoised: only re-renders when its own row / compare state changes, never on scroll. */
export const ProductCard = memo(function ProductCard({ row, rank, scope, compared, compareFull, onOpen, onCompare }: Props) {
  return (
    <article className="card card-hover grid grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-x-3 gap-y-3 p-3 sm:grid-cols-[40px_72px_minmax(0,1fr)_auto_auto] sm:gap-x-4 sm:p-4">
      <span className="mono w-7 text-center text-[15px] font-extrabold text-muted sm:w-10 sm:text-[17px]" aria-label={`Rank ${rank}`}>{rank}</span>
      <button type="button" onClick={() => onOpen(row.id)} className="press h-[80px] w-[64px] shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-line sm:h-[88px] sm:w-[72px]" aria-label={`Open details for ${row.b} ${row.m}`} tabIndex={-1}>
        <img src={row.img} alt="" loading="lazy" decoding="async" width={72} height={88} className="h-full w-full object-contain" />
      </button>
      <button type="button" onClick={() => onOpen(row.id)} className="min-w-0 text-left" aria-label={`Open details for ${row.b} ${row.m}`}>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-[12px] font-bold text-accent">{row.b}</span>
          <ZoneBadge zone={scope} />
          <EvidenceBadge status={row.ev} />
        </div>
        <p className="mt-0.5 line-clamp-2 text-[15px] font-bold leading-snug text-display">{row.m}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-1.5 truncate text-[13px] text-secondary">
          <span className="truncate">{row.q}</span><span aria-hidden>·</span><span className="truncate">{row.f}</span>
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-[13px] text-secondary">
          {row.r !== null ? (
            <><Star size={12} className="fill-warning text-warning" aria-hidden /><span className="font-bold text-primary">{row.r}</span>{row.rc !== null && <span>({row.rc.toLocaleString('en-IN')})</span>}</>
          ) : <span>No buyer rating</span>}
          <span aria-hidden>·</span><span>{storeLabel(row.st)}</span>
        </p>
      </button>
      <div className="col-span-3 flex items-center gap-3 border-t border-line pt-3 sm:contents">
        <div className="flex flex-1 items-center justify-between gap-3 sm:block sm:text-right">
          <ScoreBadge score={row.s} className="sm:flex-row-reverse" />
          <p className="mono text-[16px] font-extrabold text-display sm:mt-1.5">{rupees(row.p)}</p>
        </div>
        <button type="button" onClick={() => onCompare(row.id)} disabled={!compared && compareFull} aria-pressed={compared}
          className={clsx('btn h-9 px-4 disabled:cursor-not-allowed disabled:opacity-40 sm:w-9 sm:px-0', compared && 'btn-accent')}
          aria-label={compared ? 'Remove from compare' : 'Add to compare'}>
          {compared ? <Check size={14} /> : <Plus size={14} />}<span className="sm:hidden">{compared ? 'Comparing' : 'Compare'}</span>
        </button>
      </div>
    </article>
  );
});
