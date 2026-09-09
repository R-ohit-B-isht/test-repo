import { $ } from '../dom.js';
import { STRATEGIES } from '../strategies.js';
import { nextTheme } from './theme.js';
import { neighbours, currentPage } from '../pages.js';

// Keyboard shortcuts + the "?" overlay. Ignored while typing in a control.

const typing = (e) => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && e.target.type !== 'radio';

export function mountKeys(store, { toggleDev, brain, reel, replay }) {
  const help = $('#help');
  const setHelp = (open) => {
    help.dataset.open = String(open);
    help.setAttribute('aria-hidden', String(!open));
    if (open) $('[data-close]', help).focus();
  };
  $('#help-btn')?.addEventListener('click', () => setHelp(true));
  help.addEventListener('click', (e) => { if (e.target === help || e.target.closest('[data-close]')) setHelp(false); });
  const { prev, next } = neighbours(currentPage());

  addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || typing(e)) return;
    if (e.key === 'Escape') {
      if (replay?.isOpen()) return replay.close();
      if (reel?.isOpen()) return reel.close();
      if (brain?.isOpen()) brain.close();
      return setHelp(false);
    }
    if (e.key === '?') return setHelp(help.dataset.open !== 'true');
    if (e.key === '[' && prev) return location.assign(prev.href);
    if (e.key === ']' && next) return location.assign(next.href);
    const n = Number(e.key);
    if (n >= 1 && n <= STRATEGIES.length) return store.set({ strategy: STRATEGIES[n - 1].id });
    if (e.key === 't' || e.key === 'T') return store.set((s) => ({ theme: nextTheme(s.theme) }));
    if (e.key === 'd' || e.key === 'D') return toggleDev();
    if ((e.key === 'g' || e.key === 'G') && brain) return brain.isOpen() ? brain.close() : brain.open();
    return undefined;
  });
}
