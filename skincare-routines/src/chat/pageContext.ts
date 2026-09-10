import { useEffect, useSyncExternalStore } from 'react';
import type { PageContext } from './types';

/** Observer bridge: pages publish what the user sees; the assistant reads the latest snapshot when a question is sent. */
let current: PageContext = { route: '/' };
const listeners = new Set<() => void>();

export function publishPage(patch: Partial<PageContext>) {
  current = { ...current, ...patch };
  listeners.forEach((l) => l());
}

export const getPage = (): PageContext => current;

export function usePage(): PageContext {
  return useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, () => current, () => current);
}

/** Pages publish what they show; on unmount the same keys are cleared so a stale category never follows the user to another route. */
export function usePagePublish(patch: Partial<PageContext>) {
  const key = JSON.stringify(patch);
  useEffect(() => {
    const p = JSON.parse(key) as Partial<PageContext>;
    publishPage(p);
    return () => { publishPage(Object.fromEntries(Object.keys(p).map((k) => [k, undefined])) as Partial<PageContext>); };
  }, [key]);
}
