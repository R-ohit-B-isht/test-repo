import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import { Sheet } from '../ui/Sheet';
import { ScoreBar, Skeleton, StatusBlock, ZoneBadge } from '../ui/primitives';
import { useDetail } from '../../data/hooks';
import type { ProductRow, ScoreKey } from '../../lib/types';
import { SCORE_META } from '../../domain/scoreMeta';
import { rupees, storeLabel, verdict } from '../../lib/format';
import type { ScopeKey } from './ProductCard';


interface Props { category: string; shards: number; row: ProductRow | null; rank: number; scope: ScopeKey; weights: Record<ScoreKey, number>; onClose: () => void }

export function ProductSheet({ category, shards, row, rank, scope, weights, onClose }: Props) {
  const detail = useDetail(category, row?.id ?? null, shards);
  const [img, setImg] = useState(0);
  const title = row ? `${row.b} — ${row.m}` : '';
  return (
    <Sheet open={!!row} onClose={onClose} title={title}>
      {row && (
        <div className="space-y-6">
          <header className="flex items-start justify-between gap-4">
            <div>
              <p className="label">#{rank} · {storeLabel(row.st)}</p>
              <h2 className="mt-1 text-[20px] leading-tight text-display">{row.b}</h2>
              <p className="mt-1 text-[14px] text-secondary">{row.m}</p>
            </div>
            <ZoneBadge zone={scope} />
          </header>

          <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
            <div>
              <div className="aspect-[4/5] overflow-hidden rounded bg-white">
                <img src={detail.status === 'ready' ? detail.data.images[img] ?? row.img : row.img} alt={title} className="h-full w-full object-contain" />
              </div>
              {detail.status === 'ready' && detail.data.images.length > 1 && (
                <div className="mt-2 flex gap-1.5 overflow-x-auto scrollbar-thin" role="tablist" aria-label="Listing images">
                  {detail.data.images.slice(0, 6).map((src, i) => (
                    <button key={src} type="button" role="tab" aria-selected={img === i} onClick={() => setImg(i)}
                      className={clsx('h-11 w-9 shrink-0 overflow-hidden rounded border bg-white', img === i ? 'border-primary' : 'border-line')}>
                      <img src={src} alt="" className="h-full w-full object-contain" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-baseline gap-3">
                <span className="display text-[56px] leading-none">{row.s.toFixed(1)}</span>
                <span className="label">{verdict(row.s)} / 100</span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
                <div><dt className="label">Price</dt><dd className="mono text-display">{rupees(row.p)}</dd></div>
                <div><dt className="label">Rating</dt><dd className="mono text-display">{row.r !== null ? `${row.r}★${row.rc !== null ? ` · ${row.rc.toLocaleString('en-IN')} ratings` : ''}` : 'Not stated in listing'}</dd></div>
                <div><dt className="label">Size</dt><dd className="text-primary">{row.q}</dd></div>
                <div><dt className="label">Format</dt><dd className="text-primary">{row.f}</dd></div>
              </dl>
              {detail.status === 'ready' && <p className="mt-3 text-[13px] text-secondary">{detail.data.highlight}</p>}
              {detail.status === 'loading' && <Skeleton className="mt-3 h-10" />}
            </div>
          </div>

          <section aria-labelledby="scores-h">
            <h3 id="scores-h" className="label mb-3">Score breakdown · price is never scored</h3>
            <div className="space-y-3">
              {SCORE_META.map((m) => <ScoreBar key={m.key} label={`${m.label} · ${Math.round(weights[m.key] * 100)}%`} value={row.sc[m.key]} hint={m.hint} />)}
            </div>
          </section>

          {detail.status === 'error' && <StatusBlock title="Details unavailable" body={detail.error} />}
          {detail.status === 'loading' && <div className="space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4" /><Skeleton className="h-4 w-5/6" /></div>}
          {detail.status === 'ready' && (
            <>
              <section className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="label mb-2 text-success">For</h3>
                  <ul className="space-y-1.5 text-[13px] text-primary">{detail.data.pros.map((p) => <li key={p} className="flex gap-2"><span className="text-success">+</span>{p}</li>)}</ul>
                </div>
                <div>
                  <h3 className="label mb-2 text-warning">Against</h3>
                  <ul className="space-y-1.5 text-[13px] text-primary">{detail.data.cons.map((c) => <li key={c} className="flex gap-2"><span className="text-warning">−</span>{c}</li>)}</ul>
                </div>
              </section>
              <section>
                <h3 className="label mb-2">What the listing states</h3>
                <dl className="divide-y divide-line border-y border-line text-[13px]">
                  {Object.entries(detail.data.fullSpec).map(([k, val]) => (
                    <div key={k} className="grid grid-cols-[minmax(110px,35%)_1fr] gap-3 py-2">
                      <dt className="text-secondary">{k}</dt>
                      <dd className={clsx(val === 'Not stated in listing' ? 'text-muted' : 'text-primary')}>{val}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-2 text-[11px] text-muted">Values are the seller's own listing claims, not lab tests. Missing fields are shown as “Not stated in listing”.</p>
              </section>
              <a href={detail.data.buyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full">
                View on {storeLabel(detail.data.buyStore)} <ExternalLink size={14} />
              </a>
            </>
          )}
        </div>
      )}
    </Sheet>
  );
}
