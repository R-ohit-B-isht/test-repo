import { useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, Award, Check, Droplets, Footprints, Star, TriangleAlert, X } from 'lucide-react';
import { useCategories, useManifest } from '../data/hooks';
import { Hero } from '../components/layout/Hero';
import { AppLink } from '../components/ui/AppLink';
import { ProductSheet } from '../components/category/ProductSheet';
import { EvidenceBadge, Kicker, ScoreBadge, SkeletonRows, StatusBlock } from '../components/ui/primitives';
import { segmentResolver, type CategoryIndex } from '../domain/index';
import { EVIDENCE_META } from '../domain/scoreMeta';
import { rupees, storeLabel } from '../lib/format';
import type { Benchmark, CategoryMeta, Manifest, ProductRow, Trip, TripNeed } from '../lib/types';

/**
 * The trip tab: one ranked answer per approved need, each drawn from its own evidence-first category, plus the explicit
 * water-shoes-vs-slippers answer. Nothing here is ranked differently from the category pages — the pick shown is the
 * category's best-ranked row (score desc, price asc), optionally restricted to the need's segments (a real-outsole water
 * shoe, an open slipper rather than a clog) with its true list rank shown, and the copy says plainly when that pick
 * rests on no verified field at all.
 */
export default function TripPage() {
  const manifest = useManifest();
  if (manifest.status === 'loading') return <SkeletonRows count={4} />;
  if (manifest.status === 'error') return <StatusBlock title="Could not load the index" body={manifest.error} />;
  const trip = manifest.data.trip;
  if (!trip) return <StatusBlock title="No trip in this build" body="The trip tab ships only when every need's category is part of the site." />;
  return <TripBoard manifest={manifest.data} trip={trip} />;
}

