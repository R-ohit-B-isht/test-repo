// Keyboard shortcuts. Documented in the `?` overlay and footer.
import { $ } from '../dom.js';
import { cycleTheme } from './theme.js';
import { toggleOverlay, isOpen } from './overlay.js';
import { stepDay } from '../render/itinerary.js';

const SECTIONS = ['#route', '#days', '#picks', '#budget', '#booking', '#sources'];

function isTyping(e) {
  const t = e.target;
  if (t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement || t.isContentEditable) return true;
  return t instanceof HTMLInputElement && !['checkbox', 'radio', 'range', 'button'].includes(t.type);
}

const anyOverlay = () => ['#help', '#brain', '#reel'].some(isOpen);

export function mountShortcuts(store, { onDev, onRoute }) {
  addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e) || $('dialog[open]')) return;
    const k = e.key.toLowerCase();
    if (k === '?') return toggleOverlay('#help', $('#help-toggle'));
    if (k === 'g') return toggleOverlay('#brain', $('#brain-open'));
    if (anyOverlay()) return;
    if (k === 't') return cycleTheme(store);
    if (k === 'd') return onDev();
    if (k === 'r') return onRoute();
    if (k === 'j') return stepDay(1);
    if (k === 'k') return stepDay(-1);
    const n = Number(e.key);
    if (n >= 1 && n <= SECTIONS.length) $(SECTIONS[n - 1]).scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}
