import { useCallback, useMemo, useState } from 'react';
import { ArrowUpRight, Eraser, Sparkles, TriangleAlert } from 'lucide-react';
import { useManifest, useCategories } from '../data/hooks';
import { StatusBlock, Kicker, SkeletonRows } from '../components/ui/primitives';
import { Hero } from '../components/layout/Hero';
import { ProductSheet } from '../components/category/ProductSheet';
import { CompartmentGauge, FitBadge } from '../components/plan/planUi';
import { RoleCard } from '../components/plan/RoleCard';
import { SetPicker } from '../components/plan/SetPicker';
import { segmentResolver } from '../domain/index';
import { autoFill, litres, summarise } from '../domain/pack';
import { TIER_META } from '../domain/scoreMeta';
import { replacePicks, clearPlan, usePlan, SET_ROLE } from '../state/planStore';
import { toast } from '../state/toastStore';
import { rupees } from '../lib/format';
import type { CategoryMeta, Manifest, PackBag, ProductRow } from '../lib/types';
import type { CategoryIndex } from '../domain/index';

export default function PlanPage() {
  const manifest = useManifest();
  if (manifest.status === 'loading') return <SkeletonRows count={4} />;
  if (manifest.status === 'error') return <StatusBlock title="Could not load the index" body={manifest.error} />;
  const bag = manifest.data.pack;
  if (!bag) return <StatusBlock title="No packing plan in this build" body="The planner ships only when every organiser role's category is part of the site." />;
  return <Planner manifest={manifest.data} bag={bag} />;
}

