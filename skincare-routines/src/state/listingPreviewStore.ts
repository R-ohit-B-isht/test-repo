import { useSyncExternalStore } from 'react';

export interface ListingPreview {
  category: string;
  id: string;
}

const listeners = new Set<() => void>();
let current: ListingPreview | null = null;

const emit = () => listeners.forEach((l) => l());

/** Observer store for "open this listing in place" from any surface outside the chat (routine steps, proposals, shelf):
 * the app shell renders one ListingSheet for it, so tapping a pinned product never leaves the page. */
export const openListing = (category: string, id: string) => { current = { category, id }; emit(); };
export const closeListing = () => { current = null; emit(); };

export function useListingPreview(): ListingPreview | null {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => current, () => current);
}
