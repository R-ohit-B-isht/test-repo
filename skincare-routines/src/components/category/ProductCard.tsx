import { memo } from 'react';
import { clsx } from 'clsx';
import { Check, Plus } from 'lucide-react';
import type { ProductRow } from '../../lib/types';
import { rupees, storeLabel, verdict } from '../../lib/format';
import { ZoneBadge } from '../ui/primitives';

export type ScopeKey = 'face' | 'body' | 'both' | 'unstated';

interface Props {
  row: ProductRow; rank: number; scope: ScopeKey; compared: boolean; compareFull: boolean;
  onOpen: (id: string) => void; onCompare: (id: string) => void;
}

/** One listing. Memoised: only re-renders when its own row / compare state changes, never on scroll. */
export const ProductCard = memo(function ProductCard({ row, rank, scope, compared, compareFull, onOpen, onCompare }: Props) {
  return (
    <article className="card card-hover relative flex h-full flex-col p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="mono text-[12px] text-secondary">#{rank}</span>
        <ZoneBadge zone={scope} />
      </div>
      <button type="button" onClick={() => onOpen(row.id)} className="mt-3 flex flex-1 gap-4 text-left" aria-label={`Open details for ${row.b} ${row.m}`}>
        <div className="h-[88px] w-[72px] shrink-0 overflow-hidden rounded bg-white">
          <img src={row.img} alt="" loading="lazy" decoding="async" width={72} height={88} className="h-full w-full object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="label truncate !text-primary">{row.b}</p>
          <p className="mt-1 line-clamp-2 text-[14px] leading-snug text-display">{row.m}</p>
          <p className="mt-1.5 truncate text-[12px] text-secondary">{row.q} · {row.f}</p>
        </div>
      </button>
      <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-3">
        <div>
          <span className="display text-[34px]">{row.s.toFixed(1)}</span>
          <span className="label ml-2">{verdict(row.s)}</span>
          <div className="mt-1 flex gap-1" aria-hidden>
            {(['trust', 'skin', 'ingredients', 'experience'] as const).map((k) => (
              <span key={k} className="h-[3px] w-8 overflow-hidden rounded-full bg-line"><span className="block h-full bg-primary" style={{ width: `${row.sc[k] * 10}%` }} /></span>
            ))}
          </div>
        </div>
        <div className="text-right">
          <p className="mono text-[15px] text-display">{rupees(row.p)}</p>
          <p className="mono text-[11px] text-secondary">{storeLabel(row.st)}{row.r !== null ? ` · ${row.r}★${row.rc !== null ? ` (${row.rc.toLocaleString('en-IN')})` : ''}` : ' · no rating'}</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => onOpen(row.id)} className="btn h-9 flex-1">Details</button>
        <button type="button" onClick={() => onCompare(row.id)} disabled={!compared && compareFull} aria-pressed={compared}
          className={clsx('btn h-9 w-9 px-0 disabled:cursor-not-allowed disabled:opacity-40', compared && 'btn-primary')} aria-label={compared ? 'Remove from compare' : 'Add to compare'}>
          {compared ? <Check size={14} /> : <Plus size={14} />}
        </button>
      </div>
    </article>
  );
});
