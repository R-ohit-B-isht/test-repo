/** Listing-level tools: search, ranked lists with filters, product evidence, comparison — twin of chat_api/tools/products.py. */
import type { Manifest } from '../../../lib/types';
import { DataError, type CategoryView, type TagGroupQuery } from '../store';
import { groupOf } from '../../../domain/index';
import { categoryParam, categoryUrl, clamp, productUrl, str, strList, ToolError, type Json, type Tool, type ToolContext } from './base';
import { detailSummary, hitSummary, rowSummary } from './present';
import { matchFacets } from './facetHints';
import { expandIngredient, findIngredient, titleHasWords, titleTokens, type IngredientQuery } from './inciMatch';

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

/** Tags grouped the way the site's filter panel matches them: any-of within a group (all-of for `and` groups such as
 * ing:/free:), every group required. Unknown tag ids come back with the closest real options instead of a dead end. */
async function resolveTags(cat: CategoryView, wantedTags: string[], ctx: ToolContext): Promise<TagGroupQuery[]> {
  const groups = (await ctx.store.manifest()).groups;
  const unknown = wantedTags.filter((t) => !cat.tagPos.has(t));
  if (!unknown.length) {
    const byGroup = new Map<string, number[]>();
    for (const t of wantedTags) {
      const g = groupOf(t);
      byGroup.set(g, [...(byGroup.get(g) ?? []), cat.tagPos.get(t)!]);
    }
    return [...byGroup].map(([group, tags]) => ({ group, tags, all: groups[group]?.mode === 'and' }));
  }
  const hints = unknown.map((t) => {
    const near = matchFacets(t, cat.facets, groups, 5).map((h) => `${h.tag} (${h.label}, ${h.count})`);
    return `'${t}' is not a tag in ${cat.id}` + (near.length ? ` — closest real tags: ${near.join('; ')}` : ' — no similar tag; if it is an ingredient, pass it in `ingredients` instead');
  });
  throw new ToolError(`${hints.join('. ')}. Retry with real tags, or call get_category_filters('${cat.id}', query) to look them up.`);
}

interface IngredientPass { verifiedHit: boolean; claimedHit: boolean; found: Record<string, string> }

/** Verified-INCI test for one row: every `wanted` name present, none of `excluded`. Seller-line hits are reported, never counted. */
function ingredientPass(inciText: string, claimedText: string, wanted: IngredientQuery[], excluded: IngredientQuery[]): IngredientPass {
  const found: Record<string, string> = {};
  if (inciText) {
    for (const q of wanted) {
      const hit = findIngredient(inciText, q);
      if (!hit) return { verifiedHit: false, claimedHit: false, found };
      found[q.term] = hit;
    }
    for (const q of excluded) if (findIngredient(inciText, q)) return { verifiedHit: false, claimedHit: false, found };
    return { verifiedHit: true, claimedHit: false, found };
  }
  const claimedHit = !!claimedText && wanted.length > 0 && wanted.every((q) => findIngredient(claimedText, q));
  return { verifiedHit: false, claimedHit, found };
}

