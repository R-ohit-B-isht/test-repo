import type { EvidenceStatus, FamilyKey, FieldTier, MakerKind, ScoreKey } from '../lib/types';

export interface ScoreMeta { key: ScoreKey; label: string; hint: string }

/** Human labels for the four ranking dimensions (weights come from the manifest). Seller claims feed none of them. */
export const SCORE_META: ScoreMeta[] = [
  { key: 'specs', label: 'Verified specs', hint: 'Capacity, output, ports and the like — full credit when read on the maker’s product page, 60% from the marketplace spec table, 0 for title claims' },
  { key: 'safety', label: 'Protection & certification', hint: 'Named circuit protections and BIS / safety registrations that a maker page or spec table actually states' },
  { key: 'maker', label: 'Maker & warranty', hint: 'An identifiable manufacturer with an Indian entity or company behind the brand, plus the stated warranty' },
  { key: 'buyers', label: 'Buyer evidence', hint: 'Real star rating and review depth, capped so it can only support, never carry, a score' },
];

/** Hub family: label lives in the manifest; the tone is the only thing the UI adds. */
export const FAMILY_TONE: Record<FamilyKey, { text: string; bg: string; band: string }> = {
  power: { text: 'fam-power', bg: 'bg-power', band: 'bg-power/10' },
  grooming: { text: 'fam-grooming', bg: 'bg-grooming', band: 'bg-grooming/10' },
  kitchen: { text: 'fam-kitchen', bg: 'bg-kitchen', band: 'bg-kitchen/10' },
  drinkware: { text: 'fam-drinkware', bg: 'bg-drinkware', band: 'bg-drinkware/10' },
  outdoor: { text: 'fam-outdoor', bg: 'bg-outdoor', band: 'bg-outdoor/10' },
};

/** Card-level badge for what the score is based on. */
export const EVIDENCE_META: Record<EvidenceStatus, { label: string; short: string; tone: 'good' | 'ok' | 'warn' | 'muted' }> = {
  official: { label: 'Specifications verified on the maker’s product page', short: 'Maker-verified', tone: 'good' },
  listing: { label: 'Marketplace spec table only — seller-stated, credited at 60%', short: 'Spec table', tone: 'ok' },
  claimed: { label: 'Only title / seller-text claims — specs unscored', short: 'Claims only', tone: 'warn' },
  none: { label: 'No specifications published anywhere we could read — specs unscored', short: 'No specs', tone: 'muted' },
};

/** Per-field provenance chip inside the evidence panel. */
export const TIER_META: Record<FieldTier, { short: string; tone: 'good' | 'ok' | 'warn' | 'bad' | 'muted' }> = {
  official: { short: 'maker page', tone: 'good' },
  listing: { short: 'spec table', tone: 'ok' },
  claimed: { short: 'claim · 0', tone: 'warn' },
  rejected: { short: 'rejected · 0', tone: 'bad' },
  none: { short: 'not stated', tone: 'muted' },
};

export const MAKER_SHORT: Record<MakerKind, string> = {
  global: 'Global maker · Indian entity',
  india: 'Indian manufacturer',
  d2c: 'Indian D2C brand',
  unknown: 'Maker not verified',
};

export const TONE_TEXT = { good: 'text-success', ok: 'text-accent', warn: 'text-warning', bad: 'text-danger', muted: 'text-muted' } as const;