function TripBoard({ manifest, trip }: { manifest: Manifest; trip: Trip }) {
  const ids = useMemo(() => trip.needs.map((n) => n.category), [trip]);
  const cats = useCategories(ids);
  const metaOf = useMemo(() => new Map(manifest.categories.map((c) => [c.id, c])), [manifest]);
  const benchOf = useMemo(() => new Map(manifest.benchmarks.map((b) => [b.category, b])), [manifest]);
  const [open, setOpen] = useState<{ category: string; id: string } | null>(null);

  const total = ids.reduce((n, id) => n + (metaOf.get(id)?.count ?? 0), 0);
  const verified = ids.reduce((n, id) => { const c = metaOf.get(id); return n + (c ? c.evidence.official + c.evidence.listing : 0); }, 0);
  const official = ids.reduce((n, id) => n + (metaOf.get(id)?.evidence.official ?? 0), 0);

  const openIdx: CategoryIndex | undefined = open && cats.status === 'ready' ? cats.data[open.category] : undefined;
  const openMeta: CategoryMeta | undefined = open ? metaOf.get(open.category) : undefined;
  const openRow = openIdx ? openIdx.items.find((r) => r.id === open?.id) ?? null : null;
  const segOf = openIdx && openMeta ? segmentResolver(openIdx, openMeta.segment) : null;
  const rankOf = (idx: CategoryIndex, row: ProductRow) => { const pos = idx.items.indexOf(row); return pos >= 0 ? idx.rank[pos] : 0; };

  return (
    <div className="pb-24">
      <Hero
        kicker={trip.kicker}
        title={`${trip.needs.length} things for ${trip.label}, ranked on what their pages actually state.`}
        lede={trip.lede}
        proofs={[`${total.toLocaleString('en-IN')} listings read across ${trip.needs.length} lists`, `${verified.toLocaleString('en-IN')} with a spec-table or maker-verified field`, `${official.toLocaleString('en-IN')} maker-verified`, `${trip.needs.length} reference ceilings`]}
        aside={(
          <div className="card p-5">
            <p className="label">Where this is for</p>
            <p className="mt-2 text-[14px] leading-relaxed text-secondary">{trip.where}</p>
            <ul className="mt-4 space-y-1.5 text-[13px]">
              {trip.needs.map((n) => (
                <li key={n.id} className="flex items-center justify-between gap-3">
                  <a href={`#need-${n.id}`} className="font-bold text-display">{n.label}</a>
                  <span className="mono text-[12px] text-muted">{(metaOf.get(n.category)?.count ?? 0).toLocaleString('en-IN')} listings</span>
                </li>
              ))}
            </ul>
          </div>
        )}>
        <a href="#shoes-vs-slippers" className="btn h-12 px-6 no-underline">Water shoes vs slippers <ArrowRight size={14} /></a>
      </Hero>

      {cats.status === 'error' && <StatusBlock title="Could not load the lists" body={cats.error} />}
      {cats.status === 'loading' && <SkeletonRows count={5} />}
      {cats.status === 'ready' && (
        <ol className="space-y-8" aria-label="Trip needs">
          {trip.needs.map((n, i) => (
            <NeedCard key={n.id} index={i + 1} need={n} idx={cats.data[n.category]} meta={metaOf.get(n.category)} bench={benchOf.get(n.category)} capturedAt={manifest.generatedAt.slice(0, 10)} onOpen={(id) => setOpen({ category: n.category, id })} />
          ))}
        </ol>
      )}

      <ShoesVsSlippers trip={trip} />

      <section className="mt-12 max-w-3xl" aria-labelledby="trip-caveats">
        <Kicker>What this is not</Kicker>
        <h2 id="trip-caveats" className="mt-1 text-[20px] sm:text-[24px]">Read the rankings for what they are</h2>
        <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-secondary">
          {trip.caveats.map((c) => <li key={c} className="flex gap-2"><TriangleAlert size={15} className="mt-1 shrink-0 text-warning" aria-hidden />{c}</li>)}
        </ul>
      </section>

      {open && openMeta && openIdx && segOf && (
        <ProductSheet category={open.category} shards={manifest.shards} row={openRow} rank={openRow ? rankOf(openIdx, openRow) : 0}
          segment={openRow ? segOf(openRow.t) : { id: 'unstated', label: 'Not stated' }} weights={manifest.weights} tiers={manifest.tiers} onClose={() => setOpen(null)} />
      )}
    </div>
  );
}

/** Best-ranked row of the category (rank array is 1-based per position), limited to `segments` when the need names them. */
function topOf(idx: CategoryIndex | undefined, meta: CategoryMeta | undefined, segments: string[] | undefined): { row: ProductRow; rank: number; segment: string } | null {
  if (!idx || !idx.items.length) return null;
  const segOf = meta ? segmentResolver(idx, meta.segment) : () => ({ id: 'unstated', label: 'Not stated' });
  let best: { row: ProductRow; rank: number; segment: string } | null = null;
  for (let i = 0; i < idx.rank.length; i++) {
    if (best && idx.rank[i] >= best.rank) continue;
    const segment = segOf(idx.items[i].t).id;
    if (segments && !segments.includes(segment)) continue;
    best = { row: idx.items[i], rank: idx.rank[i], segment };
  }
  return best;
}

