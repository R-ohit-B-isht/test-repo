import type { ScoreKey } from '../lib/types';

/** Human labels for the four ranking dimensions (weights come from the manifest). */
export const SCORE_META: { key: ScoreKey; label: string; hint: string }[] = [
  { key: 'trust', label: 'Brand trust', hint: 'Brand track record, buyer rating and review depth' },
  { key: 'skin', label: 'Skin safety', hint: 'Free-from, derm-tested and sensitivity claims in the listing' },
  { key: 'ingredients', label: 'Actives & ingredients', hint: 'Evidence-backed actives the seller actually lists' },
  { key: 'experience', label: 'Format & experience', hint: 'Format, size, texture and usage clarity' },
];
