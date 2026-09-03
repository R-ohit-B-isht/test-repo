import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useCategory, useManifest } from '../data/hooks';
import { applyFilter, liveCountsByGroup } from '../domain/filter';
import { sortPositions } from '../domain/sort';
import { useFilterState } from '../state/useFilterState';
import { useDevPublish } from '../components/dev/devStore';
import { AppLink } from '../components/ui/AppLink';
import { Kicker, SectionHead, StatusBlock, ZoneBadge } from '../components/ui/primitives';
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
      <header className="pt-6 sm:pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <AppLink to="/products" className="inline-flex items-center gap-1 text-[13px] font-bold text-secondary no-underline hover:text-display"><ChevronLeft size={14} />All categories</AppLink>
          <label className="flex items-center gap-2">
            <span className="label">Jump to</span>
            <select className="field" value={id} aria-label="Switch category" onChange={(e) => navigate(`/c/${e.target.value}${isDev ? '?dev=1' : ''}`)}>
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
              <div key={k} className="card px-4 py-3 sm:min-w-[120px]"><dt className="label">{k}</dt><dd className="mono mt-0.5 text-[24px] font-extrabold text-display sm:text-[28px]">{Number(n).toLocaleString('en-IN')}</dd></div>
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
        <ScopeControl rows={idx.facets.scope ?? []} selected={scopeSelected} onToggle={toggleTag} onClear={() => clearGroup('scope')} />
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="scrollbar-thin sticky top-[136px] max-h-[calc(100dvh-152px)] overflow-y-auto pr-1">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-[16px] font-extrabold text-display">Filters</h2>{activeCount > 0 && <button type="button" className="label !text-accent hover:underline" onClick={clearAll}>Clear all ({activeCount})</button>}</div>
            {panel}
          </div>
        </aside>
        <div className="min-w-0 space-y-4">
          <Toolbar idx={idx} featured={meta.featured} selected={state.tags} live={live} sort={state.sort} onSort={(k) => update({ sort: k })}
            query={state.query} onQuery={onQuery} onToggle={toggleTag} onOpenFilters={() => setFiltersOpen(true)} activeCount={activeCount} resultCount={positions.length} />
          <ActiveChips idx={idx} groups={m.groups} state={state} onRemove={toggleTag} onPrice={onPrice} onQuery={onQuery} onClearAll={clearAll} />
          {positions.length === 0 ? (
            <StatusBlock title="No listing matches every filter" body="Nothing in the captured data fits this combination. Loosen a filter, switch a group to “match any”, or clear all."
              action={<button type="button" className="btn btn-accent" onClick={clearAll}>Clear all filters</button>} />
          ) : (
            <ProductList idx={idx} positions={positions} compare={compare} compareMax={COMPARE_MAX} onOpen={onOpen} onCompare={onCompare} />
          )}
        </div>
      </div>

      <Sheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title={`Filters · ${positions.length.toLocaleString('en-IN')} results`}>
        <div className="mb-3 flex items-center justify-between"><span className="text-[12px] text-muted">Any within a group · all groups together</span>{activeCount > 0 && <button type="button" className="label !text-accent hover:underline" onClick={clearAll}>Clear all</button>}</div>
        {panel}
        <button type="button" className="btn btn-accent mt-4 h-12 w-full" onClick={() => setFiltersOpen(false)}>Show {positions.length.toLocaleString('en-IN')} results</button>
      </Sheet>

      <ProductSheet category={id} shards={m.shards} row={openRow} rank={openRow ? rankOf(openRow.id) : 0} scope={openRow ? scopeOf(openRow.t) : 'unstated'} weights={m.weights} onClose={() => setOpenId(null)} />
      <CompareTray category={id} shards={m.shards} rows={compareRows} ranks={compareRows.map((r) => rankOf(r.id))} onRemove={onCompare} onClear={() => setCompare([])} />
    </div>
  );
}
