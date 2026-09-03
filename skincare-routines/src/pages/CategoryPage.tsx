import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useCategory, useManifest } from '../data/hooks';
import { applyFilter, liveCountsByGroup } from '../domain/filter';
import { sortPositions } from '../domain/sort';
import { useFilterState } from '../state/useFilterState';
import { useDevPublish } from '../components/dev/devStore';
import { AppLink } from '../components/ui/AppLink';
import { Kicker, StatusBlock, ZoneBadge } from '../components/ui/primitives';
import { Sheet } from '../components/ui/Sheet';
import { ScopeControl } from '../components/category/ScopeControl';
import { FilterPanel } from '../components/category/FilterPanel';
import { ActiveChips } from '../components/category/ActiveChips';
import { Toolbar } from '../components/category/Toolbar';
import { ProductList } from '../components/category/ProductList';
import { ProductSheet } from '../components/category/ProductSheet';
import { CompareTray } from '../components/category/CompareTray';
import { ProtocolIntro } from '../components/category/ProtocolIntro';
import type { ScopeKey } from '../components/category/ProductCard';
import type { CategoryMeta } from '../lib/types';

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
  const navigate = useNavigate();

  const meta: CategoryMeta | undefined = manifest.status === 'ready' ? manifest.data.categories.find((c) => c.id === id) : undefined;
  const idx = cat.status === 'ready' ? cat.data : null;

  const matched = useMemo(() => (idx ? applyFilter(idx, state) : new Uint32Array()), [idx, state]);
  const positions = useMemo(() => (idx ? sortPositions(idx.items, matched, state.sort) : matched), [idx, matched, state.sort]);
  const live = useMemo(() => (idx ? liveCountsByGroup(idx, state, matched) : { base: new Uint32Array(), byGroup: new Map<string, Uint32Array>() }), [idx, state, matched]);

  const scopeSelected = state.tags.filter((t) => t.startsWith('scope:'));
  const stepSelected = state.tags.filter((t) => t.startsWith('step:'));
  const onOpen = useCallback((pid: string) => setOpenId(pid), []);
  const onCompare = useCallback((pid: string) => setCompare((c) => (c.includes(pid) ? c.filter((x) => x !== pid) : c.length >= COMPARE_MAX ? c : [...c, pid])), []);
  const onQuery = useCallback((q: string) => update({ query: q }), [update]);
  const onPrice = useCallback((v: number | null) => update({ priceMax: v }), [update]);

  useDevPublish(isDev, {
    page: 'category', category: id, records: idx?.items.length ?? null, matched: matched.length, sort: state.sort,
    filters: state.tags.join(', ') || '—', matchAllGroups: state.allGroups.join(', ') || '—', priceMax: state.priceMax, query: state.query || '—',
    facetGroups: idx ? Object.keys(idx.facets).length : null, tagVocabulary: idx?.tagIndex.length ?? null, compare: compare.length,
    weights: manifest.status === 'ready' ? JSON.stringify(manifest.data.weights) : null,
  });

  if (manifest.status === 'error') return <StatusBlock title="Could not load the product index" body={manifest.error} />;
  if (manifest.status === 'ready' && !meta) return <StatusBlock title="Unknown category" body={`No ranked category called “${id}”.`} />;
  if (cat.status === 'error') return <StatusBlock title={`Could not load ${meta?.label ?? id}`} body={cat.error} />;
  if (!idx || !meta || manifest.status !== 'ready') return <StatusBlock title={`Loading ${meta?.label ?? 'category'}…`} body="Fetching the ranked listings for this category only." />;

  const m = manifest.data;
  const openRow = openId ? idx.items.find((r) => r.id === openId) ?? null : null;
  const scopeOf = (t: number[]): ScopeKey => { for (const s of ['face', 'body', 'both', 'unstated'] as ScopeKey[]) { const p = idx.tagPos.get(`scope:${s}`); if (p !== undefined && t.includes(p)) return s; } return 'unstated'; };
  const compareRows = compare.map((cid) => idx.items.find((r) => r.id === cid)).filter((r): r is NonNullable<typeof r> => !!r);
  const rankOf = (pid: string) => { const p = idx.items.findIndex((r) => r.id === pid); return p >= 0 ? idx.rank[p] : 0; };
  const isProtocol = meta.kicker === 'PROTOCOL';

  const panel = (
    <FilterPanel idx={idx} groups={m.groups} order={meta.facets} live={live} state={state}
      onToggle={toggleTag} onToggleAll={toggleAll} onClearGroup={clearGroup} onPrice={onPrice} />
  );

  return (
    <div className="pb-24">
      <header className="pt-6 sm:pt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <AppLink to="/products" className="label inline-flex items-center gap-1 hover:text-primary"><ChevronLeft size={14} />All categories</AppLink>
          <label className="flex items-center gap-2">
            <span className="label">Jump to</span>
            <select className="field" value={id} aria-label="Switch category" onChange={(e) => navigate(`/c/${e.target.value}${isDev ? '?dev=1' : ''}`)}>
              {m.categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3"><Kicker>{meta.kicker}</Kicker><ZoneBadge zone={meta.zone} /></div>
            <h1 className="mt-2 text-[clamp(30px,4.5vw,52px)] leading-[1.02] text-display">{meta.label}</h1>
            <p className="mt-3 text-[15px] text-secondary">{meta.blurb}</p>
            
          </div>
          <dl className="grid grid-cols-3 gap-4 text-right lg:gap-6">
            <div><dt className="label">Listings</dt><dd className="display text-[36px]">{idx.items.length.toLocaleString('en-IN')}</dd></div>
            <div><dt className="label">Brands</dt><dd className="display text-[36px]">{idx.brands.length.toLocaleString('en-IN')}</dd></div>
            <div><dt className="label">Filters</dt><dd className="display text-[36px]">{idx.tagIndex.length}</dd></div>
          </dl>
        </div>
      </header>

      {isProtocol && (
        <section className="mt-8" aria-labelledby="protocol-h">
          <h2 id="protocol-h" className="label mb-3">The 4-step protocol · pick a step to filter</h2>
          <ProtocolIntro rows={idx.facets.step ?? []} selected={stepSelected} onToggle={toggleTag} />
        </section>
      )}

      <div className="sticky top-14 z-30 -mx-4 mt-8 border-b border-line bg-black/85 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <ScopeControl rows={idx.facets.scope ?? []} selected={scopeSelected} onToggle={toggleTag} onClear={() => clearGroup('scope')} />
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[300px_1fr]">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="scrollbar-thin sticky top-[128px] max-h-[calc(100dvh-140px)] overflow-y-auto pr-1">
            <div className="mb-3 flex items-center justify-between"><h2 className="label !text-primary">Filters</h2>{activeCount > 0 && <button type="button" className="label hover:text-primary" onClick={clearAll}>Clear all ({activeCount})</button>}</div>
            {panel}
          </div>
        </aside>
        <div className="min-w-0 space-y-4">
          <Toolbar idx={idx} featured={meta.featured} selected={state.tags} live={live} sort={state.sort} onSort={(k) => update({ sort: k })}
            query={state.query} onQuery={onQuery} onToggle={toggleTag} onOpenFilters={() => setFiltersOpen(true)} activeCount={activeCount} resultCount={positions.length} />
          <ActiveChips idx={idx} groups={m.groups} state={state} onRemove={toggleTag} onPrice={onPrice} onQuery={onQuery} onClearAll={clearAll} />
          {positions.length === 0 ? (
            <StatusBlock title="No listing matches every filter" body="Nothing in the captured data fits this combination. Loosen a filter, switch a group to “match any”, or clear all."
              action={<button type="button" className="btn btn-primary" onClick={clearAll}>Clear all filters</button>} />
          ) : (
            <ProductList idx={idx} positions={positions} compare={compare} compareMax={COMPARE_MAX} onOpen={onOpen} onCompare={onCompare} />
          )}
        </div>
      </div>

      <Sheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title={`Filters · ${positions.length.toLocaleString('en-IN')} results`}>
        <div className="mb-3 flex items-center justify-between"><span className="label">OR within a group · AND across groups</span>{activeCount > 0 && <button type="button" className="label hover:text-primary" onClick={clearAll}>Clear all</button>}</div>
        {panel}
        <button type="button" className="btn btn-primary mt-4 w-full" onClick={() => setFiltersOpen(false)}>Show {positions.length.toLocaleString('en-IN')} results</button>
      </Sheet>

      <ProductSheet category={id} shards={m.shards} row={openRow} rank={openRow ? rankOf(openRow.id) : 0} scope={openRow ? scopeOf(openRow.t) : 'unstated'} weights={m.weights} onClose={() => setOpenId(null)} />
      <CompareTray category={id} shards={m.shards} rows={compareRows} ranks={compareRows.map((r) => rankOf(r.id))} onRemove={onCompare} onClear={() => setCompare([])} />
    </div>
  );
}
