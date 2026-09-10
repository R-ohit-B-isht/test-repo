/** Listing-level tools: search, ranked lists with filters, product evidence, comparison — twin of chat_api/tools/products.py. */
import type { Manifest } from '../../../lib/types';
import { DataError, type CategoryView } from '../store';
import { categoryParam, categoryUrl, clamp, productUrl, str, strList, ToolError, type Json, type Tool, type ToolContext } from './base';
import { detailSummary, hitSummary, rowSummary } from './present';

async function categoryOf(ctx: ToolContext, args: Json): Promise<CategoryView> {
  try {
    return await ctx.store.category(str(args.category));
  } catch (err) {
    if (err instanceof DataError) throw new ToolError(err.message);
    throw err;
  }
}

const categoryArg = (args: Json) => str(args.category) || null;

export async function productRecord(productId: string, ctx: ToolContext, preferCategory: string | null = null): Promise<Json> {
  const index = await ctx.store.search();
  const hit = index.get(productId, preferCategory ?? ctx.page?.category?.id ?? null);
  if (!hit) throw new ToolError(`No listing with id '${productId}' in the current dataset.`);
  const cat = await ctx.store.category(hit.category);
  const pos = cat.posOf.get(productId);
  if (pos === undefined) throw new ToolError(`Listing '${productId}' is in the search index but not in ${hit.category} — reload the page.`);
  const row = rowSummary(cat, pos, ctx);
  const others = index.placements(productId).filter((h) => h.category !== hit.category);
  if (others.length) {
    row.alsoRankedIn = others.map((h) => ({
      category: h.category, rank: h.rank, of: ctx.store.categoryMeta(h.category)?.count ?? null, score: h.score, url: productUrl(ctx, h.category, productId),
    }));
  }
  let detail;
  try {
    detail = await ctx.store.detail(hit.category, productId);
  } catch (err) {
    return { ...row, detail: null, detailError: (err as Error).message };
  }
  if (!detail) return { ...row, detail: null, detailError: 'Listing detail not found in its data shard.' };
  return { ...row, detail: detailSummary(detail) };
}

export const searchProducts: Tool = {
  name: 'search_products',
  description:
    'Find listings by brand and/or product name across every category (accent/apostrophe-insensitive). '
    + 'Returns rank, score, price, store and INCI state for each match. Returns an empty list when the product is not '
    + 'sold on Flipkart/Amazon.in in this dataset — say so rather than guessing.',
  parameters: (manifest: Manifest) => ({
    type: 'object',
    properties: {
      query: { type: 'string', description: "Brand + product words, e.g. 'cetaphil gentle skin cleanser'" },
      category: categoryParam(manifest, 'Optional: restrict to one category id'),
      limit: { type: 'integer', description: 'Max results (default 8, max 25)' },
    },
    required: ['query'],
  }),
  async run(args, ctx) {
    const query = str(args.query);
    if (!query) throw new ToolError('query is required');
    const category = categoryArg(args);
    const limit = clamp(args.limit, 8, 1, 25);
    const index = await ctx.store.search();
    const results = index.search(query, { category, limit }).map(({ strength, hit }) => hitSummary(hit, strength, ctx, ctx.store.categoryMeta(hit.category)?.count ?? null));
    return { query, count: results.length, results, note: results.length ? null : 'No listing matches every word of the query. Try fewer words, or the product is not sold on Flipkart/Amazon.in.' };
  },
};

