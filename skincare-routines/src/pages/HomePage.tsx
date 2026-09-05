import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useManifest, useRoutines } from '../data/hooks';
import { useRoutineState } from '../state/useRoutineState';
import { filterRoutines, ROUTINE_CATEGORIES, ROUTINE_CATEGORY_ORDER, ROUTINE_WEIGHTS } from '../domain/routines';
import { useDevPublish } from '../components/dev/devStore';
import { Hero } from '../components/layout/Hero';
import { Reveal } from '../components/fx/Reveal';
import { AppLink } from '../components/ui/AppLink';
import { ScoreBadge, SectionHead, StatusBlock } from '../components/ui/primitives';
import { RoutineFilters } from '../components/routines/RoutineFilters';
import { RoutineCard } from '../components/routines/RoutineCard';
import { RoutineSheet } from '../components/routines/RoutineSheet';
import { CategorySections } from '../components/hub/CategorySections';

export default function HomePage() {
  const routines = useRoutines();
  const manifest = useManifest();
  const { state, update, toggle, clearAll, activeCount, isDev } = useRoutineState();
  const [openId, setOpenId] = useState<string | null>(null);

  const items = useMemo(() => (routines.status === 'ready' ? routines.data.items : []), [routines]);
  const rankOf = useMemo(() => { const m = new Map<string, number>(); [...items].sort((a, b) => b.score - a.score).forEach((r, i) => m.set(r.id, i + 1)); return m; }, [items]);
  const shown = useMemo(() => filterRoutines(items, state), [items, state]);
  const top3 = useMemo(() => [...items].sort((a, b) => b.score - a.score).slice(0, 3), [items]);
  const grouped = state.sort === 'score' && state.categories.length === 0;

  useDevPublish(isDev, { page: 'routines', records: items.length, matched: shown.length, sort: state.sort, categories: state.categories.join(', ') || '—', phases: state.phases.join(', ') || '—', maxSteps: state.maxSteps, query: state.query || '—', weights: JSON.stringify(ROUTINE_WEIGHTS) });

  if (routines.status === 'error') return <StatusBlock title="Could not load routines" body={routines.error} />;
  if (routines.status === 'loading') return <StatusBlock title="Loading routines…" />;
  const open = openId ? items.find((r) => r.id === openId) ?? null : null;

  return (
    <div className="pb-16">
      <Hero kicker="Published skincare routines · ranked"
        title="Routines with a source behind them, scored on evidence first."
        lede="Transcribed from dermatology bodies, named methods and regional traditions, then mapped onto one 22-phase model so they can be compared step for step."
        proofs={[`${items.length} published routines`, 'Evidence 30 · coverage 24 · adherence 20 · fit 14 · time 12', manifest.status === 'ready' ? `${manifest.data.total.toLocaleString('en-IN')} real listings behind the product picks` : 'Products ranked from real listings']}
        aside={top3.length > 0 && (
          <div className="card p-5" aria-labelledby="top3-h">
            <p id="top3-h" className="label">Top ranked right now</p>
            <ol className="mt-3 divide-y divide-line">
              {top3.map((r, i) => (
                <li key={r.id}>
                  <button type="button" onClick={() => setOpenId(r.id)} className="press flex w-full items-center gap-3 py-3 text-left" aria-label={`Open ${r.brand} ${r.model}`}>
                    <span className="mono w-5 text-[15px] font-extrabold text-muted">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] font-bold text-accent">{r.brand}</span>
                      <span className="block truncate text-[14px] font-bold text-display">{r.model}</span>
                    </span>
                    <ScoreBadge score={r.score} showVerdict={false} />
                  </button>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-[12px] text-muted">Scores out of 100 · evidence-weighted</p>
          </div>
        )}>
        <a href="#routines-h" className="btn btn-accent h-12 px-6 no-underline">Browse routines</a>
        <AppLink to="/products" className="btn h-12 px-6">Product rankings <ArrowRight size={14} /></AppLink>
      </Hero>

      <section className="mt-10" aria-labelledby="routines-h">
        <SectionHead id="routines-h" title="Pick a routine" sub="Grouped by type. Every one links back to its published source." />
        <RoutineFilters items={items} state={state} onToggle={toggle} onUpdate={update} onClearAll={clearAll} activeCount={activeCount} resultCount={shown.length} />
        {shown.length === 0 ? (
          <div className="mt-8"><StatusBlock title="No routine matches every filter" body="Loosen a phase or type filter, or clear all." action={<button type="button" className="btn btn-accent" onClick={clearAll}>Clear all filters</button>} /></div>
        ) : grouped ? (
          <div className="mt-8 space-y-12">
            {ROUTINE_CATEGORY_ORDER.map((c) => {
              const rows = shown.filter((r) => r.category === c);
              if (!rows.length) return null;
              const meta = ROUTINE_CATEGORIES[c];
              return (
                <section key={c} aria-labelledby={`rc-${c}`}>
                  <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                    <div><h3 id={`rc-${c}`} className="text-[20px] text-display">{meta.label}</h3><p className="mt-1 text-[13px] text-secondary">{meta.blurb}</p></div>
                    <span className="label">{rows.length} routines</span>
                  </div>
                  <Reveal className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" stagger={0.03}>
                    {rows.map((r) => <RoutineCard key={r.id} r={r} rank={rankOf.get(r.id) ?? 0} onOpen={setOpenId} />)}
                  </Reveal>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((r) => <RoutineCard key={r.id} r={r} rank={rankOf.get(r.id) ?? 0} onOpen={setOpenId} />)}
          </div>
        )}
      </section>

      {manifest.status === 'ready' && (
        <section className="-mx-4 mt-20 rounded-[24px] bg-surface px-4 py-12 sm:-mx-6 sm:px-6 lg:px-10" aria-labelledby="products-h">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="label !text-accent">Product rankings</p>
              <h2 id="products-h" className="mt-2 text-[clamp(26px,3.4vw,40px)] leading-tight text-display">Then pick the products for each step.</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-secondary">{manifest.data.total.toLocaleString('en-IN')} listings from Flipkart and Amazon.in, ranked on the verified ingredient list, safety, maker transparency and buyer evidence — seller claims score 0. Face, body and hair & scalp kept apart.</p>
            </div>
            <AppLink to="/products" className="btn h-11 px-5">All categories <ArrowRight size={14} /></AppLink>
          </div>
          <CategorySections categories={manifest.data.categories} compact />
        </section>
      )}

      <RoutineSheet r={open} rank={open ? rankOf.get(open.id) ?? 0 : 0} onClose={() => setOpenId(null)} />
    </div>
  );
}
