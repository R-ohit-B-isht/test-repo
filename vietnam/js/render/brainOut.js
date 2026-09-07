import { html, inr } from '../dom.js';
import { icon } from '../icons.js';
import { computeBudget } from '../budget.js';
import { planTrip, dayOf } from '../plan.js';
import { findStrategy } from '../strategies.js';
import { lookup, isExtra } from '../data/activities.js';
import { applyChanges } from '../brain/apply.js';

// Output pane of the Brain sheet: busy / error / proposal (tickable change rows
// with a live ₹ preview) / applied receipt. Pure view over the brain `ui` state.

const KIND_ICON = { on: 'check', off: 'x', set: 'arrow', add: 'sparkle', remove: 'x' };

const signed = (d) => `${d < 0 ? '−' : '+'}${inr(Math.abs(d))}`;

const landing = (c, plan, state) => {
  if (!c.checked || (c.kind !== 'on' && c.kind !== 'add')) return '';
  const id = c.key.slice(c.kind.length + 1);
  const x = lookup(state, id);
  if (x && isExtra(x)) return html`<span class="chip chip-lantern num">+days</span>`;
  const d = dayOf(plan, id);
  return d ? html`<span class="chip chip-ink num">D${d}</span>` : html`<span class="chip chip-sun num">no room</span>`;
};

const changeRow = (plan, state) => (c, i) => html`
  <label class="bchange is-${c.kind}">
    <input type="checkbox" data-change="${i}" ${c.checked ? 'checked' : ''} />
    <span class="ic-wrap">${icon(KIND_ICON[c.kind])}</span>
    <span class="txt"><b>${c.label}</b><span class="sub">${c.sub}</span></span>
    ${landing(c, plan, state)}
    <span class="badge">${c.kind === 'set' ? 'dial' : c.kind}</span>
  </label>`;

const delta = (state, r) => {
  const before = computeBudget(state).total;
  const after = computeBudget(applyChanges(state, r.changes)).total;
  const d = after - before;
  return html`<span class="bdelta num ${d < 0 ? 'is-down' : d > 0 ? 'is-up' : ''}">${inr(before)} → <b>${inr(after)}</b> pp <em>${d === 0 ? 'no change' : signed(d)}</em></span>`;
};

export const proposal = (state, r) => {
  const n = r.changes.filter((c) => c.checked).length;
  const after = applyChanges(state, r.changes);
  const plan = planTrip(after, findStrategy(after.strategy).transit);
  return html`
    <div class="bsay">${icon('sparkle')}<p>${r.say || 'Done.'}</p></div>
    ${r.changes.length ? html`<div class="bchanges">${r.changes.map(changeRow(plan, after))}</div>` : html`<p class="sub empty">No switches to flip.</p>`}
    ${r.why.length ? html`<ul class="bwhy">${r.why.map((w) => html`<li>${w}</li>`)}</ul>` : ''}
    ${r.ignored.length ? html`<p class="sub bignored">${icon('shield')} skipped: ${r.ignored.join(' · ')}</p>` : ''}
    <div class="bapply">
      ${delta(state, r)}
      <button class="btn" type="button" data-apply ${n ? '' : 'disabled'}>${icon('check')} Apply ${n ? n : ''}</button>
    </div>`;
};

const receipt = (state, { n, before }) => {
  const after = computeBudget(state).total;
  const d = after - before;
  return html`<div class="bsay is-done">${icon('check')}<p>Applied ${n} ${n === 1 ? 'change' : 'changes'} — cards and budget updated. <span class="num">${inr(after)} pp${d ? ` (${signed(d)})` : ''}</span></p></div>`;
};

export const output = (state, ui, model) => {
  if (ui.busy) return html`<div class="bsay is-busy"><span class="spin" aria-hidden="true"></span><p>Asking ${model}…</p></div>`;
  if (ui.error) return html`<div class="berr" role="alert">${icon('shield')}<p>${ui.error}</p></div>`;
  if (ui.result) return proposal(state, ui.result);
  if (ui.applied) return receipt(state, ui.applied);
  return html`<p class="sub empty">Tell it what you want. It flips picks and dials — you review, then apply.</p>`;
};
