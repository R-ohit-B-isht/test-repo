// Three-state theme: auto → light → dark, persisted in the store.
import { $ } from '../dom.js';

const ORDER = ['auto', 'light', 'dark'];

export function applyTheme(theme) {
  if (theme === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  const btn = $('#theme-toggle');
  btn.textContent = theme;
  btn.setAttribute('aria-label', `Theme: ${theme}`);
}

export function cycleTheme(store) {
  const cur = store.get().theme;
  store.set({ theme: ORDER[(ORDER.indexOf(cur) + 1) % ORDER.length] });
}

export function mountTheme(store) {
  $('#theme-toggle').addEventListener('click', () => cycleTheme(store));
  store.subscribe((s) => applyTheme(s.theme));
}
