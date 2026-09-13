/** What a routine can be made of: each entry maps the words people use ("face wash", "retinol", "HA", "eraser shot")
 * to a role in the week, the pairing-knowledge family it belongs to, and the ranked page(s) that sell it. Pure data —
 * nothing here scores a product; the site's rankings do that when the plan is filled. */
import type { PlanZone, Slot } from '../model';

/** core = every day both slots · protect = sunscreen · hydrate = daily support layers · treat = gentle actives layered
 * under a per-slot cap · active = retinoid / exfoliant / BPO strength that gets one night to itself. */
export type Role = 'core' | 'protect' | 'hydrate' | 'treat' | 'active';

export interface CatalogItem {
  key: string;
  label: string;
  /** Lower-case words people type, misspellings included. Matched whole, longest first. */
  aliases: string[];
  role: Role;
  /** Pairing-knowledge family (knowledge.json `families[].id`) used for compatibility checks; null = no known interactions. */
  family: string | null;
  zone: PlanZone;
  /** Ranked page ids in preference order; the first one present in the manifest is used. */
  categories: string[];
  /** Ingredient tags the pick should carry when the page has them (soft preference, dropped one by one when nothing matches). */
  tags?: string[];
  /** A named product ("eraser shot") — searched by name first, category rank as the fallback. */
  query?: string;
  /** Allowed slots, preferred first. */
  slots: Slot[];
  /** Days per week for non-daily items (actives default 2–3; treat items spread across the week). */
  days: number;
  /** Placement priority when nights run out (higher wins). */
  priority: number;
  /** True for ingredients that live inside other products (glycerin, ceramides…) rather than being a step. */
  ingredientOnly?: boolean;
  /** Plain-words guidance shown on the plan (sourced in knowledge.json usage notes where a family exists). */
  hint?: string;
}

const face = (item: Omit<CatalogItem, 'zone'>): CatalogItem => ({ zone: 'face', ...item });

