// Keyboard shortcuts + help overlay. Documented in the `?` overlay and footer.
import { $, $$ } from '../dom.js';
import { cycleTheme } from './theme.js';
import { stepDay } from '../render/itinerary.js';

const SECTIONS = ['#route', '#days', '#budget', '#booking', '#sources'];

function isTyping(e) {
  const t = e.target;
  if (t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement || t.isContentEditable) return true;
  return t instanceof HTMLInputElement && !['checkbox', 'radio', 'range', 'button'].includes(t.type);
}

export function toggleHelp(force) {
  const help = $('#help');
  const open = force ?? help.hidden;
  help.hidden = !open;
  $('#help-toggle').setAttribute('aria-expanded', String(open));
  if (open) $('[data-close-help]').focus();
  else $('#help-toggle').focus();
}

export function mountShortcuts(store, { onDev, onRoute }) {
  $('#help-toggle').addEventListener('click', () => toggleHelp());
  $$('[data-close-help]').forEach((b) => b.addEventListener('click', () => toggleHelp(false)));
  $('#help').addEventListener('click', (e) => { if (e.target === e.currentTarget) toggleHelp(false); });

  addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e)) return;
    if (e.key === 'Escape' && !$('#help').hidden) return toggleHelp(false);
    const k = e.key.toLowerCase();
    if (k === 't') return cycleTheme(store);
    if (k === '?') return toggleHelp();
    if (k === 'd') return onDev();
    if (k === 'r') return onRoute();
    if (k === 'j') return stepDay(1);
    if (k === 'k') return stepDay(-1);
    const n = Number(e.key);
    if (n >= 1 && n <= SECTIONS.length) $(SECTIONS[n - 1]).scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}
