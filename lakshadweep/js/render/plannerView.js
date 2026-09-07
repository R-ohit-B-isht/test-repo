// Markup for the Gemini planner panel: ask bar, key sheet, and the suggestion
// list with per-change price deltas. Pure functions of data → HTML string.
import { html, raw } from '../dom.js';
import { icon } from '../icons.js';
import { fmt } from '../budget.js';
import { preview } from '../ai/apply.js';

export const QUICK_ASKS = [
  ['Cheaper', 'Make it cheaper without losing the fun'],
  ['More fun', 'More fun: boats, diving, snorkelling'],
  ['Less walking', 'Less walking around, more in the water'],
  ['3 of us', 'Three of us are going'],
  ['Comfier', 'A bit more comfort on the ship and the stay'],
  ['Shorter', 'Shortest trip that still sees the islands'],
];

const ICON_BY_OP = { pick: 'check', unpick: 'ban', strategy: 'pin', shipClass: 'ship', trainClass: 'train', travellers: 'bag', homestayRate: 'home' };

const signed = (n) => (n === 0 ? '±₹0' : `${n > 0 ? '+' : '−'}${fmt(Math.abs(n))}`);

export function shell(hasKey) {
  return html`
    <form class="brain__ask" id="brain-form" autocomplete="off">
      <span class="brain__spark" aria-hidden="true">${raw(icon('spark'))}</span>
      <input class="brain__in" id="brain-prompt" type="text" maxlength="240" placeholder="Tell the plan what you want…" aria-label="Ask Gemini to change the plan" />
      <button type="submit" class="cta cta--sm" id="brain-go">Ask</button>
      <button type="button" class="chip brain__keychip" id="brain-key-toggle" aria-expanded="false" aria-controls="brain-key" data-has-key="${hasKey}">Key</button>
    </form>
    <div class="brain__chips" role="group" aria-label="Quick asks">
      ${raw(QUICK_ASKS.map(([label, text]) => html`<button type="button" class="chip" data-ask="${text}">${label}</button>`).join(''))}
    </div>
    <form class="brain__key" id="brain-key" hidden>
      <input type="password" id="brain-key-in" autocomplete="off" spellcheck="false" placeholder="Paste your Gemini key · stays in this browser" aria-label="Gemini API key" />
      <button type="submit" class="chip">Save</button>
      <button type="button" class="chip" data-key-clear>Clear</button>
      <a class="brain__getkey" href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">Get a key</a>
    </form>
    <div class="brain__out" id="brain-out" aria-live="polite"></div>`;
}

export const noteHtml = (text, tone = '') => html`<p class="brain__note ${tone}">${text}</p>`;

export function loadingHtml(prompt) {
  return html`<p class="brain__note is-thinking"><span class="brain__dots" aria-hidden="true"><i></i><i></i><i></i></span> Thinking about “${prompt}”</p>`;
}

function row(c, i, state) {
  if (!c.ok) {
    return html`<li class="sug sug--no">${raw(icon('ban'))}<span class="sug__name">${c.label || c.op} ${c.name || c.value}</span><small>${c.reason}</small></li>`;
  }
  const d = preview([c], state).delta;
  return html`
    <li class="sug">
      <label>
        <input type="checkbox" data-sug="${i}" checked />
        ${raw(icon(ICON_BY_OP[c.op] || 'pin'))}
        <span class="sug__name"><b>${c.label}</b> ${c.name}</span>
        <small>${c.why}</small>
        <em class="sug__delta" data-neg="${d < 0}">${signed(d)}</em>
      </label>
    </li>`;
}

export function suggestionsHtml(result, state) {
  const ok = result.changes.filter((c) => c.ok);
  if (!ok.length) {
    const reasons = result.changes.map((c) => c.reason).filter(Boolean);
    return noteHtml(reasons.length ? `Nothing to change: ${[...new Set(reasons)].join(', ')}.` : 'Nothing to change; the plan already does that.');
  }
  return html`
    <p class="brain__sum">${result.summary}</p>
    <ul class="brain__list">${raw(result.changes.map((c, i) => row(c, i, state)).join(''))}</ul>
    <div class="brain__foot" id="brain-foot"></div>`;
}

export function footHtml(p, applied) {
  if (applied) return html`<span class="brain__total">Applied · ${fmt(p.before)} all-in / person</span><button type="button" class="chip" data-undo>Undo</button>`;
  if (!p.count) return html`<span class="brain__total">Tick what you want</span>`;
  return html`
    <span class="brain__total">${fmt(p.before)} → <b>${fmt(p.after)}</b> <em data-neg="${p.delta < 0}">${signed(p.delta)}</em> all-in / person · ${p.days} days${p.skipped > 0 ? ` · ${p.skipped} won’t fit` : ''}</span>
    <button type="button" class="cta cta--sm" data-apply>Apply ${p.count}</button>`;
}
