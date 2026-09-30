import { useCallback, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { ArrowUpRight, ChevronDown, FileCheck, Layers, Ruler, TriangleAlert } from 'lucide-react';
import { useCategories, useDetail, useManifest } from '../data/hooks';
import { EvidenceBadge, Kicker, ScoreBadge, SkeletonRows, StatusBlock } from '../components/ui/primitives';
import { Hero } from '../components/layout/Hero';
import { ProductSheet } from '../components/category/ProductSheet';
import { BagCard } from '../components/plan/BagCard';
import { SetCard } from '../components/plan/SetPicker';
import { CoverTier, FitBadge, RoleCoverage } from '../components/plan/planUi';
import { segmentResolver, type CategoryIndex } from '../domain/index';
import { dims, litres, litresOf, rankSets, type SetCandidate } from '../domain/pack';
import { rupees, storeLabel } from '../lib/format';
import type { CategoryMeta, Manifest, PackBag, ProductRow } from '../lib/types';

const FIRST = 8;
const MORE = 40;

/**
 * Single-answer landing: the one listing whose *stated contents* cover the most of the bag's packing roles, then the
 * runners-up. Nothing is inferred from a piece count; a title-only contents claim is hidden until asked for.
 */
export default function SetPage() {
  const manifest = useManifest();
  if (manifest.status === 'loading') return <SkeletonRows count={4} />;
  if (manifest.status === 'error') return <StatusBlock title="Could not load the index" body={manifest.error} />;
  const bag = manifest.data.pack;
  if (!bag) return <StatusBlock title="No bag in this build" body="The all-in-one ranking ships only when every organiser role's category is part of the site." />;
  return <OneListing manifest={manifest.data} bag={bag} />;
}

function OneListing({ manifest, bag }: { manifest: Manifest; bag: PackBag }) {
  const categoryIds = useMemo(() => [...new Set(bag.roles.map((r) => r.category))], [bag]);
  const cats = useCategories(categoryIds);
  const metaOf = useMemo(() => new Map(manifest.categories.map((c) => [c.id, c])), [manifest]);
  const rowsOf = useCallback((category: string) => (cats.status === 'ready' ? cats.data[category]?.items : undefined), [cats]);
  const all = useMemo(() => (cats.status === 'ready' ? rankSets(bag, rowsOf) : []), [bag, rowsOf, cats.status]);

  const [claimedToo, setClaimedToo] = useState(false);
  const [sizedOnly, setSizedOnly] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState<{ category: string; id: string } | null>(null);

  const list = useMemo(
    () => all.filter((c) => (claimedToo || c.cover.t !== 'claimed') && (!sizedOnly || (c.row.pk && c.row.pk.tier !== 'claimed'))),
    [all, claimedToo, sizedOnly],
  );
  const top = list[0] ?? null;
  const rest = expanded ? list.slice(1, MORE) : list.slice(1, FIRST);
  const stated = useMemo(() => all.filter((c) => c.cover.t !== 'claimed'), [all]);
  /** Roles no listing with spec-table / maker-stated contents names a piece for — the honest gap of the whole market. */
  const neverStated = useMemo(() => {
    const seen = new Set(stated.flatMap((c) => c.cover.r));
    return bag.roles.filter((r) => !seen.has(r.id));
  }, [stated, bag]);
  const best = stated[0] ?? null;

  const openRow = open && cats.status === 'ready' ? cats.data[open.category]?.items.find((r) => r.id === open.id) ?? null : null;
  const openMeta: CategoryMeta | undefined = open ? metaOf.get(open.category) : undefined;
  const openIdx: CategoryIndex | undefined = open && cats.status === 'ready' ? cats.data[open.category] : undefined;
  const segOf = openIdx && openMeta ? segmentResolver(openIdx, openMeta.segment) : null;
  const rankOf = (idx: CategoryIndex, row: ProductRow) => { const pos = idx.items.indexOf(row); return pos >= 0 ? idx.rank[pos] : 0; };

  const sets = categoryIds.reduce((n, id) => n + (metaOf.get(id)?.sets ?? 0), 0);
  return (
    <div className="pb-24">
      <Hero
        kicker={`One listing · ${bag.brand} ${bag.name}`}
        title={best ? `One listing covers ${best.covered.length} of your ${bag.roles.length} packing needs. None covers all ${bag.roles.length}.` : 'One listing for the whole bag — ranked on what its contents actually state.'}
        lede={`Every multi-piece organiser set on Flipkart, Amazon.in and the maker stores, ranked by how many of your ${bag.roles.length} needs — ${bag.roles.map((r) => r.label.toLowerCase()).join(', ')} — its stated contents name a piece for. A spec table or the maker's page beats a title claim; a bare “7-piece set” counts for nothing. The whole set is then checked against the bag's ${bag.compartments[0].litres} L main body.`}
        proofs={[`${sets.toLocaleString('en-IN')} multi-role sets read`, `${stated.length.toLocaleString('en-IN')} with contents from a spec table or maker page`, `${bag.roles.length} needs · ${bag.compartments.map((c) => `${c.litres} L`).join(' + ')} from tripole.in`]}
        aside={<BagCard bag={bag} compact />}
      />

      {cats.status === 'error' && <StatusBlock title="Could not load the organiser lists" body={cats.error} />}
      {cats.status === 'loading' && <SkeletonRows count={4} />}

      {cats.status === 'ready' && (
        <>
          <section aria-labelledby="one" className="mb-10" data-one-listing>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <Kicker>The one to buy</Kicker>
                <h2 id="one" className="mt-1 text-[22px] sm:text-[26px]">{top ? `#1 · covers ${top.covered.length} of ${bag.roles.length}` : 'Nothing qualifies with these filters'}</h2>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="inline-flex items-center gap-2 text-[13px] font-bold text-secondary">
                  <input type="checkbox" checked={claimedToo} onChange={(e) => setClaimedToo(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
                  <FileCheck size={14} aria-hidden />Also show sets whose contents are only claimed in the title
                </label>
                <label className="inline-flex items-center gap-2 text-[13px] font-bold text-secondary">
                  <input type="checkbox" checked={sizedOnly} onChange={(e) => setSizedOnly(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
                  <Ruler size={14} aria-hidden />Only sets with a verified size
                </label>
              </div>
            </div>
            {top ? (
              <TopCard bag={bag} cand={top} meta={metaOf.get(top.category)} shards={manifest.shards} onOpen={() => setOpen({ category: top.category, id: top.row.id })} />
            ) : (
              <p className="mt-5 rounded-lg border border-dashed border-line-strong p-4 text-[13px] text-secondary">No multi-role set passes these filters — untick one to widen the field.</p>
            )}
            {neverStated.length > 0 && (
              <p className="mt-4 flex items-start gap-2 text-[13px] text-secondary"><TriangleAlert size={15} className="mt-0.5 shrink-0 text-warning" aria-hidden />
                No listing with spec-table or maker-stated contents names a piece for <span className="font-bold text-display">{neverStated.map((r) => r.label.toLowerCase()).join(' or ')}</span> — whatever you buy, those still travel loose or in something separate.
              </p>
            )}
          </section>

          <section aria-labelledby="runners" className="mb-10">
            <Kicker>Runners-up</Kicker>
            <h2 id="runners" className="mt-1 text-[22px] sm:text-[26px]">The next {rest.length} single listings, same rules</h2>
            <p className="mt-1 max-w-2xl text-[14px] text-secondary">Ranked by needs covered, then where the contents were read, then an accepted size, then the category score. Price only orders ties.</p>
            {rest.length === 0 ? (
              <p className="mt-4 text-[13px] text-muted">Nothing else passes these filters.</p>
            ) : (
              <ol className="mt-5 grid gap-3 md:grid-cols-2" aria-label="Runner-up all-in-one sets">
                {rest.map((c, i) => <SetCard key={c.row.id} bag={bag} cand={c} rank={i + 2} meta={metaOf.get(c.category)} onOpen={() => setOpen({ category: c.category, id: c.row.id })} />)}
              </ol>
            )}
            {list.length > FIRST && (
              <button type="button" onClick={() => setExpanded((v) => !v)} className="btn mt-4 h-9 px-4" aria-expanded={expanded}>
                <ChevronDown size={14} className={clsx('transition-transform', expanded && 'rotate-180')} aria-hidden />{expanded ? 'Show fewer' : `Show ${Math.min(MORE, list.length) - FIRST} more`}
              </button>
            )}
          </section>
        </>
      )}

      <section aria-labelledby="caveats" className="card p-5">
        <h2 id="caveats" className="flex items-center gap-2 text-[16px] font-extrabold text-display"><TriangleAlert size={16} className="text-warning" aria-hidden />What this ranking can and cannot tell you</h2>
        <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-secondary">
          <li className="flex gap-2"><span aria-hidden>—</span><span>“Covers” means the listing's stated contents name a piece for that need. It does not say the piece is big enough for your things, or that the set is well made — the score next to each set is where build evidence lives.</span></li>
          {bag.caveats.map((c) => <li key={c} className="flex gap-2"><span aria-hidden>—</span><span>{c}</span></li>)}
        </ul>
      </section>

      {open && openMeta && openIdx && segOf && (
        <ProductSheet category={open.category} shards={manifest.shards} row={openRow} rank={openRow ? rankOf(openIdx, openRow) : 0}
          segment={segOf(openRow?.t ?? [])} weights={manifest.weights} tiers={manifest.tiers} onClose={() => setOpen(null)} />
      )}
    </div>
  );
}

/** The #1 set, large: the listing itself, every need as a chip, what it leaves out, the size floor and the fit verdict, and the exact page to buy it on. */
function TopCard({ bag, cand, meta, shards, onOpen }: { bag: PackBag; cand: SetCandidate; meta: CategoryMeta | undefined; shards: number; onOpen: () => void }) {
  const { row, cover } = cand;
  const size = row.pk ?? null;
  const detail = useDetail(cand.category, row.id, shards);
  const main = bag.compartments[0];
  return (
    <article className="card mt-5 p-4 sm:p-6" aria-label="The one listing to buy" data-top-set={row.id}>
      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_200px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-[13px] font-bold text-accent">{row.b}</span>
            <EvidenceBadge status={row.ev} verified={row.vf} />
            <ScoreBadge score={row.s} />
          </div>
          <button type="button" onClick={onOpen} className="mt-1 block w-full min-w-0 text-left"><h3 className="break-words text-[19px] font-extrabold leading-snug text-display sm:text-[22px]">{row.m}</h3></button>
          <p className="mt-1 text-[13px] text-secondary">{row.q} · {storeLabel(row.st)} · listed under {meta?.label.toLowerCase() ?? cand.category}</p>
          <p className="mono mt-2 text-[24px] font-extrabold text-display">{rupees(row.p)}</p>

          <div className="mt-4 rounded-lg bg-raised p-4">
            <p className="inline-flex items-center gap-1.5 text-[14px] font-extrabold text-display"><Layers size={15} aria-hidden />Covers {cand.covered.length} of {bag.roles.length} needs{size && size.n > 1 ? ` · ${size.n} pieces stated` : ''}</p>
            <RoleCoverage roles={bag.roles} covered={new Set(cover.r)} className="mt-2" />
            <p className="mt-2"><CoverTier cover={cover} /></p>
            {cand.missing.length > 0
              ? <p className="mt-2 text-[13px] text-secondary">Not in this set: <span className="font-bold text-display">{cand.missing.map((r) => r.label).join(', ')}</span>.</p>
              : <p className="mt-2 text-[13px] text-secondary">Every need has a named piece in this set.</p>}
          </div>

          <dl className="mt-3 grid gap-3 text-[13px] sm:grid-cols-2">
            <div className="rounded-lg border border-line p-3">
              <dt className="label">Counted size</dt>
              <dd className="mono mt-0.5 font-extrabold text-display">{size ? <>{dims(size.d)}{size.n > 1 ? ` + ${size.n - 1} smaller ≈ ${litres(litresOf(size, 1))}` : ` = ${litres(litresOf(size, 1))}`}</> : 'No accepted size — not counted'}</dd>
              {size && size.n > 1 && <dd className="mt-1 text-[11px] text-muted">A set's stated size is often the folded pack, not its largest cube — read the litres as a floor.</dd>}
            </div>
            <div className="rounded-lg border border-line p-3">
              <dt className="label">In the {main.label.toLowerCase()} ({main.litres} L rated · {Math.round(main.litres * main.usable)} L usable)</dt>
              <dd className="mt-0.5">{cand.fit ? <FitBadge status={cand.fit} /> : <span className="font-bold text-muted">Fit unknown — no accepted size</span>}</dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-col gap-3">
          <button type="button" onClick={onOpen} className="press h-[220px] w-full overflow-hidden rounded-lg bg-white ring-1 ring-line" aria-label={`Open details for ${row.b} ${row.m}`}>
            <img src={row.img} alt="" decoding="async" width={200} height={220} className="h-full w-full object-contain p-2" />
          </button>
          {detail.status === 'ready'
            ? <a href={detail.data.buyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-accent h-11 px-4 no-underline">Open on {storeLabel(detail.data.buyStore)}<ArrowUpRight size={14} aria-hidden /></a>
            : <span className="btn h-11 cursor-default px-4 text-muted">{detail.status === 'error' ? 'Listing link unavailable' : 'Loading listing link…'}</span>}
          <button type="button" onClick={onOpen} className="btn h-10 px-4">Evidence & spec table</button>
        </div>
      </div>
    </article>
  );
}