function NeedCard({ index, need, idx, meta, bench, capturedAt, onOpen }: { index: number; need: TripNeed; idx: CategoryIndex | undefined; meta: CategoryMeta | undefined; bench: Benchmark | undefined; capturedAt: string; onOpen: (id: string) => void }) {
  const pick = topOf(idx, meta, need.pick?.segments);
  const top = pick?.row ?? null;
  const verifiedCount = meta ? meta.evidence.official + meta.evidence.listing : 0;
  const weak = !!top && (top.ev === 'claimed' || top.ev === 'none');
  const segLabel = pick && meta ? meta.segment.options.find((o) => o.id === pick.segment)?.label : undefined;
  return (
    <li id={`need-${need.id}`} className="card overflow-hidden" aria-labelledby={`need-h-${need.id}`}>
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="mono flex h-8 w-8 items-center justify-center rounded-full bg-raised text-[14px] font-extrabold text-display" aria-hidden>{index}</span>
            <div>
              <Kicker>{meta?.kicker ?? need.label}</Kicker>
              <h2 id={`need-h-${need.id}`} className="text-[22px] leading-tight sm:text-[26px]">{need.label}</h2>
            </div>
          </div>
          <p className="mt-3 text-[14px] leading-relaxed text-secondary">{need.why}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="label !text-success">Credited when a spec row or maker page states it</p>
              <ul className="mt-2 space-y-1.5 text-[13px] text-primary">{need.lookFor.map((s) => <li key={s} className="flex gap-2"><Check size={14} className="mt-0.5 shrink-0 text-success" aria-hidden />{s}</li>)}</ul>
            </div>
            <div>
              <p className="label !text-danger">Never on this list</p>
              <ul className="mt-2 space-y-1.5 text-[13px] text-secondary">{need.notThis.map((s) => <li key={s} className="flex gap-2"><X size={14} className="mt-0.5 shrink-0 text-danger" aria-hidden />{s}</li>)}</ul>
            </div>
          </div>
          {bench && (
            <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-secondary">
              <Award size={14} className="shrink-0 text-accent" aria-hidden />
              <span>Reference ceiling: <span className="font-bold text-display">{bench.brand} {bench.name}</span></span>
              <a href={bench.maker.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-accent">{bench.maker.label}<ArrowUpRight size={12} aria-hidden /></a>
              <span className="text-muted">· {bench.market.status === 'found' ? `sold in India, #${bench.market.rank} below` : bench.market.status === 'related' ? `closest Indian listing #${bench.market.rank}` : 'not sold on Flipkart / Amazon.in'}</span>
            </p>
          )}
        </div>

        <div className="border-t border-line bg-surface p-4 sm:p-6 lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between gap-3">
            <p className="label">{pick && pick.rank > 1 ? `#${pick.rank}` : '#1'} of {(meta?.count ?? 0).toLocaleString('en-IN')} {meta?.unit ?? ''} listings{segLabel && need.pick ? ` · ${segLabel}` : ''}</p>
            <p className="text-[12px] text-muted">{verifiedCount.toLocaleString('en-IN')} with a verified field</p>
          </div>
          {top ? (
            <article className="mt-3" data-trip-top={top.id}>
              <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-4">
                <button type="button" onClick={() => onOpen(top.id)} className="press h-[110px] w-[88px] overflow-hidden rounded-lg bg-white ring-1 ring-line" aria-label={`Open details for ${top.b} ${top.m}`} tabIndex={-1}>
                  <img src={top.img} alt="" loading="lazy" decoding="async" width={88} height={110} className="h-full w-full object-contain" />
                </button>
                <button type="button" onClick={() => onOpen(top.id)} className="min-w-0 text-left" aria-label={`Open details for ${top.b} ${top.m}`}>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-[12px] font-bold text-accent">{top.b}</span>
                    <EvidenceBadge status={top.ev} verified={top.vf} />
                  </div>
                  <h3 className="mt-0.5 line-clamp-3 text-[16px] font-extrabold leading-snug text-display">{top.m}</h3>
                  <p className="mt-1 text-[13px] text-secondary">{[top.q, top.f].filter(Boolean).join(' · ') || 'No stated specifications'}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[13px] text-secondary">
                    {top.r !== null ? <><Star size={12} className="fill-warning text-warning" aria-hidden /><span className="font-bold text-primary">{top.r}</span>{top.rc !== null && <span>({top.rc.toLocaleString('en-IN')})</span>}</> : <span>No buyer rating</span>}
                    <span aria-hidden>·</span><span>{storeLabel(top.st)}</span>
                  </p>
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <ScoreBadge score={top.s} />
                <p className="mono text-[20px] font-extrabold text-display">{rupees(top.p)}</p>
                <p className="basis-full text-right text-[11px] text-muted">price on {storeLabel(top.st)} when read, {capturedAt}</p>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-secondary">
                <span className="font-bold text-display">Why it is the pick:</span> {EVIDENCE_META[top.ev].label.toLowerCase()} —
                {top.vf > 0 ? ` ${top.vf} field${top.vf === 1 ? '' : 's'} read on the maker’s page` : ''}
                {top.vf > 0 && top.sf > 0 ? ',' : ''}
                {top.sf > 0 ? ` ${top.sf} from the marketplace spec table` : ''}
                {top.vf === 0 && top.sf === 0 ? ' no field could be read from a spec table or maker page, so its score rests on the maker tier and buyer ratings alone' : ''}
                ; title and seller-text claims scored nothing. Open it for every field and where each was read.
                {need.pick && pick ? ` ${need.pick.note}${pick.rank > 1 ? ` The ${pick.rank - 1} row${pick.rank === 2 ? '' : 's'} above it on the full list ${pick.rank === 2 ? 'is' : 'are'} outside that pick.` : ''}` : ''}
              </p>
              {weak && (
                <p className="mt-2 flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-[13px] text-primary">
                  <TriangleAlert size={15} className="mt-0.5 shrink-0 text-warning" aria-hidden />
                  {verifiedCount === 0
                    ? `No ${meta?.unit ?? 'listing'} on this list has a single spec-table or maker-verified field. This pick is the best of an unproven field, not a proven product.`
                    : `This pick has no verified field; ${verifiedCount.toLocaleString('en-IN')} listings on the full list do — filter by evidence there before buying.`}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => onOpen(top.id)} className="btn btn-accent h-10 px-4">Open the pick with its evidence</button>
                <AppLink to={`/c/${need.category}`} className="btn h-10 px-4 no-underline">Full ranked list <ArrowRight size={14} /></AppLink>
              </div>
            </article>
          ) : (
            <p className="mt-3 rounded-lg border border-dashed border-line-strong p-4 text-[13px] text-secondary">No listing passed the classifier for this need yet.</p>
          )}
        </div>
      </div>
    </li>
  );
}

function ShoesVsSlippers({ trip }: { trip: Trip }) {
  const s = trip.shoesVsSlippers;
  return (
    <section id="shoes-vs-slippers" className="-mx-4 mt-16 rounded-[24px] bg-surface px-4 py-10 sm:-mx-6 sm:px-6 lg:px-10" aria-labelledby="svs-h">
      <div className="max-w-3xl">
        <Kicker>Two needs, not one</Kicker>
        <h2 id="svs-h" className="mt-2 text-[clamp(24px,3vw,36px)] leading-tight text-display">{s.title}</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-secondary">{s.body}</p>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <p className="flex items-center gap-2 text-[15px] font-extrabold text-display"><Droplets size={16} className="text-accent" aria-hidden />Water shoes — the wet half</p>
          <ul className="mt-3 space-y-1.5 text-[13px] text-secondary">{s.wet.map((x) => <li key={x} className="flex gap-2"><Check size={14} className="mt-0.5 shrink-0 text-success" aria-hidden />{x}</li>)}</ul>
          <AppLink to="/c/water-shoes" className="btn mt-4 h-9 px-4 no-underline">Ranked water shoes <ArrowRight size={14} /></AppLink>
        </div>
        <div className="card p-5">
          <p className="flex items-center gap-2 text-[15px] font-extrabold text-display"><Footprints size={16} className="text-accent" aria-hidden />Slippers — the dry half</p>
          <ul className="mt-3 space-y-1.5 text-[13px] text-secondary">{s.dry.map((x) => <li key={x} className="flex gap-2"><Check size={14} className="mt-0.5 shrink-0 text-success" aria-hidden />{x}</li>)}</ul>
          <AppLink to="/c/flip-flops" className="btn mt-4 h-9 px-4 no-underline">Ranked slippers <ArrowRight size={14} /></AppLink>
        </div>
      </div>
    </section>
  );
}
