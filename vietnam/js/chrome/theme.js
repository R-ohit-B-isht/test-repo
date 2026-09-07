import { $ } from '../dom.js';
import { icon } from '../icons.js';

// Three-state theme (State pattern: auto → light → dark → auto), persisted in the store.

const ORDER = ['auto', 'light', 'dark'];
const ICON = { auto: 'sparkle', light: 'sun', dark: 'moon' };

export const nextTheme = (t) => ORDER[(ORDER.indexOf(t) + 1) % ORDER.length];

export function mountTheme(store) {
  const btn = $('#theme-btn');
  btn.addEventListener('click', () => store.set((s) => ({ theme: nextTheme(s.theme) })));
  store.subscribe((s) => {
    document.documentElement.dataset.theme = s.theme;
    btn.innerHTML = icon(ICON[s.theme]).s;
    btn.setAttribute('aria-label', `Theme: ${s.theme}`);
    const dark = s.theme === 'dark' || (s.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
    $('meta[name="theme-color"]').content = dark ? '#121a17' : '#f7f2e8';
  });
}