export const CATALOG: CatalogItem[] = [
  face({ key: 'cleanse', label: 'Cleanse', aliases: ['face wash', 'facewash', 'cleanser', 'cleanse', 'cleansing', 'wash'], role: 'core', family: null, categories: ['facewash'], slots: ['am', 'pm'], days: 7, priority: 100 }),
  face({ key: 'balm', label: 'Cleansing balm / makeup remover', aliases: ['cleansing balm', 'cleansing oil', 'makeup remover', 'make up remover', 'micellar water', 'micellar', 'double cleanse', 'first cleanse'], role: 'core', family: null, categories: ['cleansingbalm'], slots: ['pm'], days: 7, priority: 97, hint: 'First cleanse at night — sunscreen and makeup off before the face wash.' }),
  face({ key: 'lipbalm', label: 'Lip balm', aliases: ['lip balm', 'lipbalm', 'lip care', 'chapstick', 'lip'], role: 'hydrate', family: null, categories: ['lipbalm'], slots: ['pm', 'am'], days: 7, priority: 30 }),
  face({ key: 'moisturise', label: 'Moisturise', aliases: ['moisturizer', 'moisturiser', 'moisturize', 'moisturise', 'moisturizing cream', 'moisturising cream'], role: 'core', family: 'barrier', categories: ['moisturizer'], slots: ['am', 'pm'], days: 7, priority: 99 }),
  face({ key: 'sunscreen', label: 'Sunscreen', aliases: ['sunscreen', 'spf', 'sunblock', 'sun screen'], role: 'protect', family: 'sunscreen', categories: ['sunscreen'], slots: ['am'], days: 7, priority: 98, hint: 'Every morning — the one step every active on this plan depends on.' }),

  face({ key: 'toner', label: 'Toner', aliases: ['toner'], role: 'hydrate', family: null, categories: ['toner'], tags: ['ing:hyaluronic-acid'], slots: ['am', 'pm'], days: 7, priority: 60 }),
  face({ key: 'essence', label: 'Essence', aliases: ['essence', 'essense', 'essens'], role: 'hydrate', family: null, categories: ['essence'], slots: ['pm', 'am'], days: 7, priority: 58 }),
  face({ key: 'ha', label: 'Hyaluronic acid', aliases: ['hyaluronic acid', 'hyaluronic', 'ha', 'hyaluron', 'sodium hyaluronate'], role: 'hydrate', family: 'ha', categories: ['hyaluronic', 'essence', 'calmserum'], tags: ['ing:hyaluronic-acid'], slots: ['pm', 'am'], days: 7, priority: 57, hint: 'On damp skin, sealed with moisturiser.' }),
  face({ key: 'barrier', label: 'Barrier / soothing serum', aliases: ['barrier serum', 'calming serum', 'soothing serum', 'cica'], role: 'hydrate', family: 'barrier', categories: ['calmserum', 'barriercream'], slots: ['pm', 'am'], days: 7, priority: 56 }),

  face({ key: 'vitc', label: 'Vitamin C', aliases: ['vitamin c', 'vit c', 'vitc', 'ascorbic acid', 'ascorbic'], role: 'treat', family: 'vitc', categories: ['vitaminc'], slots: ['am'], days: 7, priority: 80, hint: 'Mornings under sunscreen; kept off benzoyl peroxide and acid slots.' }),
  face({ key: 'niacinamide', label: 'Niacinamide', aliases: ['niacinamide', 'niacinamid', 'b3', 'nicotinamide'], role: 'treat', family: 'niacinamide', categories: ['niacinamide'], slots: ['am', 'pm'], days: 7, priority: 78 }),
  face({ key: 'azelaic', label: 'Azelaic acid', aliases: ['azelaic acid', 'azelaic', 'azeliac'], role: 'treat', family: 'azelaic', categories: ['azelaic'], slots: ['am', 'pm'], days: 4, priority: 70, hint: 'Not photosensitising, so mornings work; kept off AHA nights.' }),
  face({ key: 'txa', label: 'Tranexamic acid', aliases: ['tranexamic acid', 'tranexamic', 'txa'], role: 'treat', family: 'tranexamic', categories: ['txa', 'pigmentation'], tags: ['ing:tranexamic-acid'], slots: ['pm', 'am'], days: 4, priority: 62 }),
  face({ key: 'kojic', label: 'Kojic acid', aliases: ['kojic acid', 'kojic', 'kojik'], role: 'treat', family: 'arbutin', categories: ['pigmentation'], tags: ['ing:kojic-acid'], slots: ['am', 'pm'], days: 3, priority: 60 }),
  face({ key: 'peptide', label: 'Peptide serum', aliases: ['peptide', 'peptides', 'collagen serum', 'copper peptide'], role: 'treat', family: null, categories: ['peptideserum'], slots: ['pm', 'am'], days: 4, priority: 58 }),
  face({ key: 'pdrn', label: 'PDRN', aliases: ['pdrn', 'salmon dna', 'polynucleotide'], role: 'treat', family: null, categories: ['pdrn', 'peptideserum'], query: 'pdrn', slots: ['pm', 'am'], days: 3, priority: 55 }),
  face({ key: 'nadnmn', label: 'NAD+ / NMN', aliases: ['nad+', 'nad', 'nmn', 'nad plus', 'nicotinamide mononucleotide'], role: 'treat', family: null, categories: ['nadnmn', 'peptideserum'], query: 'nad', slots: ['pm', 'am'], days: 3, priority: 54 }),

  face({ key: 'retinol', label: 'Retinol', aliases: ['retinol', 'retinal', 'retinoid', 'retinoids', 'tretinoin', 'adapalene'], role: 'active', family: 'retinoid', categories: ['retinol'], slots: ['pm'], days: 3, priority: 90, hint: 'Nights only, 2–3 a week to start; moisturiser before or after softens it.' }),
  face({ key: 'glycolic', label: 'Glycolic acid', aliases: ['glycolic acid', 'glycolic', 'aha', 'glycolic toner'], role: 'active', family: 'aha', categories: ['exfoliator', 'toner', 'pigmentation'], tags: ['ing:glycolic-acid'], slots: ['pm'], days: 2, priority: 72, hint: 'Home strength ≤10%; sunscreen every morning.' }),
  face({ key: 'lactic', label: 'Lactic acid', aliases: ['lactic acid', 'lactic', 'mandelic acid', 'mandelic', 'pha'], role: 'active', family: 'aha', categories: ['lactic', 'exfoliator'], tags: ['ing:lactic-acid'], slots: ['pm'], days: 1, priority: 66 }),
  face({ key: 'salicylic', label: 'Salicylic acid (BHA)', aliases: ['salicylic acid', 'salicylic', 'bha', 'salycilic', 'salicyclic'], role: 'active', family: 'bha', categories: ['salicylic'], slots: ['pm', 'am'], days: 2, priority: 74 }),
  face({ key: 'exfoliator', label: 'Exfoliator', aliases: ['exfoliator', 'exfoliater', 'exfoliant', 'scrub', 'peel', 'peeling'], role: 'active', family: 'aha', categories: ['exfoliator'], slots: ['pm'], days: 1, priority: 50, hint: 'Counts as an exfoliation night — never on an acid or retinol night.' }),
  face({ key: 'erasershot', label: 'Eraser Shot (Arencia, AHA/BHA)', aliases: ['eraser shot', 'erasershot', 'arencia eraser'], role: 'active', family: 'aha', categories: ['exfoliator', 'salicylic'], query: 'arencia eraser shot', slots: ['pm'], days: 1, priority: 52, hint: 'A glycolic + BHA exfoliating serum — it takes an exfoliation night of its own.' }),
  face({ key: 'bpo', label: 'Benzoyl peroxide', aliases: ['benzoyl peroxide', 'benzoyl', 'bpo', 'benzoil'], role: 'active', family: 'bpo', categories: ['benzoyl', 'acnespot'], tags: ['ing:benzoyl-peroxide'], slots: ['pm', 'am'], days: 2, priority: 68, hint: 'Short contact or spot use; never the same night as a retinoid, never the same slot as vitamin C.' }),

  { key: 'soap', label: 'Soap bar (body)', aliases: ['soap', 'soap bar', 'bathing soap', 'bathing bar', 'body soap'], role: 'core', family: null, zone: 'body', categories: ['soap', 'bodywash'], slots: ['am', 'pm'], days: 7, priority: 96 },
  { key: 'shave', label: 'Shave / aftershave', aliases: ['shaving cream', 'shaving gel', 'shaving foam', 'shaving', 'shave', 'aftershave', 'after shave', 'post shave balm', 'post-shave'], role: 'core', family: null, zone: 'beard', categories: ['shaving'], slots: ['am'], days: 7, priority: 95, hint: 'Shave before the face wash; aftershave goes on before moisturiser.' },
  { key: 'urea20', label: 'Urea 20% (body)', aliases: ['urea 20%', 'urea 20', 'urea', 'keratosis pilaris', 'kp'], role: 'active', family: 'aha', zone: 'body', categories: ['kp'], tags: ['ing:urea'], slots: ['pm'], days: 3, priority: 64, hint: '20% urea is a body / KP strength — kept off the face plan.' },

  face({ key: 'glycerin', label: 'Glycerin', aliases: ['glycerin', 'glycerine', 'glycerol'], role: 'hydrate', family: 'barrier', categories: ['moisturizer'], tags: ['ing:glycerin'], slots: ['pm', 'am'], days: 7, priority: 1, ingredientOnly: true }),
  face({ key: 'allantoin', label: 'Allantoin', aliases: ['allantoin', 'allatonin', 'alantoin'], role: 'hydrate', family: 'barrier', categories: ['calmserum'], tags: ['ing:allantoin'], slots: ['pm', 'am'], days: 7, priority: 1, ingredientOnly: true }),
  face({ key: 'panthenol', label: 'Panthenol (B5)', aliases: ['panthenol', 'pantenol', 'panthanol', 'b5', 'd-panthenol'], role: 'hydrate', family: 'barrier', categories: ['calmserum'], tags: ['ing:vitamin-b5-panthenol'], slots: ['pm', 'am'], days: 7, priority: 1, ingredientOnly: true }),
  face({ key: 'greentea', label: 'Green tea', aliases: ['green tea', 'greentea', 'camellia'], role: 'hydrate', family: null, categories: ['calmserum'], tags: ['ing:green-tea'], slots: ['pm', 'am'], days: 7, priority: 1, ingredientOnly: true }),
  face({ key: 'ceramide', label: 'Ceramides', aliases: ['ceramide', 'ceramides', 'ceramid'], role: 'hydrate', family: 'barrier', categories: ['moisturizer', 'barriercream'], tags: ['ing:ceramides'], slots: ['pm', 'am'], days: 7, priority: 1, ingredientOnly: true }),
  face({ key: 'betaine', label: 'Betaine', aliases: ['betaine', 'betain'], role: 'hydrate', family: null, categories: ['calmserum'], slots: ['pm', 'am'], days: 7, priority: 1, ingredientOnly: true }),
  face({ key: 'madecassoside', label: 'Madecassoside (centella)', aliases: ['madecassoside', 'madecasoside', 'centella', 'asiaticoside'], role: 'hydrate', family: null, categories: ['calmserum'], tags: ['ing:centella-cica'], slots: ['pm', 'am'], days: 7, priority: 1, ingredientOnly: true }),
  face({ key: 'squalane', label: 'Squalane', aliases: ['squalane', 'squalene', 'squalan'], role: 'hydrate', family: null, categories: ['faceoil', 'moisturizer'], tags: ['ing:squalane'], slots: ['pm', 'am'], days: 7, priority: 1, ingredientOnly: true }),
];

