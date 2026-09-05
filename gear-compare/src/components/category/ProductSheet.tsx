import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import { Sheet } from '../ui/Sheet';
import { EvidenceBadge, ScoreBadge, ScoreBar, ScoreRing, SegmentBadge, Skeleton, StatusBlock } from '../ui/primitives';
import { EvidencePanel } from './EvidencePanel';
import { useDetail } from '../../data/hooks';
import type { FieldTier, ProductRow, ScoreKey, SegmentOption } from '../../lib/types';
import { MAKER_SHORT, SCORE_META } from '../../domain/scoreMeta';
import { rupees, specLabel, storeLabel } from '../../lib/format';

interface Props { category: string; shards: number; row: ProductRow | null; rank: number; segment: SegmentOption; weights: Record<ScoreKey, number>; tiers: Record<FieldTier, string>; onClose: () => void }

export function ProductSheet({ category, shards, row, rank, segment, weights, tiers, onClose }: Props) {
  const detail = useDetail(category, row?.id ?? null, shards);
  const scoreMeta = SCORE_META;
  const [img, setImg] = useState(0);
  const title = row ? `${row.b} — ${row.m}` : '';
  return (
    <Sheet open={!!row} onClose={onClose} title={title}
      footer={row && detail.status === 'ready' ? (
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-bold text-secondary">#{rank} · {row.b}</p>
            <p className="mono text-[18px] font-extrabold leading-tight text-display">{rupees(row.p)}</p>
          </div>
          <a href={detail.data.buyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-accent h-12 shrink-0 px-5 no-underline">
            View on {storeLabel(detail.data.buyStore)} <ExternalLink size={14} />
          </a>
        </div>
      ) : undefined}>
      {row && (
        <div className="space-y-6">
          <div className="card overflow-hidden">
            <div className="grid gap-0 sm:grid-cols-[220px_minmax(0,1fr)]">
              <div className="bg-white p-4">
                <div className="h-[220px] overflow-hidden sm:aspect-[4/5] sm:h-auto">
                  <img src={detail.status === 'ready' ? detail.data.images[img] ?? row.img : row.img} alt={title} className="h-full w-full object-contain" />
                </div>
                {detail.status === 'ready' && detail.data.images.length > 1 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-thin" role="tablist" aria-label="Listing images">
                    {detail.data.images.slice(0, 6).map((src, i) => (
                      <button key={src} type="button" role="tab" aria-selected={img === i} onClick={() => setImg(i)}
                        className={clsx('h-12 w-10 shrink-0 overflow-hidden rounded-md border-2 bg-white', img === i ? 'border-accent' : 'border-line')}>
                        <img src={src} alt="" className="h-full w-full object-contain" loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mono rounded-full bg-raised px-2.5 py-1 text-[12px] font-extrabold text-display">#{rank}</span>
                  <SegmentBadge id={segment.id} label={segment.label} />
                  <EvidenceBadge status={row.ev} verified={row.vf} />
                  <span className="label">{storeLabel(row.st)}</span>
                </div>
                <p className="mt-3 text-[13px] font-bold text-accent">{row.b}</p>
                <h2 className="mt-1 text-[20px] leading-snug text-display">{row.m}</h2>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <ScoreBadge score={row.s} size="lg" />
                  <span className="mono text-[24px] font-extrabold text-display">{rupees(row.p)}</span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-[13px]">
                  <div><dt className="label">Rating</dt><dd className="mono mt-0.5 font-bold text-display">{row.r !== null ? `${row.r}★${row.rc !== null ? ` · ${row.rc.toLocaleString('en-IN')}` : ''}` : <span className="font-medium text-muted">Not stated</span>}</dd></div>
                  <div><dt className="label">Headline spec</dt><dd className="mt-0.5 font-bold text-display">{row.q}</dd></div>
                  <div><dt className="label">Maker</dt><dd className="mt-0.5 font-bold text-display">{MAKER_SHORT[row.mk]}</dd></div>
                  <div><dt className="label">Read from</dt><dd className="mt-0.5 font-bold text-display">{row.vf > 0 ? `${row.vf} maker-page field${row.vf === 1 ? '' : 's'}` : row.sf > 0 ? `${row.sf} spec-table field${row.sf === 1 ? '' : 's'}` : <span className="font-medium text-muted">No verifiable fields</span>}</dd></div>
                </dl>
                <p className="mt-4 text-[14px] leading-relaxed text-secondary">{row.f}</p>
              </div>
            </div>
          </div>

          <section aria-labelledby="scores-h" className="card p-5">
            <h3 id="scores-h" className="text-[15px] font-extrabold text-display">Score breakdown</h3>
            <p className="mt-0.5 text-[12px] text-muted">Arc length is the weight, filled part is this listing’s score out of 10 · price and seller claims are never scored · spec-table values earn 60% of what a maker page does</p>
            <div className="mt-4 grid gap-5 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-center">
              <div className="mx-auto"><ScoreRing total={row.s} parts={scoreMeta.map((m) => ({ label: m.label, weight: weights[m.key], value: row.sc[m.key] }))} /></div>
              <div className="space-y-4">
                {scoreMeta.map((m) => <ScoreBar key={m.key} label={`${m.label} · ${Math.round(weights[m.key] * 100)}%`} value={row.sc[m.key]} hint={m.hint} />)}
              </div>
            </div>
          </section>

          {detail.status === 'error' && <StatusBlock title="Details unavailable" body={detail.error} />}
          {detail.status === 'loading' && <div className="space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4" /><Skeleton className="h-4 w-5/6" /></div>}
          {detail.status === 'ready' && (
            <>
              <EvidencePanel evidence={detail.data.evidence} tiers={tiers} />
              <section className="card p-5">
                <h3 className="text-[15px] font-extrabold text-display">Marketplace specification table (as published by the seller)</h3>
                {Object.keys(detail.data.listingSpec).length === 0 ? (
                  <p className="mt-3 text-[13px] text-muted">This listing publishes no specification table — nothing here to read.</p>
                ) : (
                  <dl className="mt-3 divide-y divide-line text-[13px]">
                    {Object.entries(detail.data.listingSpec).map(([k, val]) => (
                      <div key={k} className="grid grid-cols-[minmax(110px,35%)_1fr] gap-3 py-2.5">
                        <dt className="text-secondary">{specLabel(k)}</dt>
                        <dd className="font-semibold text-display">{val}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                <p className="mt-3 text-[12px] text-muted">Verbatim from the {storeLabel(detail.data.buyStore)} page — seller-entered, not lab-tested. Only the rows matched to a schema field above are scored, at 60% unless the maker page confirms them.</p>
              </section>
            </>
          )}
        </div>
      )}
    </Sheet>
  );
}