export const getTopProducts: Tool = {
  name: 'get_top_products',
  description:
    'Ranked listings for one category filtered by any mix of: facet tags (\'water:resistant\', \'claim:tinted\', \'target:acne\', '
    + "'inci:full', 'scope:face', 'store:amazon', 'free:fragrance' — look ids up with get_category_filters), INGREDIENTS that must be "
    + "on the verified INCI list (any common or INCI name: 'iron oxide', 'zinc oxide', 'vitamin C', 'ceramide', 'CI 77491' — aliases and "
    + 'CI numbers are expanded automatically), ingredients that must be absent, words that must appear in the title, a price cap or a '
    + 'brand. Ingredient filters only count listings with a verified INCI list; listings whose seller line merely claims the ingredient '
    + 'are returned separately as unverified. Returns the top N by rank with score breakdown, INCI state and which name matched.',
  parameters: (manifest: Manifest) => ({
    type: 'object',
    properties: {
      category: categoryParam(manifest, 'Category id'),
      tags: { type: 'array', items: { type: 'string' }, description: "Facet tag ids. Same group = any of them (['water:80','water:40','water:resistant'] = any stated water resistance); different groups all apply" },
      ingredients: { type: 'array', items: { type: 'string' }, description: "Ingredients that must ALL be on the verified INCI list, e.g. ['iron oxide', 'zinc oxide']" },
      without_ingredients: { type: 'array', items: { type: 'string' }, description: "Ingredients that must be ABSENT from the verified INCI list, e.g. ['fragrance', 'alcohol denat']" },
      title_words: { type: 'array', items: { type: 'string' }, description: "Words that must appear in the brand/title, e.g. ['tinted'] (prefix match)" },
      max_price_inr: { type: 'integer', description: 'Only listings at or below this price' },
      brand: { type: 'string', description: 'Only this brand (case-insensitive)' },
      limit: { type: 'integer', description: 'How many (default 10, max 30)' },
      offset: { type: 'integer', description: 'Skip the first N ranked results (paging)' },
    },
    required: ['category'],
  }),
  async run(args, ctx) {
    const cat = await categoryOf(ctx, args);
    const wantedTags = strList(args.tags).map((t) => t.trim()).filter(Boolean);
    const wanted = await resolveTags(cat, wantedTags, ctx);
    const ingredientTerms = strList(args.ingredients).map((t) => t.trim()).filter(Boolean);
    const excludedTerms = strList(args.without_ingredients).map((t) => t.trim()).filter(Boolean);
    const titleWords = strList(args.title_words).map((t) => t.trim()).filter(Boolean);
    const maxPrice = typeof args.max_price_inr === 'number' ? args.max_price_inr : null;
    const brand = str(args.brand).toLowerCase();
    const limit = clamp(args.limit, 10, 1, 30);
    const offset = clamp(args.offset, 0, 0, 100_000);
    const usesInci = ingredientTerms.length > 0 || excludedTerms.length > 0;
    const aliases = usesInci ? await ctx.store.ingredientAliases() : [];
    const wantedInci = ingredientTerms.map((t) => expandIngredient(t, aliases));
    const excludedInci = excludedTerms.map((t) => expandIngredient(t, aliases));
    const cols = usesInci ? await ctx.store.inci(cat.id) : null;
    let matched = 0;
    let unverified = 0;
    let uncheckable = 0;
    const rows: Json[] = [];
    const unverifiedRows: Json[] = [];
    for (const pos of cat.byRank) {
      const item = cat.items[pos];
      if (wanted.length && !cat.matchesTagGroups(item, wanted)) continue;
      if (maxPrice !== null && item.p > maxPrice) continue;
      if (brand && item.b.toLowerCase() !== brand) continue;
      if (titleWords.length && !titleHasWords(titleTokens(`${item.b} ${item.m}`), titleWords)) continue;
      let found: Record<string, string> = {};
      if (cols) {
        const pass = ingredientPass(cols.inci[pos] ?? '', cols.claimed[pos] ?? '', wantedInci, excludedInci);
        if (!pass.verifiedHit) {
          if (pass.claimedHit) { unverified += 1; if (unverifiedRows.length < 3) unverifiedRows.push({ ...rowSummary(cat, pos, ctx), note: "seller's key-ingredients line names it but no full declared list is published — unverified, not counted" }); }
          else if (!cols.inci[pos]) uncheckable += 1;
          continue;
        }
        found = pass.found;
      }
      matched += 1;
      if (matched > offset && rows.length < limit) {
        const row = rowSummary(cat, pos, ctx);
        if (Object.keys(found).length) row.ingredientsFound = found;
        rows.push(row);
      }
    }
    let params = wantedTags.map((t) => `&f=${t}`).join('') + wanted.filter((g) => g.all && g.tags.length > 1).map((g) => `&all=${g.group}`).join('');
    if (maxPrice !== null) params += `&pmax=${Math.trunc(maxPrice)}`;
    const out: Json = { category: cat.id, totalInCategory: cat.items.length, matching: matched, results: rows, url: categoryUrl(ctx, cat.id, params ? `?${params.slice(1)}` : '') };
    if (cols) {
      out.ingredientFilter = {
        require: wantedInci.map((q) => ({ term: q.term, recognisedAs: q.label, lookingFor: [...q.inci, ...q.whole] })),
        exclude: excludedInci.map((q) => ({ term: q.term, recognisedAs: q.label, lookingFor: [...q.inci, ...q.whole] })),
        verifiedListsInCategory: cols.verified,
        skippedNoVerifiedInci: uncheckable,
        sellerClaimedOnly: unverified,
        sellerClaimedExamples: unverifiedRows,
        note: 'Only verified INCI lists (marketplace listing, official brand site or third-party database) count. Listings with no list could not be checked either way — say so rather than treating them as absent.',
      };
    }
    return out;
  },
};

export const getCategoryFilters: Tool = {
  name: 'get_category_filters',
  description:
    'Valid filter tags for a category with human labels and listing counts (evidence state, concern, format, actives, free-from, '
    + "skin/hair type, water resistance, size, rating, store). Pass `query` with the user's own words (e.g. 'water repellent tinted') "
    + 'to get only the tags that match them, best first.',
  parameters: (manifest: Manifest) => ({
    type: 'object',
    properties: {
      category: categoryParam(manifest, 'Category id'),
      query: { type: 'string', description: 'Optional plain-English words to map onto tags; omit for the full list' },
    },
    required: ['category'],
  }),
  async run(args, ctx) {
    const cat = await categoryOf(ctx, args);
    const groups = (await ctx.store.manifest()).groups;
    const query = str(args.query);
    if (query) {
      const matches = matchFacets(query, cat.facets, groups, 12).map(({ score: _score, ...h }) => h);
      return { category: cat.id, query, matches, note: matches.length ? 'Pass every returned id of the same group together in get_top_products `tags` (they mean any-of); ingredient words that are not tags go in `ingredients` instead.' : 'No tag matches these words. Ingredients go in get_top_products `ingredients`; product words can go in `title_words`.' };
    }
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
