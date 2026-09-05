/** Hub grouping for the nine physical-goods categories. Keys and labels come from the manifest. */
export type FamilyKey = 'power' | 'grooming' | 'kitchen' | 'drinkware' | 'outdoor';
export type ScoreKey = 'specs' | 'safety' | 'maker' | 'buyers';
export type Scores = Record<ScoreKey, number>;

/**
 * Where a listing's specifications were read from, best tier first. Only `official` and `listing` earn credit;
 * `claimed` is title / seller copy and `none` means nothing verifiable was published anywhere we could read.
 */
export type EvidenceStatus = 'official' | 'listing' | 'claimed' | 'none';
/** Per-field provenance: the same ladder plus `rejected` for implausible seller values. */
export type FieldTier = EvidenceStatus | 'rejected';
export type MakerKind = 'global' | 'india' | 'd2c' | 'unknown';

export interface FacetGroupDef { label: string; hint: string; multi: boolean }
export interface FacetRow { tag: string; label: string; count: number }

export interface SegmentOption { id: string; label: string }
/** The category's own one-axis split (capacity class, wattage band, …) shown as a segmented control above the list. */
export interface SegmentDef { key: string; label: string; options: SegmentOption[] }
export interface FieldDef { key: string; label: string; group: string; dim: ScoreKey }

export interface CategoryMeta {
  id: string;
  label: string;
  kicker: string;
  family: FamilyKey;
  unit: string;
  blurb: string;
  facets: string[];
  featured: string[];
  count: number;
  segment: SegmentDef;
  bySegment: Record<string, number>;
  stores: { flipkart: number; amazon: number };
  evidence: Record<EvidenceStatus, number>;
  fields: FieldDef[];
  priceMax: number;
}

export interface Manifest {
  generatedAt: string;
  weights: Scores;
  criteria: Record<ScoreKey, string>;
  families: Record<FamilyKey, string>;
  tiers: Record<FieldTier, string>;
  statusLabels: Record<EvidenceStatus, string>;
  makerKinds: Record<MakerKind, string>;
  /** Keyed `${categoryId}/${group}` — group ids are only unique within a category. */
  groups: Record<string, FacetGroupDef>;
  shards: number;
  categories: CategoryMeta[];
  benchmarks: Benchmark[];
  total: number;
}

export interface BenchmarkLink { label: string; url: string; title?: string; region?: string }
export interface BenchmarkEvidence extends BenchmarkLink { publisher: string; note?: string }
export interface BenchmarkListing { id: string; rank: number; of: number; score: number; price: number; store: string; title: string; listings: number; note: string | null; ev: EvidenceStatus }
/**
 * How the benchmark relates to the real Flipkart / Amazon.in listings of its category:
 * `found` = the same product with its actual rank; `related` = a sibling / regional variant, never claimed as identical; `not-found` = explicit.
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
  q: string;      // headline spec line (e.g. "20,000 mAh · 22.5 W")
  f: string;      // secondary spec line
  r: number | null;   // rating
  rc: number | null;  // rating count
  t: number[];    // tag indices into tagIndex
  ev: EvidenceStatus; // best evidence tier behind the score
  vf: number;     // fields verified on the maker page
  sf: number;     // fields read from the marketplace spec table
  mk: MakerKind;
}

export interface CategoryData {
  id: string;
  count: number;
  tagIndex: string[];
  facets: Record<string, FacetRow[]>;
  items: ProductRow[];
}

/** One verified-or-not specification field. `credited` is the % of the field's weight actually earned. */
export interface EvidenceField {
  key: string;
  label: string;
  group: string;
  dim: ScoreKey;
  value: number | string | string[] | boolean | null;
  display: string | null;
  tier: FieldTier;
  credited: number;
  source?: string;    // exact maker page the value was read from
  conflict?: string;  // marketplace value disagreed with the maker page — kept, not hidden
  reason?: string;    // why a value was rejected
}
export interface OfficialMatch { url: string; title: string; matchScore: number; region: string; fetchedAt: string }
export interface EvidenceMaker { parent: string | null; kind: MakerKind; label: string; pts: number; url: string | null; site: string | null; warranty: string }
/** Everything the score was read from — never seller adjectives. Absent pieces are null / empty, not filled in. */
export interface Evidence {
  status: EvidenceStatus;
  official: OfficialMatch | null;
  fields: EvidenceField[];
  counts: Record<FieldTier, number>;
  claims: string[];
  maker: EvidenceMaker;
  buyers: string;
}

export interface ProductDetail {
  title: string;
  images: string[];
  buyUrl: string;
  buyStore: string;
  tags: string[];
  evidence: Evidence;
  listingSpec: Record<string, string>;
}
