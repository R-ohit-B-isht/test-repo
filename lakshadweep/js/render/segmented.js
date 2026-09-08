// Radio-group behaviour shared by the strategy cards and class pickers.
import { $$ } from '../dom.js';

export function bindRadios(root, onPick) {
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[role="radio"]');
    if (btn && root.contains(btn)) onPick(btn.dataset.id, btn.dataset.group);
  });
  root.addEventListener('keydown', (e) => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
    const active = document.activeElement;
    if (!active || active.getAttribute('role') !== 'radio') return;
    const group = active.closest('[role="radiogroup"]') || root;
    const items = $$('[role="radio"]', group);
    const i = items.indexOf(active);
    if (i < 0) return;
    e.preventDefault();
    const fwd = e.key === 'ArrowRight' || e.key === 'ArrowDown';
    const next = items[(i + (fwd ? 1 : items.length - 1)) % items.length];
    next.focus();
    onPick(next.dataset.id, next.dataset.group);
  });
}

// Only the checked state changes on re-render so focus is never lost.
export function syncChecked(root, checkedId) {
  $$('[role="radio"]', root).forEach((btn) => {
    const on = btn.dataset.id === checkedId;
    btn.setAttribute('aria-checked', String(on));
    btn.tabIndex = on ? 0 : -1;
  });
  if (!$$('[role="radio"][aria-checked="true"]', root).length) {
    const first = root.querySelector('[role="radio"]');
    if (first) first.tabIndex = 0;
  }
}
