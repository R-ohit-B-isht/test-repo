import type { InciSourceKind, InciStatus, ScoreKey } from '../lib/types';

/** Human labels for the four ranking dimensions (weights come from the manifest). Seller claims feed none of them. */
export const SCORE_META: { key: ScoreKey; label: string; hint: string }[] = [
  { key: 'ingredients', label: 'Formula', hint: 'Evidence-graded actives read off the verified INCI list — 0 when no full list is published' },
  { key: 'skin', label: 'Skin safety', hint: 'Named irritants on the verified INCI list (fragrance, allergens, drying alcohol, harsh surfactants) — 0 when unverified' },
  { key: 'trust', label: 'Maker & transparency', hint: 'Accountable manufacturer (pharma / global / Indian group) plus full ingredient disclosure' },
  { key: 'experience', label: 'Buyer evidence', hint: 'Real star rating and review depth, capped so it can only support, never carry, a score' },
];

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
