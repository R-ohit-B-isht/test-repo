import { useSyncExternalStore } from 'react';

export interface Toast {
  id: number;
  text: string;
  action?: { label: string; run: () => void };
}

const listeners = new Set<() => void>();
let toasts: Toast[] = [];
let seq = 0;
const timers = new Map<number, ReturnType<typeof setTimeout>>();
const MAX_VISIBLE = 2;
const TTL = 4000;

const emit = () => listeners.forEach((l) => l());

export function dismissToast(id: number) {
  const t = timers.get(id);
  if (t) clearTimeout(t);
  timers.delete(id);
  toasts = toasts.filter((x) => x.id !== id);
  emit();
}

/** Observer store for bottom toasts (Booking "Saved · Change" pattern): one line, at most one action, auto-dismiss. */
export function toast(text: string, action?: Toast['action']): number {
  const id = ++seq;
  toasts = [...toasts.slice(-(MAX_VISIBLE - 1)), { id, text, action }];
  timers.set(id, setTimeout(() => dismissToast(id), TTL));
  emit();
  return id;
}

export function useToasts(): Toast[] {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => toasts,
    () => toasts,
  );
}
