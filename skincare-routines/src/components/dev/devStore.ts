import { useEffect, useSyncExternalStore } from 'react';

export type DevInfo = Record<string, string | number | boolean | null | undefined>;

/** Tiny observer store: pages publish diagnostics, the ?dev=1 panel subscribes. */
let info: DevInfo = {};
const listeners = new Set<() => void>();

export function publishDev(patch: DevInfo) {
  info = { ...info, ...patch };
  listeners.forEach((l) => l());
}

export function useDevInfo(): DevInfo {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => info, () => info);
}

/** Publish diagnostics whenever they change (only wired when dev mode is on). */
export function useDevPublish(enabled: boolean, patch: DevInfo) {
  const key = JSON.stringify(patch);
  useEffect(() => { if (enabled) publishDev(JSON.parse(key) as DevInfo); }, [enabled, key]);
}
