import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { toast } from '../state/toastStore';
import type { ViewState } from '../state/useFilterState';
import { useCategory, useManifest } from '../data/hooks';
import { applyFilter, liveCountsByGroup } from '../domain/filter';
import { sortPositions } from '../domain/sort';
import { useFilterState } from '../state/useFilterState';
import { useDevPublish } from '../components/dev/devStore';
import { AppLink } from '../components/ui/AppLink';
import { Kicker, NumberTicker, SectionHead, SkeletonRows, StatusBlock, ZoneBadge } from '../components/ui/primitives';
import { EmptyResults } from '../components/category/EmptyResults';
import { Sheet } from '../components/ui/Sheet';
import { ScopeControl } from '../components/category/ScopeControl';
import { FilterPanel } from '../components/category/FilterPanel';
import { ActiveChips } from '../components/category/ActiveChips';
import { Toolbar } from '../components/category/Toolbar';
import { ProductList } from '../components/category/ProductList';
import { ProductSheet } from '../components/category/ProductSheet';
import { CompareTray } from '../components/category/CompareTray';
import { ProtocolIntro } from '../components/category/ProtocolIntro';
import { BenchmarkCard } from '../components/category/BenchmarkCard';
import type { CategoryMeta } from '../lib/types';
import { placeResolver } from '../domain/index';

const COMPARE_MAX = 4;

export default function CategoryPage() {
  const { id = '' } = useParams();
  return <CategoryView key={id} id={id} />;
}

