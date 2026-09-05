import type { InciSourceKind, InciStatus, PlaceTag, ScoreKey, Zone } from '../lib/types';

/** Label + colour for a category zone (hub) or a listing's placement tag (card / sheet). Hair keys are scalp / lengths, never face / body. */
export const PLACE_META: Record<Zone | PlaceTag, { label: string; tone: string }> = {
  face: { label: 'Face', tone: 'zone-face' },
  body: { label: 'Body', tone: 'zone-body' },
  both: { label: 'Face + body', tone: 'zone-both' },
  hair: { label: 'Hair', tone: 'zone-hair' },
  'scope:face': { label: 'Face', tone: 'zone-face' },
  'scope:body': { label: 'Body', tone: 'zone-body' },
  'scope:both': { label: 'Face + body', tone: 'zone-both' },
  'scope:unstated': { label: 'Scope not stated', tone: 'text-muted' },
  'area:scalp': { label: 'Scalp', tone: 'zone-hair' },
  'area:lengths': { label: 'Lengths & ends', tone: 'zone-hair' },
  'area:both': { label: 'Scalp + lengths', tone: 'zone-hair' },
  'area:unstated': { label: 'Area not stated', tone: 'text-muted' },
};

export interface ScoreMeta { key: ScoreKey; label: string; hint: string }

/** Human labels for the four ranking dimensions (weights come from the manifest). Seller claims feed none of them. */
export const SCORE_META: ScoreMeta[] = [
  { key: 'ingredients', label: 'Formula', hint: 'Evidence-graded actives read off the verified INCI list — 0 when no full list is published' },
  { key: 'skin', label: 'Skin safety', hint: 'Named irritants on the verified INCI list (fragrance, allergens, drying alcohol, harsh surfactants) — 0 when unverified' },
  { key: 'trust', label: 'Maker & transparency', hint: 'Accountable manufacturer (pharma / global / Indian group) plus full ingredient disclosure' },
  { key: 'experience', label: 'Buyer evidence', hint: 'Real star rating and review depth, capped so it can only support, never carry, a score' },
];

/** Hair pages score the same irritant list, but it is the scalp (and hair shaft) that is exposed — the label must not say "skin". */
const HAIR_SAFETY: ScoreMeta = {
  key: 'skin', label: 'Scalp & hair safety',
  hint: 'Named irritants on the verified INCI list (fragrance, allergens, harsh sulfates, drying alcohol) as they touch the scalp — 0 when unverified',
};

export const scoreMetaFor = (zone: Zone): ScoreMeta[] => (zone === 'hair' ? SCORE_META.map((m) => (m.key === 'skin' ? HAIR_SAFETY : m)) : SCORE_META);

/** Card-level badge for what the score is based on. */
export const INCI_META: Record<InciStatus, { label: string; short: string; tone: 'good' | 'warn' | 'muted' }> = {
  full: { label: 'Full INCI list published', short: 'INCI', tone: 'good' },
  partial: { label: 'Key-ingredients line only — formula unscored', short: 'Partial', tone: 'warn' },
  garbled: { label: 'Ingredient text unreadable — formula unscored', short: 'Unreadable', tone: 'warn' },
  none: { label: 'No ingredient list on the listing — formula unscored', short: 'No INCI', tone: 'muted' },
};

/** Where a verified list came from when it was not printed on the listing itself. */
export const INCI_SOURCE_META: Record<InciSourceKind, { label: string; short: string }> = {
  listing: { label: 'Published on the marketplace listing', short: '' },
  'brand-site': { label: 'Read from the brand’s official website (not printed on the listing)', short: 'brand site' },
  secondary: { label: 'Read from a third-party ingredient database (not on the listing or brand site) — counted at 90%', short: 'database' },
};
