import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useManifest, useRoutines } from '../data/hooks';
import { useRoutineState } from '../state/useRoutineState';
import { filterRoutines, ROUTINE_CATEGORIES, ROUTINE_CATEGORY_ORDER, ROUTINE_WEIGHTS } from '../domain/routines';
import { useDevPublish } from '../components/dev/devStore';
import { Hero } from '../components/layout/Hero';
import { Reveal } from '../components/fx/Reveal';
import { AppLink } from '../components/ui/AppLink';
import { StatusBlock } from '../components/ui/primitives';
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
  const grouped = state.sort === 'score' && state.categories.length === 0;

  useDevPublish(isDev, { page: 'routines', records: items.length, matched: shown.length, sort: state.sort, categories: state.categories.join(', ') || '—', phases: state.phases.join(', ') || '—', maxSteps: state.maxSteps, query: state.query || '—', weights: JSON.stringify(ROUTINE_WEIGHTS) });

  if (routines.status === 'error') return <StatusBlock title="Could not load routines" body={routines.error} />;
  if (routines.status === 'loading') return <StatusBlock title="Loading routines…" />;
  const open = openId ? items.find((r) => r.id === openId) ?? null : null;

  return (
    <div className="pb-16">
      <Hero kicker="Published skincare routines · ranked" number={String(items.length)} matrix
        title="Routines with a source behind them, scored on evidence first."
        lede={`${items.length} routines transcribed from dermatology bodies, named methods and regional traditions, mapped onto a 22-phase model. Scored on evidence 30 · coverage 24 · adherence 20 · skin-type fit 14 · time 12.`}>
        <AppLink to="/products" className="btn btn-primary">Product rankings <ArrowRight size={14} /></AppLink>
      </Hero>

      <section className="mt-10" aria-labelledby="routines-h">
        <h2 id="routines-h" className="sr-only">Routines</h2>
        <RoutineFilters items={items} state={state} onToggle={toggle} onUpdate={update} onClearAll={clearAll} activeCount={activeCount} resultCount={shown.length} />
        {shown.length === 0 ? (
          <div className="mt-8"><StatusBlock title="No routine matches every filter" body="Loosen a phase or type filter, or clear all." action={<button type="button" className="btn btn-primary" onClick={clearAll}>Clear all filters</button>} /></div>
        ) : grouped ? (
          <div className="mt-8 space-y-12">
            {ROUTINE_CATEGORY_ORDER.map((c) => {
              const rows = shown.filter((r) => r.category === c);
              if (!rows.length) return null;
              const meta = ROUTINE_CATEGORIES[c];
              return (
                <section key={c} aria-labelledby={`rc-${c}`}>
                  <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
                    <div><h3 id={`rc-${c}`} className="text-[24px] text-display">{meta.label}</h3><p className="mt-1 text-[13px] text-secondary">{meta.blurb}</p></div>
                    <span className="label">{rows.length} routines</span>
                  </div>
                  <Reveal className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" stagger={0.03}>
                    {rows.map((r) => <RoutineCard key={r.id} r={r} rank={rankOf.get(r.id) ?? 0} onOpen={setOpenId} />)}
                  </Reveal>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((r) => <RoutineCard key={r.id} r={r} rank={rankOf.get(r.id) ?? 0} onOpen={setOpenId} />)}
          </div>
        )}
      </section>

      {manifest.status === 'ready' && (
        <section className="mt-20 border-t border-line pt-10" aria-labelledby="products-h">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="label">Product rankings</p>
              <h2 id="products-h" className="mt-2 text-[clamp(24px,3vw,36px)] text-display">Then pick the products for each step.</h2>
              <p className="mt-2 max-w-xl text-[14px] text-secondary">{manifest.data.total.toLocaleString('en-IN')} listings from Flipkart and Amazon.in, ranked on trust, skin safety, actives and format. Face, face + body and body kept apart.</p>
            </div>
            <AppLink to="/products" className="btn">All categories <ArrowRight size={14} /></AppLink>
          </div>
          <CategorySections categories={manifest.data.categories} compact />
        </section>
      )}

      <RoutineSheet r={open} rank={open ? rankOf.get(open.id) ?? 0 : 0} onClose={() => setOpenId(null)} />
    </div>
  );
}
