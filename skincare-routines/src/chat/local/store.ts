/** Browser twin of chat_api/data/store.py: the single read model the tools use. It reads the very same public/data
 * files the pages render from (through the shared fetch-once cache), so the assistant can never disagree with the UI. */
import { loadJson } from '../../data/fetchJson';
import { buildIndex, type CategoryIndex } from '../../domain/index';
import type { Benchmark, CategoryData, CategoryMeta, InciColumns, IngredientAlias, KnowledgeData, Manifest, ProductDetail, ProductRow, RoutinesData } from '../../lib/types';
import { SearchIndex } from './search';
import { loadInciColumns, loadSearchColumns } from './searchFile';

export class DataError extends Error {}

/** A loaded category with the lookups the tools need on top of the UI's own index. */
export class CategoryView {
  readonly id: string;
  readonly items: ProductRow[];
  readonly tagIndex: string[];
  readonly facets: CategoryIndex['facets'];
  readonly ranks: Uint32Array;
  readonly tagPos: Map<string, number>;
  readonly posOf = new Map<string, number>();
  readonly byRank: number[];

  constructor(idx: CategoryIndex) {
    this.id = idx.id; this.items = idx.items; this.tagIndex = idx.tagIndex; this.facets = idx.facets;
    this.ranks = idx.rank; this.tagPos = idx.tagPos;
    idx.items.forEach((it, i) => this.posOf.set(it.id, i));
    this.byRank = idx.items.map((_, i) => i).sort((a, b) => idx.rank[a] - idx.rank[b]);
  }

  tagsOf(item: ProductRow) { return item.t.map((t) => this.tagIndex[t]); }
  hasTags(item: ProductRow, wanted: number[]) { return wanted.every((t) => item.t.includes(t)); }
  /** Site filter-panel semantics: each group is one constraint (any of its tags, or all of them for `and` groups). */
  matchesTagGroups(item: ProductRow, groups: TagGroupQuery[]) {
    return groups.every((g) => (g.all ? g.tags.every((t) => item.t.includes(t)) : g.tags.some((t) => item.t.includes(t))));
  }
}

export interface TagGroupQuery { group: string; tags: number[]; all: boolean }

function shardOf(id: string, shards: number) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % shards;
}

export class LedgerStore {
  private readonly base: string;
  private readonly categories = new Map<string, CategoryView>();
  private readonly inciCols = new Map<string, Promise<InciColumns>>();
  private searchPromise: Promise<SearchIndex> | null = null;
  private manifestCache: Manifest | null = null;

  constructor(base = `${import.meta.env.BASE_URL}data/`) { this.base = base; }

  async manifest(): Promise<Manifest> {
    this.manifestCache = await loadJson<Manifest>(`${this.base}manifest.json`);
    return this.manifestCache;
  }

  categoryMeta(id: string): CategoryMeta | null {
    return this.manifestCache?.categories.find((c) => c.id === id) ?? null;
  }

  benchmarkFor(id: string): Benchmark | null {
    return this.manifestCache?.benchmarks.find((b) => b.category === id) ?? null;
  }

  async category(id: string): Promise<CategoryView> {
    await this.manifest();
    const cached = this.categories.get(id);
    if (cached) return cached;
    if (!this.categoryMeta(id)) throw new DataError(`No ranked category called '${id}'`);
    const view = new CategoryView(buildIndex(await loadJson<CategoryData>(`${this.base}${id}.json`)));
    this.categories.set(id, view);
    return view;
  }

  async detail(categoryId: string, productId: string): Promise<ProductDetail | null> {
    const m = await this.manifest();
    const shard = await loadJson<Record<string, ProductDetail>>(`${this.base}${categoryId}.d${shardOf(productId, m.shards)}.json`);
    return shard[productId] ?? null;
  }

  routines(): Promise<RoutinesData> { return loadJson<RoutinesData>(`${this.base}routines.json`); }

  /** The scorer's sourced ingredient tables + pairing guidance; absent on datasets generated before knowledge.json existed. */
  async knowledge(): Promise<KnowledgeData> {
    const m = await this.manifest();
    if (!m.knowledge) throw new DataError('This dataset was generated without the ingredient knowledge file (knowledge.json).');
    return loadJson<KnowledgeData>(`${this.base}${m.knowledge.file}`);
  }

  /** Normalised INCI / seller-ingredient columns for one category, aligned with `CategoryView.items` (fetched once). */
  inci(categoryId: string): Promise<InciColumns> {
    const cached = this.inciCols.get(categoryId);
    if (cached) return cached;
    const p = this.manifest().then(async (m) => {
      if (!m.inci) throw new DataError('This dataset was generated without ingredient columns (<category>.inci.json) — rebuild the data.');
      const cols = await loadInciColumns(`${this.base}${categoryId}.${m.inci.suffix}`, `${this.base}${categoryId}.${m.inci.gzip}`);
      if (cols.generatedAt !== m.generatedAt) throw new DataError(`Ingredient columns for ${categoryId} (${cols.generatedAt}) and manifest (${m.generatedAt}) are from different builds — reload the page.`);
      return cols;
    });
    this.inciCols.set(categoryId, p);
    p.catch(() => { this.inciCols.delete(categoryId); });
    return p;
  }

  /** Common-name → INCI alias table from knowledge.json (empty on older datasets, so plain terms still work). */
  async ingredientAliases(): Promise<IngredientAlias[]> {
    const m = await this.manifest();
    if (!m.knowledge) return [];
    return (await loadJson<KnowledgeData>(`${this.base}${m.knowledge.file}`)).ingredientAliases ?? [];
  }

  /** The cross-category index is a few MB, so it is fetched once, on the first tool that needs it. */
  search(): Promise<SearchIndex> {
    if (!this.searchPromise) {
      this.searchPromise = this.manifest().then(async (m) => {
        if (!m.search) throw new DataError('This dataset was generated without a search index (search.json).');
        const cols = await loadSearchColumns(`${this.base}${m.search.file}`, `${this.base}${m.search.gzip}`);
        if (cols.generatedAt !== m.generatedAt) throw new DataError(`Search index (${cols.generatedAt}) and manifest (${m.generatedAt}) are from different builds — reload the page.`);
        return new SearchIndex(cols);
      });
      this.searchPromise.catch(() => { this.searchPromise = null; });
    }
    return this.searchPromise;
  }
}