export const CATALOG_BY_KEY: ReadonlyMap<string, CatalogItem> = new Map(CATALOG.map((c) => [c.key, c]));

/** Words that describe *how* the plan should work rather than *what* goes in it — never reported as unknown. */
export const FILLER_WORDS = new Set([
  'use', 'all', 'also', 'make', 'sure', 'we', 'are', 'using', 'right', 'ingredients', 'ingredient', 'together', 'in', 'a', 'an', 'the', 'schedule', 'instead',
  'of', 'throwing', 'everything', 'to', 'night', 'nights', 'day', 'days', 'daya', 'and', 'category', 'categories', 'i', 'im', "i'm", 'okay', 'ok', 'thing', 'things',
  'other', 'for', 'some', 'with', 'my', 'me', 'please', 'want', 'like', 'serum', 'serums', 'acid', 'acids', 'routine', 'week', 'weekly', 'morning', 'evening',
  'am', 'pm', 'on', 'off', 'is', 'it', 'be', 'can', 'do', 'not', 'no', 'yes', 'but', 'so', 'that', 'this', 'these', 'those', 'or', 'from', 'at', 'as', 'by',
  'then', 'than', 'too', 'very', 'just', 'only', 'more', 'less', 'each', 'every', 'per', 'times', 'time', 'x', 'add', 'have', 'has', 'need', 'needs', 'face',
]);
