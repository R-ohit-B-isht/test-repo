/** Site-level tools: overview, categories, scoring method, reference ceilings, routines — twin of chat_api/tools/catalog.py. */
import type { Manifest, Routine } from '../../../lib/types';
import { categoryParam, str, ToolError, type Json, type Tool } from './base';
import { benchmarkSummary, categorySummary } from './present';

export const METHOD_RULES = [
  'Formula and skin/scalp-safety points come ONLY from a full published INCI list; seller adjectives in titles/bullets score 0.',
  "A full INCI printed on the marketplace listing wins; if the listing prints none, the brand's official website is used only when the exact product/variant/region is matched (provenance URL + matched title kept). Ambiguous variants are rejected, never guessed.",
  'Partial, garbled or missing INCI → formula and safety stay unscored (0) and the listing says so; nothing is inferred from brand reputation.',
  'Trust = accountable manufacturer (pharma / global / Indian group, with source URL) plus full disclosure.',
  'Buyer ratings are capped: they can support a score, never carry it.',
  "Concern tags (acne, dark spots, aging, irritation) come from verified INCI actives or the category's own purpose — never from claims. Hair pages carry no skin concern tags.",
  'Reference ceilings are fixed at 100 for the best-in-class product of each category regardless of price or country; they sit outside the ranking and are not comparable to listing scores.',
  'Ranking within a category: score descending, then price ascending.',
];

const NO_PARAMS = () => ({ type: 'object', properties: {} });

export const getSiteOverview: Tool = {
  name: 'get_site_overview',
  description: 'Dataset snapshot: when it was generated, totals, zones, concern filters, category count and what the site does. Call first if unsure what exists.',
  parameters: NO_PARAMS,
  async run(_args, ctx) {
    const m = await ctx.store.manifest();
    const zones: Record<string, number> = {};
    for (const c of m.categories) zones[c.zone] = (zones[c.zone] ?? 0) + 1;
    return {
      generatedAt: m.generatedAt, totalListings: m.total, categories: m.categories.length, categoriesByZone: zones,
      zoneLabels: m.zoneLabels, concernFilters: m.concerns, referenceCeilings: m.benchmarks.length, routines: m.routines,
      marketplaces: ['Flipkart', 'Amazon.in'],
      siteSections: { routines: `${ctx.siteUrl}/#/`, products: `${ctx.siteUrl}/#/products` },
    };
  },
};

export const listCategories: Tool = {
  name: 'list_categories',
  description: "All ranked category pages (id, label, zone face/body/hair, listing count, per-concern counts, reference ceiling). Use to map a user's product type to a category id.",
  parameters: () => ({ type: 'object', properties: { zone: { type: 'string', enum: ['face', 'body', 'hair', 'both'], description: 'Optional zone filter' } } }),
  async run(args, ctx) {
    const m = await ctx.store.manifest();
    const zone = str(args.zone);
    const rows = m.categories.filter((c) => !zone || c.zone === zone).map((c) => categorySummary(c, ctx, ctx.store.benchmarkFor(c.id)));
    return { count: rows.length, categories: rows };
  },
};

export const getScoringMethod: Tool = {
  name: 'get_scoring_method',
  description: 'How listing scores are computed: weights, criteria, evidence rules, cited regulatory/scientific sources, routine scoring.',
  parameters: NO_PARAMS,
  async run(_args, ctx) {
    const m = await ctx.store.manifest();
    return {
      weights: m.weights, criteria: m.criteria, rules: METHOD_RULES,
      evidenceStates: {
        full: 'Full INCI list published/verified (scored)',
        partial: 'Key-ingredients line only (unscored)',
        garbled: 'Unusable ingredient text (unscored)',
        none: 'No ingredient list found (unscored)',
      },
      inciSourceKinds: { listing: 'marketplace page', 'brand-site': 'official brand website', secondary: 'third-party database' },
      filterGroups: m.groups, citedSources: m.sources, routineWeights: m.routineWeights, routineCriteria: m.routineCriteria,
    };
  },
};

export const getReferenceCeiling: Tool = {
  name: 'get_reference_ceiling',
  description: 'The fixed-100 reference ceiling (best-in-class product) for a category, its cited evidence, and whether/where the exact product is found in the Indian marketplace ranking.',
  parameters: (manifest: Manifest) => ({ type: 'object', properties: { category: categoryParam(manifest, 'Category id') }, required: ['category'] }),
  async run(args, ctx) {
    await ctx.store.manifest();
    const bench = ctx.store.benchmarkFor(str(args.category));
    if (!bench) throw new ToolError(`No reference ceiling is defined for '${str(args.category)}'.`);
    return benchmarkSummary(bench, ctx);
  },
};

const ROUTINE_KEYS = ['id', 'category', 'brand', 'model', 'author', 'source', 'sourceUrl', 'timePerDay', 'stepsPerDay', 'highlight', 'score', 'scores'] as const;

export const getRoutines: Tool = {
  name: 'get_routines',
  description: 'The published skincare routines (dermatology bodies, named methods, regional traditions) with their sources, scores and step lists. Optional filter by routine category or a name search.',
  parameters: () => ({
    type: 'object',
    properties: {
      category: { type: 'string', description: 'core | global | method | occasion | concern' },
      query: { type: 'string', description: "Text to match in routine brand/name (e.g. 'Korean', 'AAD')" },
      detail: { type: 'boolean', description: 'Include full morning/evening steps (default false)' },
    },
  }),
  async run(args, ctx) {
    const data = await ctx.store.routines();
    const cat = str(args.category);
    const q = str(args.query).toLowerCase();
    const detail = args.detail === true;
    const rows: Json[] = [];
    for (const r of data.items) {
      if (cat && r.category !== cat) continue;
      if (q && !`${r.brand} ${r.model}`.toLowerCase().includes(q)) continue;
      const row: Json = Object.fromEntries(ROUTINE_KEYS.map((k) => [k, (r as Routine)[k]]));
      if (detail) row.steps = r.steps;
      rows.push(row);
    }
    return { count: rows.length, of: data.count, routines: rows.slice(0, 40), url: `${ctx.siteUrl}/#/` };
  },
};
