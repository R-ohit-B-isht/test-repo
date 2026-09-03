export type Zone = 'face' | 'body' | 'both';
export type ScoreKey = 'trust' | 'skin' | 'ingredients' | 'experience';
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
  byScope: Record<'face' | 'body' | 'both' | 'unstated', number>;
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
  phases: string[];
  shards: number;
  categories: CategoryMeta[];
  routines: { count: number; categories: string[] };
  total: number;
}

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
  step?: string;
}

export interface CategoryData {
  id: string;
  count: number;
  tagIndex: string[];
  facets: Record<string, FacetRow[]>;
  items: ProductRow[];
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
