export type Zone = 'face' | 'body' | 'both' | 'hair';
/** Tag group that says where a listing goes: skincare uses `scope` (face / body), hair uses `area` (scalp / lengths). */
export type ScopeGroup = 'scope' | 'area';
export type SkinScopeKey = 'face' | 'body' | 'both' | 'unstated';
export type HairAreaKey = 'scalp' | 'lengths' | 'both' | 'beard' | 'unstated';
/** A full placement tag, e.g. `scope:face` or `area:scalp` — the card badge and sheet header render from this. */
export type PlaceTag = `scope:${SkinScopeKey}` | `area:${HairAreaKey}`;
export type ScoreKey = 'trust' | 'skin' | 'ingredients' | 'experience';
/** How much of the ingredient declaration the listing actually publishes; only `full` is scored. */
export type InciStatus = 'full' | 'partial' | 'garbled' | 'none';
/** Where a verified INCI list was read: the listing, the brand's official site, or a third-party database. */
export type InciSourceKind = 'listing' | 'brand-site' | 'secondary';
export type Scores = Record<ScoreKey, number>;

export interface FacetGroupDef { label: string; hint: string; mode: 'or' | 'and' }
export interface FacetRow { tag: string; label: string; count: number }

export interface CategoryMeta {
  id: string;
  label: string;
  kicker: string;
  zone: Zone;
  blurb: string;
  facets: string[];
  featured: string[];
  count: number;
  scopeGroup: ScopeGroup;
  byScope: Record<string, number>;
  stores: { flipkart: number; amazon: number };
  priceMax: number;
}

export interface Manifest {
  generatedAt: string;
  weights: Scores;
  criteria: Record<ScoreKey, string>;
  routineWeights: Record<string, number>;
  routineCriteria: Record<string, string>;
  routineCategoryLabels: Record<string, string>;
  zoneLabels: Record<Zone, string>;
  groups: Record<string, FacetGroupDef>;
  sources: Record<string, SourceRef>;
  phases: string[];
  shards: number;
  categories: CategoryMeta[];
  benchmarks: Benchmark[];
  routines: { count: number; categories: string[] };
  total: number;
}

export interface BenchmarkLink { label: string; url: string }
export interface BenchmarkEvidence extends BenchmarkLink { publisher: string; note?: string }
export interface BenchmarkListing { id: string; rank: number; of: number; score: number; price: number; store: string; title: string; listings: number; note: string | null; ev: InciStatus }
/**
 * How the benchmark relates to the real Flipkart / Amazon.in listings of its category:
 * `found` = the same product with its actual rank; `related` = a regional/renamed variant, never claimed as identical; `not-found` = explicit.
 */
export type BenchmarkMarket =
  | ({ status: 'found' } & BenchmarkListing)
  | ({ status: 'related' } & BenchmarkListing & { note: string })
  | { status: 'not-found'; note: string };
/** The reference ceiling shown above a category list. Fixed at 100 by definition; never part of the ranked index. */
export interface Benchmark {
  category: string;
  brand: string;
  name: string;
  variant: string | null;
  maker: BenchmarkLink;
  image: { url: string; source: string };
  why: string;
  facts: { k: string; v: string }[];
  evidence: BenchmarkEvidence[];
  caution: string | null;
  market: BenchmarkMarket;
}
export const BENCHMARK_SCORE = 100;

/** Compact list row — everything needed to render a card without the detail shard. */
export interface ProductRow {
  id: string;
  b: string;      // brand
  m: string;      // model / listing title (trimmed)
  p: number;      // price ₹
  st: string;     // store
  s: number;      // overall score /100
  sc: Scores;
  img: string;
  q: string;      // quantity line
  f: string;      // feature line
  r: number | null;   // rating
  rc: number | null;  // rating count
  t: number[];    // tag indices into tagIndex
  ev: InciStatus; // ingredient-declaration status behind the score
  es?: Exclude<InciSourceKind, 'listing'>; // set when the verified list came from outside the listing
  step?: string;
}

export interface CategoryData {
  id: string;
  count: number;
  tagIndex: string[];
  facets: Record<string, FacetRow[]>;
  items: ProductRow[];
}

export interface SourceRef { label: string; url: string }
/** `src` keys into `Manifest.sources` — the cited paper / regulation behind the grade or penalty. */
export interface EvidenceActive { name: string; position: number; grade: 'A' | 'B' | 'C'; core: boolean; src: string }
export interface EvidenceFlag { id: string; label: string; names: string[]; penalty: number; src: string }
export interface EvidenceMaker { parent: string | null; kind: 'pharma' | 'global' | 'india' | 'd2c' | 'unknown'; label: string; pts: number; url: string | null }
/** Everything the score was read from — never seller adjectives. Absent pieces are null / empty, not filled in. */
export interface Evidence {
  inci: InciStatus;
  inciSource: string | null;
  inciSourceKind: InciSourceKind | null;
  inciSourceUrl: string | null;      // exact page an external declaration was read from
  inciSourceRegion: string | null;   // country site of an official declaration (IN unless the Indian site had none)
  inciMatchedTitle: string | null;   // product name on that page
  inciMatchScore: number | null;     // 0–1 name-match confidence of listing ↔ page
  inciText: string | null;
  inciUnverified: string | null;
  inciNote: string | null;
  declarationConfidence: number | null;
  recognised: number | null;
  actives: EvidenceActive[];
  support: string[];
  formulaNotes: string[];
  flags: EvidenceFlag[];
  maker: EvidenceMaker;
  buyers: string;
}

export interface ProductDetail {
  title: string;
  highlight: string;
  pros: string[];
  cons: string[];
  fullSpec: Record<string, string>;
  images: string[];
  buyUrl: string;
  buyStore: string;
  tags: string[];
  evidence: Evidence;
}

export interface RoutineStep { name: string; how: string; phase: string }
export interface Routine {
  id: string;
  category: string;
  brand: string;
  model: string;
  source: string;
  sourceUrl: string;
  sourceUrl2?: string;
  author: string;
  timePerDay: string;
  stepsPerDay: number;
  highlight: string;
  steps: Record<'morning' | 'evening' | 'weekly', RoutineStep[]>;
  phases: string[];
  score: number;
  pros: string[];
  cons: string[];
  scores: Record<string, number>;
  fullSpec: Record<string, string>;
}
export interface RoutinesData { count: number; items: Routine[] }
