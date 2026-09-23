import { useSyncExternalStore } from 'react';

export type Theme = 'auto' | 'light' | 'dark';
const KEY = 'theme';
const listeners = new Set<() => void>();

function read(): Theme {
  try { const t = localStorage.getItem(KEY); return t === 'light' || t === 'dark' ? t : 'auto'; } catch { return 'auto'; }
}
let current: Theme = read();

/** Observer store for the light / dark / auto preference; the <html data-theme> attribute is the single source of truth for CSS. */
export function setTheme(t: Theme) {
  current = t;
  try { if (t === 'auto') localStorage.removeItem(KEY); else localStorage.setItem(KEY, t); } catch { /* private mode */ }
  if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t);
  listeners.forEach((l) => l());
}

export function useTheme(): Theme {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => current, () => current);
}

export const THEME_ORDER: Theme[] = ['auto', 'light', 'dark'];
