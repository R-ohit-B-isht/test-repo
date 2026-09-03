import { useState } from 'react';
import { ArrowUpRight, Award, TriangleAlert } from 'lucide-react';
import type { Benchmark } from '../../lib/types';
import { BENCHMARK_SCORE } from '../../lib/types';
import { rupees, storeLabel } from '../../lib/format';

interface Props { bench: Benchmark; onOpenListing: (id: string) => void }

/**
 * The reference ceiling above a ranked list: the best product in the category regardless of price, availability or country.
 * Rendered as the one inverted (ink) card on the page so it reads as the measuring stick, not as row #0 of the marketplace list.
 * The 100 is fixed by definition; the marketplace rows below keep their own listing-signal scores.
 */
export function BenchmarkCard({ bench, onOpenListing }: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const { market } = bench;
  const headingId = `bench-${bench.category}`;
  return (
    <section className="ceiling card fade-in p-4 sm:p-5" aria-labelledby={headingId}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="label flex min-w-0 items-start gap-2 !text-[var(--fg-dim)]"><Award size={14} className="mt-px shrink-0" aria-hidden /><span>Reference ceiling · best in class, any price, any country</span></p>
        <p className="flex shrink-0 items-center gap-2 sm:text-right">
          <span className="score score-lg score-ceiling" aria-label={`Benchmark score ${BENCHMARK_SCORE} — fixed reference`}>{BENCHMARK_SCORE}</span>
          <span className="max-w-[9rem] text-[12px] font-bold leading-tight text-[var(--fg-dim)]">Fixed reference,<br />not a listing score</span>
        </p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[112px_minmax(0,1fr)] sm:gap-5">
        <div className="flex h-40 w-full items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-white/20 sm:h-[140px] sm:w-[112px]">
          {imgFailed ? (
            <span className="px-2 text-center text-[11px] font-bold text-[#8a837b]">Image unavailable</span>
          ) : (
            <img src={bench.image.url} alt={`${bench.brand} ${bench.name}`} width={112} height={140} decoding="async" className="h-full w-full object-contain p-2 sm:p-1" onError={() => setImgFailed(true)} />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-bold text-[var(--fg-dim)]">{bench.brand}</p>
          <h2 id={headingId} className="mt-0.5 text-[22px] leading-tight sm:text-[26px]">{bench.name}</h2>
          {bench.variant && <p className="mt-1 text-[13px] font-semibold text-[var(--fg-dim)]">{bench.variant}</p>}
          <p className="mt-3 max-w-3xl text-[14px] leading-relaxed sm:text-[15px]">{bench.why}</p>
          <dl className="mt-3 flex flex-wrap gap-2">
            {bench.facts.map((f) => (
              <div key={f.k} className="inline-flex max-w-full items-baseline gap-1.5 rounded-lg border border-[var(--fg-line)] px-2.5 py-1 text-[12px]">
                <dt className="shrink-0 font-bold text-[var(--fg-dim)]">{f.k}</dt><dd className="min-w-0 font-semibold">{f.v}</dd>
              </div>
            ))}
          </dl>
          {bench.caution && (
            <p className="mt-3 flex items-start gap-2 text-[13px] leading-snug text-[var(--fg-dim)]"><TriangleAlert size={14} className="mt-0.5 shrink-0" aria-hidden />{bench.caution}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <a href={bench.maker.url} target="_blank" rel="noopener noreferrer" className="btn btn-ceiling h-9 px-4 no-underline">{bench.maker.label}<ArrowUpRight size={14} aria-hidden /></a>
            <details className="group min-w-0 flex-1">
              <summary className="btn btn-ceiling-ghost inline-flex h-9 cursor-pointer list-none px-4 [&::-webkit-details-marker]:hidden">
                Sources ({bench.evidence.length})<span className="transition-transform group-open:rotate-180" aria-hidden>▾</span>
              </summary>
              <ol className="mt-3 space-y-1.5 text-[13px]">
                {bench.evidence.map((e) => (
                  <li key={e.url} className="leading-snug">
                    <a href={e.url} target="_blank" rel="noopener noreferrer" className="font-bold underline decoration-[var(--fg-line)] underline-offset-2 hover:decoration-current">{e.label}</a>
                    <span className="text-[var(--fg-dim)]"> — {e.publisher}{e.note ? ` · ${e.note}` : ''}</span>
                  </li>
                ))}
                <li className="pt-1 text-[12px] text-[var(--fg-dim)]">Image: {bench.image.source}.</li>
              </ol>
            </details>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--fg-line)] pt-3 text-[13px]">
        {market.status !== 'not-found' ? (
          <>
            <p className="min-w-[16rem] flex-1">
              <span className="font-bold">{market.status === 'found' ? 'Sold in India:' : 'Closest Indian listing (not verified identical):'}</span>
              {market.status === 'related' && <> {market.title.split(' | ')[0]} —</>}
              {' '}ranks <span className="mono font-extrabold">#{market.rank.toLocaleString('en-IN')}</span> of {market.of.toLocaleString('en-IN')} below
              {' '}· scores <span className="mono font-extrabold">{market.score.toFixed(1)}</span> on listing signals · {rupees(market.price)} on {storeLabel(market.store)}
              {market.note && <span className="text-[var(--fg-dim)]"> · {market.note}</span>}
            </p>
            <button type="button" className="btn btn-ceiling h-9 px-4" onClick={() => onOpenListing(market.id)}>
              Open {market.status === 'found' ? 'listing' : 'closest listing'} #{market.rank.toLocaleString('en-IN')}
            </button>
          </>
        ) : (
          <p><span className="font-bold">Not sold on Flipkart / Amazon.in</span> <span className="text-[var(--fg-dim)]">· {market.note}</span></p>
        )}
      </div>
    </section>
  );
}