export const getTopProducts: Tool = {
  name: 'get_top_products',
  description:
    "Ranked listings for one category, optionally filtered by tags (e.g. 'target:acne', 'inci:full', 'scope:face', "
    + "'store:amazon', 'free:fragrance'), a price cap or a brand. Use get_category_filters to see valid tags. Returns the "
    + 'top N with rank, score breakdown and INCI state.',
  parameters: (manifest: Manifest) => ({
    type: 'object',
    properties: {
      category: categoryParam(manifest, 'Category id'),
      tags: { type: 'array', items: { type: 'string' }, description: 'Tags that must all be present' },
      max_price_inr: { type: 'integer', description: 'Only listings at or below this price' },
      brand: { type: 'string', description: 'Only this brand (case-insensitive)' },
      limit: { type: 'integer', description: 'How many (default 10, max 30)' },
      offset: { type: 'integer', description: 'Skip the first N ranked results (paging)' },
    },
    required: ['category'],
  }),
  async run(args, ctx) {
    const cat = await categoryOf(ctx, args);
    const wantedTags = strList(args.tags);
    const unknown = wantedTags.filter((t) => !cat.tagPos.has(t));
    if (unknown.length) throw new ToolError(`Unknown tags for ${cat.id}: ${JSON.stringify(unknown)}. Call get_category_filters('${cat.id}') for the valid tag list.`);
    const wanted = wantedTags.map((t) => cat.tagPos.get(t)!);
    const maxPrice = typeof args.max_price_inr === 'number' ? args.max_price_inr : null;
    const brand = str(args.brand).toLowerCase();
    const limit = clamp(args.limit, 10, 1, 30);
    const offset = clamp(args.offset, 0, 0, 100_000);
    let matched = 0;
    const rows: Json[] = [];
    for (const pos of cat.byRank) {
      const item = cat.items[pos];
      if (wanted.length && !cat.hasTags(item, wanted)) continue;
      if (maxPrice !== null && item.p > maxPrice) continue;
      if (brand && item.b.toLowerCase() !== brand) continue;
      matched += 1;
      if (matched > offset && rows.length < limit) rows.push(rowSummary(cat, pos, ctx));
    }
    let params = wantedTags.map((t) => `&f=${t}`).join('');
    if (maxPrice !== null) params += `&pmax=${Math.trunc(maxPrice)}`;
    return { category: cat.id, totalInCategory: cat.items.length, matching: matched, results: rows, url: categoryUrl(ctx, cat.id, params ? `?${params.slice(1)}` : '') };
  },
};

export const getCategoryFilters: Tool = {
  name: 'get_category_filters',
  description: 'Valid filter tags for a category with human labels and listing counts (evidence state, concern, format, actives, free-from, skin/hair type, size, rating, store).',
  parameters: (manifest: Manifest) => ({ type: 'object', properties: { category: categoryParam(manifest, 'Category id') }, required: ['category'] }),
  async run(args, ctx) {
    const cat = await categoryOf(ctx, args);
    const groups = (await ctx.store.manifest()).groups;
    const filters = Object.fromEntries(Object.entries(cat.facets).map(([g, rows]) => [g, { label: groups[g]?.label ?? g, hint: groups[g]?.hint ?? null, options: rows }]));
    return { category: cat.id, filters };
  },
};

export const getProduct: Tool = {
  name: 'get_product',
  description:
    'Everything the site shows for one listing: rank, score breakdown, full INCI text and where it came from '
    + '(marketplace listing / official brand site / third party, with URL, region, matched official title), evidence-graded actives, '
    + 'safety flags, maker accountability, buyer evidence, pros/cons, and the seller claims that are shown but NOT scored.',
  parameters: (manifest: Manifest) => ({
    type: 'object',
    properties: {
      product_id: { type: 'string', description: 'Listing id from search_products / get_top_products' },
      category: { ...categoryParam(manifest, "Which category's placement to read when the listing is ranked in several (defaults to the page's category)"), nullable: true },
    },
    required: ['product_id'],
  }),
  run: (args, ctx) => productRecord(str(args.product_id), ctx, categoryArg(args)),
};

export const compareProducts: Tool = {
  name: 'compare_products',
  description: 'Side-by-side evidence for 2–5 listings (any categories): rank, score breakdown, INCI status + source, actives, flags, maker, price.',
  parameters: (manifest: Manifest) => ({
    type: 'object',
    properties: {
      product_ids: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 5 },
      category: { ...categoryParam(manifest, "Category whose ranks to compare when listings sit in several (defaults to the page's category)"), nullable: true },
    },
    required: ['product_ids'],
  }),
  async run(args, ctx) {
    const ids = strList(args.product_ids).slice(0, 5);
    if (ids.length < 2) throw new ToolError('Give at least two product ids.');
    const prefer = categoryArg(args);
    const rows: Json[] = [];
    for (const id of ids) {
      try {
        rows.push(await productRecord(id, ctx, prefer));
      } catch (err) {
        if (!(err instanceof ToolError)) throw err;
        rows.push({ id, error: err.message });
      }
    }
    return { count: rows.length, products: rows, note: 'Scores are only comparable within one category; a reference ceiling (100) is never a listing.' };
  },
};
