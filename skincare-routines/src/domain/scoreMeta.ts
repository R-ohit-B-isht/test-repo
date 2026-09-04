import type { InciStatus, ScoreKey } from '../lib/types';

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
