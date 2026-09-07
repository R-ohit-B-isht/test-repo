import { $ } from '../dom.js';
import { STRATEGIES } from '../strategies.js';
import { nextTheme } from './theme.js';

// Keyboard shortcuts + the "?" overlay. Ignored while typing in a control.

const typing = (e) => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && e.target.type !== 'radio';

export function mountKeys(store, { toggleDev }) {
  const help = $('#help');
  const setHelp = (open) => {
    help.dataset.open = String(open);
    help.setAttribute('aria-hidden', String(!open));
    if (open) $('[data-close]', help).focus();
  };
  $('#help-btn').addEventListener('click', () => setHelp(true));
  help.addEventListener('click', (e) => { if (e.target === help || e.target.closest('[data-close]')) setHelp(false); });

  addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || typing(e)) return;
    if (e.key === 'Escape') return setHelp(false);
    if (e.key === '?') return setHelp(help.dataset.open !== 'true');
    const n = Number(e.key);
    if (n >= 1 && n <= STRATEGIES.length) return store.set({ strategy: STRATEGIES[n - 1].id });
    if (e.key === 't' || e.key === 'T') return store.set((s) => ({ theme: nextTheme(s.theme) }));
    if (e.key === 'd' || e.key === 'D') return toggleDev();
    return undefined;
  });
}