function CategoryView({ id }: { id: string }) {
  const manifest = useManifest();
  const cat = useCategory(id);
  const { state, update, toggleTag, toggleAll, clearGroup, clearAll, activeCount, isDev } = useFilterState();
  const [openId, setOpenId] = useState<string | null>(null);
  const [compare, setCompare] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const navigate = useNavigate();

  const meta: CategoryMeta | undefined = manifest.status === 'ready' ? manifest.data.categories.find((c) => c.id === id) : undefined;
  const bench = manifest.status === 'ready' ? manifest.data.benchmarks.find((b) => b.category === id) : undefined;
  const idx = cat.status === 'ready' ? cat.data : null;

  const matched = useMemo(() => (idx ? applyFilter(idx, state) : new Uint32Array()), [idx, state]);
  const positions = useMemo(() => (idx ? sortPositions(idx.items, matched, state.sort) : matched), [idx, matched, state.sort]);
  const live = useMemo(() => (idx ? liveCountsByGroup(idx, state, matched) : { base: new Uint32Array(), byGroup: new Map<string, Uint32Array>() }), [idx, state, matched]);

  const scopeGroup = meta?.scopeGroup ?? 'scope';
  const scopeSelected = state.tags.filter((t) => t.startsWith(`${scopeGroup}:`));
  const stepSelected = state.tags.filter((t) => t.startsWith('step:'));
  const onOpen = useCallback((pid: string) => setOpenId(pid), []);
  const onCompare = useCallback((pid: string) => {
    if (compare.includes(pid)) { setCompare(compare.filter((x) => x !== pid)); return; }
    if (compare.length >= COMPARE_MAX) { toast(`Compare holds ${COMPARE_MAX} products — remove one first`); return; }
    const next = [...compare, pid];
    setCompare(next);
    toast(`Added to compare (${next.length} of ${COMPARE_MAX})`, next.length >= 2 ? { label: 'Compare now', run: () => setCompareOpen(true) } : undefined);
  }, [compare]);
  /** Memento: clearing keeps a snapshot so the toast's Undo can restore the exact filter set. */
  const clearAllWithUndo = useCallback(() => {
    const snapshot: ViewState = { ...state };
    clearAll();
    toast('All filters cleared', { label: 'Undo', run: () => update(snapshot) });
  }, [state, clearAll, update]);
  const onQuery = useCallback((q: string) => update({ query: q }), [update]);
  const onPrice = useCallback((v: number | null) => update({ priceMax: v }), [update]);

  useDevPublish(isDev, {
    page: 'category', category: id, records: idx?.items.length ?? null, matched: matched.length, sort: state.sort,
    filters: state.tags.join(', ') || '—', matchAllGroups: state.allGroups.join(', ') || '—', priceMax: state.priceMax, query: state.query || '—',
    facetGroups: idx ? Object.keys(idx.facets).length : null, tagVocabulary: idx?.tagIndex.length ?? null, compare: compare.length,
    benchmark: bench ? `${bench.brand} ${bench.name} → ${bench.market.status === 'not-found' ? 'not sold in India' : `${bench.market.status} #${bench.market.rank} (${bench.market.id})`}` : null,
    weights: manifest.status === 'ready' ? JSON.stringify(manifest.data.weights) : null,
  });

  if (manifest.status === 'error') return <StatusBlock title="Could not load the product index" body={manifest.error} />;
  if (manifest.status === 'ready' && !meta) return <StatusBlock title="Unknown category" body={`No ranked category called “${id}”.`} />;
  if (cat.status === 'error') return <StatusBlock title={`Could not load ${meta?.label ?? id}`} body={cat.error} />;
  if (!idx || !meta || manifest.status !== 'ready') return <LoadingCategory label={meta?.label} />;

  const m = manifest.data;
  const openRow = openId ? idx.items.find((r) => r.id === openId) ?? null : null;
  const scopeOf = placeResolver(idx, scopeGroup);
  const compareRows = compare.map((cid) => idx.items.find((r) => r.id === cid)).filter((r): r is NonNullable<typeof r> => !!r);
  const rankOf = (pid: string) => { const p = idx.items.findIndex((r) => r.id === pid); return p >= 0 ? idx.rank[p] : 0; };
  const isProtocol = meta.kicker === 'PROTOCOL';

  const panel = (
    <FilterPanel idx={idx} groups={m.groups} order={meta.facets} live={live} state={state}
      onToggle={toggleTag} onToggleAll={toggleAll} onClearGroup={clearGroup} onPrice={onPrice} />
  );

  return (
    <div className="pb-24">
      <header className="pt-6 sm:pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <AppLink to="/products" className="inline-flex items-center gap-1 text-[13px] font-bold text-secondary no-underline hover:text-display"><ChevronLeft size={14} />All categories</AppLink>
          <label className="flex min-w-0 max-w-full items-center gap-2">
            <span className="label shrink-0">Jump to</span>
            <select className="field min-w-0 max-w-[min(70vw,320px)] truncate" value={id} aria-label="Switch category" onChange={(e) => navigate(`/c/${e.target.value}${isDev ? '?dev=1' : ''}`)}>
              {m.categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3"><Kicker>{meta.kicker}</Kicker><ZoneBadge zone={meta.zone} /></div>
            <h1 className="mt-3 text-[clamp(32px,4.8vw,56px)] leading-[1.02] text-display">{meta.label}</h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-secondary sm:text-[16px]">{meta.blurb}</p>
          </div>
          <dl className="grid grid-cols-3 gap-3 sm:gap-4">
            {[['Listings', idx.items.length], ['Brands', idx.brands.length], ['Filter tags', idx.tagIndex.length]].map(([k, n]) => (
              <div key={k} className="card px-4 py-3 sm:min-w-[120px]"><dt className="label">{k}</dt><dd className="mt-0.5 text-[24px] font-extrabold text-display sm:text-[28px]"><NumberTicker value={Number(n)} /></dd></div>
            ))}
          </dl>
        </div>
      </header>

      {isProtocol && (
        <section className="mt-10" aria-labelledby="protocol-h">
          <SectionHead id="protocol-h" title="The 4-step plan" sub="Pick a step to see only the products for that stage. Steps stack with every other filter." />
          <ProtocolIntro rows={idx.facets.step ?? []} selected={stepSelected} onToggle={toggleTag} />
        </section>
      )}

      <div className="glass sticky top-16 z-30 -mx-4 mt-8 border-b border-line px-4 py-3 sm:-mx-6 sm:px-6">
        <ScopeControl group={scopeGroup} rows={idx.facets[scopeGroup] ?? []} selected={scopeSelected} onToggle={toggleTag} onClear={() => clearGroup(scopeGroup)} />
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="scrollbar-thin sticky top-[136px] max-h-[calc(100dvh-152px)] overflow-y-auto pr-1">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-[16px] font-extrabold text-display">Filters</h2>{activeCount > 0 && <button type="button" className="label !text-accent hover:underline" onClick={clearAllWithUndo}>Clear all ({activeCount})</button>}</div>
            {panel}
          </div>
        </aside>
        <div className="min-w-0 space-y-4">
          {bench && <BenchmarkCard bench={bench} onOpenListing={onOpen} />}
          <Toolbar idx={idx} zone={meta.zone} featured={meta.featured} selected={state.tags} live={live} sort={state.sort} onSort={(k) => update({ sort: k })}
            query={state.query} onQuery={onQuery} onToggle={toggleTag} onOpenFilters={() => setFiltersOpen(true)} activeCount={activeCount} resultCount={positions.length} />
          <ActiveChips idx={idx} groups={m.groups} state={state} onRemove={toggleTag} onPrice={onPrice} onQuery={onQuery} onClearAll={clearAllWithUndo} />
          {positions.length === 0 ? (
            <EmptyResults idx={idx} groups={m.groups} state={state} onRemove={toggleTag} onPrice={onPrice} onQuery={onQuery} onClearAll={clearAllWithUndo} />
          ) : (
            <ProductList idx={idx} scopeGroup={scopeGroup} positions={positions} compare={compare} compareMax={COMPARE_MAX} onOpen={onOpen} onCompare={onCompare} />
          )}
        </div>
      </div>

      <Sheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title={`Filters · ${positions.length.toLocaleString('en-IN')} results`}
        footer={
          <div className="flex items-center gap-3">
            {activeCount > 0 && <button type="button" className="btn h-12 shrink-0" onClick={clearAllWithUndo}>Clear {activeCount}</button>}
            <button type="button" className="btn btn-accent h-12 flex-1" onClick={() => setFiltersOpen(false)} disabled={positions.length === 0}>
              {positions.length === 0 ? 'No results — loosen a filter' : `Show ${positions.length.toLocaleString('en-IN')} results`}
            </button>
          </div>
        }>
        <p className="mb-3 text-[12px] text-muted">Any within a group · all groups together</p>
        {panel}
      </Sheet>

      <ProductSheet category={id} zone={meta.zone} shards={m.shards} row={openRow} rank={openRow ? rankOf(openRow.id) : 0} scope={scopeOf(openRow?.t ?? [])} weights={m.weights} sources={m.sources} onClose={() => setOpenId(null)} />
      <CompareTray category={id} zone={meta.zone} shards={m.shards} rows={compareRows} ranks={compareRows.map((r) => rankOf(r.id))} onRemove={onCompare} onClear={() => setCompare([])}
        open={compareOpen} onOpenChange={setCompareOpen} />
    </div>
  );
}

/** Booking "search loading": header ghost + six ranked-row skeletons in the final layout. */
function LoadingCategory({ label }: { label?: string }) {
  return (
    <div className="pb-24 pt-6 sm:pt-8" aria-busy>
      <p className="text-[13px] font-bold text-secondary">{label ? `Loading ${label}…` : 'Loading category…'}</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="space-y-3"><div className="h-3 w-24 animate-pulse rounded bg-raised" /><div className="h-12 w-2/3 animate-pulse rounded-lg bg-raised" /><div className="h-4 w-1/2 animate-pulse rounded bg-raised" /></div>
        <div className="grid grid-cols-3 gap-3">{[0, 1, 2].map((i) => <div key={i} className="card h-[72px] animate-pulse sm:min-w-[120px]" />)}</div>
      </div>
      <div className="mt-10 grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="hidden space-y-3 lg:block">{[0, 1, 2, 3].map((i) => <div key={i} className="card h-28 animate-pulse" />)}</div>
        <SkeletonRows />
      </div>
    </div>
  );
}