function Planner({ manifest, bag }: { manifest: Manifest; bag: PackBag }) {
  const categoryIds = useMemo(() => [...new Set(bag.roles.map((r) => r.category))], [bag]);
  const cats = useCategories(categoryIds);
  const picks = usePlan(bag.id);
  const [open, setOpen] = useState<{ category: string; id: string } | null>(null);

  const metaOf = useMemo(() => new Map(manifest.categories.map((c) => [c.id, c])), [manifest]);
  const byId = useMemo(() => {
    const m = new Map<string, Map<string, ProductRow>>();
    if (cats.status === 'ready') for (const [cid, idx] of Object.entries(cats.data)) m.set(cid, new Map(idx.items.map((r) => [r.id, r])));
    return m;
  }, [cats]);
  const rowOf = useCallback((category: string, id: string) => byId.get(category)?.get(id), [byId]);
  const rowsOf = useCallback((category: string) => (cats.status === 'ready' ? cats.data[category]?.items : undefined), [cats]);
  const summary = useMemo(() => summarise(bag, picks, rowOf), [bag, picks, rowOf]);

  const fill = () => {
    const { picks: next, unfilled } = autoFill(bag, picks, rowsOf);
    replacePicks(bag.id, next);
    const added = next.filter((p) => p.active).length - picks.filter((p) => p.active).length;
    toast(added ? `${added} role${added === 1 ? '' : 's'} filled with the best-scored organiser that fits and states a verified size${unfilled.length ? ` · ${unfilled.length} left open` : ''}` : unfilled.length ? 'Nothing fits the remaining budget with a verified size' : 'Every role already has a pick');
  };
  const clear = () => { const prev = picks; clearPlan(); toast('Plan cleared', { label: 'Undo', run: () => replacePicks(bag.id, prev) }); };

  const openRow = open ? rowOf(open.category, open.id) ?? null : null;
  const openMeta: CategoryMeta | undefined = open ? metaOf.get(open.category) : undefined;
  const openIdx: CategoryIndex | undefined = open && cats.status === 'ready' ? cats.data[open.category] : undefined;
  const segOf = openIdx && openMeta ? segmentResolver(openIdx, openMeta.segment) : null;
  const rankOf = (idx: CategoryIndex, row: ProductRow) => { const pos = idx.items.indexOf(row); return pos >= 0 ? idx.rank[pos] : 0; };

  const active = picks.filter((p) => p.active).length;
  const placedRoles = bag.roles.filter((r) => summary.covered.has(r.id) || picks.some((p) => p.active && p.roleId === r.id)).length;
  const setRow = summary.set?.row ?? null;
  return (
    <div className="pb-24">
      <Hero
        kicker={`Packing plan · ${bag.brand} ${bag.name}`}
        title="One set for most of it, or one organiser per job — checked against the bag’s own numbers."
        lede="Start with an all-in-one set whose stated contents cover the most roles (cubes, shoe bag, toiletry pouch, laundry bag…), then fill whatever it leaves out — clothes, shoes, slippers, skincare, tech, laundry, documents — from the ranked lists. Everything is charged to the main body or the day pack at its stated size; unstated sizes are shown as uncounted rather than guessed."
        proofs={[`${bag.roles.length} roles`, `${bag.compartments.map((c) => `${c.litres} L`).join(' + ')} budgets from tripole.in`, `${categoryIds.reduce((n, id) => n + (metaOf.get(id)?.sets ?? 0), 0).toLocaleString('en-IN')} multi-role sets`, `${categoryIds.reduce((n, id) => n + (metaOf.get(id)?.sized ?? 0), 0).toLocaleString('en-IN')} listings with an accepted size`]}
        aside={<BagCard bag={bag} />}
      >
        <button type="button" onClick={fill} className="btn btn-accent h-11 px-5" disabled={cats.status !== 'ready'}><Sparkles size={16} aria-hidden />{active ? 'Fill the open roles' : 'Fill every role with the best fit'}</button>
        {active > 0 && <button type="button" onClick={clear} className="btn h-11 px-5"><Eraser size={16} aria-hidden />Clear plan</button>}
      </Hero>

      <section aria-labelledby="fit" className="mb-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <Kicker>Does it fit?</Kicker>
            <h2 id="fit" className="mt-1 flex flex-wrap items-center gap-x-3 text-[22px] sm:text-[26px]">
              <FitBadge status={summary.status} size="lg" />
              <span className="text-secondary text-[15px] font-semibold">{litres(summary.total)} counted · {placedRoles} of {bag.roles.length} roles placed{setRow ? ` (${summary.covered.size} by your set)` : ''}{summary.cost ? ` · ${rupees(summary.cost)}` : ''}</span>
            </h2>
          </div>
          {summary.weakestTier && (
            <p className="label">weakest size evidence in plan: <span className="text-display">{TIER_META[summary.weakestTier].short}</span></p>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {summary.loads.map((l) => <CompartmentGauge key={l.compartment.id} load={l} />)}
        </div>
        {summary.unsizedPicks > 0 && (
          <p className="mt-3 flex items-start gap-2 text-[13px] text-warning"><TriangleAlert size={15} className="mt-0.5 shrink-0" aria-hidden />{summary.unsizedPicks} pick{summary.unsizedPicks === 1 ? '' : 's'} in the plan state{summary.unsizedPicks === 1 ? 's' : ''} no accepted size — the verdict above ignores them; swap in a sized alternative to make it count.</p>
        )}
      </section>

      {cats.status === 'ready' && (
        <SetPicker bag={bag} metaOf={metaOf} rowsOf={rowsOf} picks={picks.filter((p) => p.roleId === SET_ROLE)} summary={summary} onOpen={(category, id) => setOpen({ category, id })} />
      )}

      <section aria-labelledby="roles" className="mb-10">
        <Kicker>Roles</Kicker>
        <h2 id="roles" className="mt-1 text-[22px] sm:text-[26px]">{setRow ? 'What the set leaves out, and everything else role by role' : 'What goes in, and in which organiser'}</h2>
        <p className="mt-1 max-w-2xl text-[14px] text-secondary">{setRow ? 'Roles the set covers are folded into its one count; open roles get their own pick. ' : ''}Change quantity, move a pick between the main body and the day pack, keep alternatives and switch between them. Picks are saved on this device.</p>
        {cats.status === 'error' && <StatusBlock title="Could not load the organiser lists" body={cats.error} />}
        {cats.status === 'loading' && <div className="mt-5"><SkeletonRows count={7} /></div>}
        {cats.status === 'ready' && (
          <div className="mt-5 space-y-4">
            {bag.roles.map((role) => (
              <RoleCard key={role.id} bag={bag} role={role} meta={metaOf.get(role.category)} idx={cats.data[role.category]}
                picks={picks.filter((p) => p.roleId === role.id)} coveredBy={summary.covered.has(role.id) ? setRow : null} onOpen={(id) => setOpen({ category: role.category, id })} />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="caveats" className="card p-5">
        <h2 id="caveats" className="flex items-center gap-2 text-[16px] font-extrabold text-display"><TriangleAlert size={16} className="text-warning" aria-hidden />What this planner can and cannot tell you</h2>
        <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-secondary">
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

/** The bag, as the maker states it — the only source of the budgets on this page. */
function BagCard({ bag }: { bag: PackBag }) {
  const [failed, setFailed] = useState(false);
  return (
    <aside className="card p-4" aria-label="The bag this plan is for">
      <div className="flex gap-4">
        <div className="flex h-28 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-line">
          {failed ? <span className="px-2 text-center text-[11px] font-bold text-muted">Image unavailable</span>
            : <img src={bag.image.url} alt={`${bag.brand} ${bag.name}`} width={96} height={112} decoding="async" className="h-full w-full object-contain p-1" onError={() => setFailed(true)} />}
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-bold text-accent">{bag.brand}</p>
          <p className="mt-0.5 text-[15px] font-extrabold leading-snug text-display">{bag.name}</p>
          <a href={bag.maker.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-[13px] font-bold text-accent">{bag.maker.label}<ArrowUpRight size={13} aria-hidden /></a>
          <p className="mt-1 text-[12px] text-muted">Read {bag.checked} · image: {bag.image.source}</p>
        </div>
      </div>
      <dl className="mt-4 divide-y divide-line text-[13px]">
        {bag.facts.map((f) => (
          <div key={f.k} className="grid grid-cols-[minmax(90px,32%)_1fr] gap-3 py-2">
            <dt className="text-secondary">{f.k}</dt><dd className="font-semibold text-display">{f.v}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
