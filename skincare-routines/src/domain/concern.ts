import type { CategoryMeta } from '../lib/types';

/** Concern picks share the category pages' `?f=target:*` tag shape, so a hub pick carries straight into the list it opens. */
export const CONCERN_PARAM = 'f';
const PREFIX = 'target:';
export const concernTag = (id: string) => `${PREFIX}${id}`;
export const pickedConcerns = (params: URLSearchParams) =>
  params.getAll(CONCERN_PARAM).filter((t) => t.startsWith(PREFIX)).map((t) => t.slice(PREFIX.length));

/** Listings carrying any of the picked concerns is not additive across concerns (a serum can be both acne and dark-spots), so a lower bound — the max — is shown, never a made-up sum. */
export function concernCount(cat: CategoryMeta, picked: string[]): number {
  if (!picked.length) return cat.count;
  return Math.max(0, ...picked.map((id) => cat.byConcern[id] ?? 0));
}
