import { $, html, inr } from '../dom.js';
import { icon } from '../icons.js';
import { GEMINI_MODELS } from '../config.js';
import { computeBudget } from '../budget.js';
import { planTrip, dayOf } from '../plan.js';
import { findStrategy } from '../strategies.js';
import { lookup, isExtra } from '../data/activities.js';
import { keyStore, generateJson } from '../brain/gemini.js';
import { buildContext, SYSTEM, SCHEMA } from '../brain/context.js';
import { toChanges, applyChanges } from '../brain/apply.js';

// "Plan brain" sheet: paste a Gemini key once (browser-only), say what you want,
// review the proposed switches as tickable rows with a live ₹ preview, apply.
// Mediator between the Gemini adapter, the command list and the store; keeps a
// Memento of the state before each apply so Undo is one tap.

const QUICK = [
  ['Cheaper', 'Make the whole trip cheaper without touching flights. Keep the two must-do parks if you can.'],
  ['More fun', 'More fun, fewer temples and museums. Fill every open slot with something exciting.'],
  ['Chill day', 'Give me one slow day with nothing paid — beach, cafés, a massage — and keep the rest.'],
  ['3 of us', 'We are three travellers now. Adjust everything that splits by group.'],
  ['Skip tombs', 'Skip the Hue tombs and the citadel; give me something fun in Hue instead.'],
  ['Spa afternoon', 'Add a spa or massage afternoon in Hoi An with a realistic price.'],
];

const MODEL_SLOT = 'vietnam-gemini-model';

let ui = { open: false, busy: false, result: null, error: '', applied: null, memento: null, lastFocus: null };
let store;

const modelOf = () => localStorage.getItem(MODEL_SLOT) || GEMINI_MODELS[0];

const KIND_ICON = { on: 'check', off: 'x', set: 'arrow', add: 'sparkle', remove: 'x' };

const keyRow = () => {
  const k = keyStore.get();
  return k
    ? html`<div class="bkey is-set"><span class="chip chip-jade">${icon('key')}key ····${k.slice(-4)}</span><span class="sub">stays in this browser</span><button class="btn-link" type="button" data-key-clear>change</button></div>`
    : html`<form class="bkey" data-key-form>
        <label class="sub" for="gkey">Gemini API key <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">free at AI Studio ${icon('link')}</a></label>
        <div class="row"><input id="gkey" name="key" type="password" autocomplete="off" placeholder="AIza…" required /><button class="btn btn-ghost" type="submit">Save</button></div>
        <span class="sub">Saved only in this browser's storage. Sent only to Google's Gemini API.</span>
      </form>`;
};

const modelSeg = () => html`
  <div class="seg brain-model" role="radiogroup" aria-label="Model">
    ${GEMINI_MODELS.map((m) => html`<label><input type="radio" name="gmodel" value="${m}" ${modelOf() === m ? 'checked' : ''} /><span>${m.replace('gemini-', '')}</span></label>`)}
  </div>`;

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
  return html`<span class="bdelta num ${d < 0 ? 'is-down' : d > 0 ? 'is-up' : ''}">${inr(before)} → <b>${inr(after)}</b> pp <em>${d === 0 ? 'no change' : `${d < 0 ? '−' : '+'}${inr(Math.abs(d))}`}</em></span>`;
};

const result = (state) => {
  const r = ui.result;
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

const output = (state) => {
  if (ui.busy) return html`<div class="bsay is-busy"><span class="spin" aria-hidden="true"></span><p>Asking ${modelOf()}…</p></div>`;
  if (ui.error) return html`<div class="berr" role="alert">${icon('shield')}<p>${ui.error}</p></div>`;
  if (ui.result) return result(state);
  if (ui.applied) {
    const { n, before } = ui.applied;
    const after = computeBudget(state).total;
    const d = after - before;
    return html`<div class="bsay is-done">${icon('check')}<p>Applied ${n} ${n === 1 ? 'change' : 'changes'} — cards and budget updated. <span class="num">${inr(after)} pp${d ? ` (${d < 0 ? '−' : '+'}${inr(Math.abs(d))})` : ''}</span></p></div>`;
  }
  return html`<p class="sub empty">Tell it what you want. It flips picks and dials — you review, then apply.</p>`;
};

const paint = () => {
  const root = $('#brain');
  root.dataset.open = String(ui.open);
  root.setAttribute('aria-hidden', String(!ui.open));
  document.body.classList.toggle('is-locked', ui.open || $('#board').dataset.open === 'true');
  $('#brain-key').innerHTML = keyRow();
  $('#brain-out').innerHTML = output(store.get());
  $('[data-undo]', root).hidden = !ui.memento;
  $('[data-ask]', root).disabled = ui.busy;
};

const shell = () => html`
  <div class="card">
    <div class="card-head">
      <h3 id="brain-title">${icon('brain')} Plan brain</h3>
      <div class="row">${modelSeg()}<button class="btn-icon" type="button" data-close aria-label="Close">×</button></div>
    </div>
    <div id="brain-key"></div>
    <div class="bquick" role="group" aria-label="Quick asks">${QUICK.map(([l, p]) => html`<button class="chip" type="button" data-quick="${p}">${l}</button>`)}</div>
    <form class="bask" data-ask-form>
      <textarea id="gask" name="ask" rows="2" placeholder="e.g. we are 3, skip the tombs, add a spa afternoon, make it cheaper" required></textarea>
      <div class="row">
        <button class="btn-link" type="button" data-undo hidden>${icon('arrow')} Undo last apply</button>
        <button class="btn" type="submit" data-ask>${icon('send')} Ask Gemini</button>
      </div>
    </form>
    <div id="brain-out" aria-live="polite"></div>
  </div>`;

async function ask(prompt) {
  ui = { ...ui, busy: true, error: '', result: null, applied: null };
  paint();
  try {
    const reply = await generateJson({ key: keyStore.get(), model: modelOf(), system: SYSTEM, user: `${buildContext(store.get())}\n\nTRAVELLER SAYS: ${prompt}`, schema: SCHEMA });
    ui = { ...ui, busy: false, result: toChanges(reply, store.get()) };
  } catch (e) {
    ui = { ...ui, busy: false, error: e.message || String(e) };
  }
  paint();
}

const apply = () => {
  if (!ui.result) return;
  const before = store.get();
  ui.memento = structuredClone(before);
  ui.applied = { n: ui.result.changes.filter((c) => c.checked).length, before: computeBudget(before).total };
  store.set(applyChanges(before, ui.result.changes));
  ui.result = null;
  paint();
  $('[data-undo]', $('#brain')).focus();
};

const undo = () => {
  if (!ui.memento) return;
  store.set(ui.memento);
  ui.memento = null;
  ui.applied = null;
  paint();
};

const open = (prompt) => {
  ui.lastFocus = document.activeElement;
  ui.open = true;
  paint();
  const ta = $('#gask');
  if (prompt) ta.value = prompt;
  (keyStore.get() ? ta : $('#gkey')).focus();
};

const close = () => {
  ui.open = false;
  paint();
  ui.lastFocus?.focus();
};

const onClick = (e) => {
  const root = $('#brain');
  if (e.target === root || e.target.closest('[data-close]')) return close();
  const q = e.target.closest('[data-quick]');
  if (q) { $('#gask').value = q.dataset.quick; return ask(q.dataset.quick); }
  if (e.target.closest('[data-key-clear]')) { keyStore.set(''); paint(); return $('#gkey')?.focus(); }
  if (e.target.closest('[data-apply]')) return apply();
  if (e.target.closest('[data-undo]')) return undo();
  return undefined;
};

const onSubmit = (e) => {
  e.preventDefault();
  if (e.target.matches('[data-key-form]')) { keyStore.set(new FormData(e.target).get('key')); paint(); return $('#gask').focus(); }
  const prompt = $('#gask').value.trim();
  if (!prompt) return undefined;
  if (!keyStore.get()) { ui.error = 'Paste a Gemini key first.'; paint(); return $('#gkey').focus(); }
  return ask(prompt);
};

const onChange = (e) => {
  if (e.target.name === 'gmodel') return localStorage.setItem(MODEL_SLOT, e.target.value);
  const i = e.target.dataset.change;
  if (i != null && ui.result) { ui.result.changes[Number(i)].checked = e.target.checked; $('#brain-out').innerHTML = result(store.get()); }
  return undefined;
};

export function mountBrain(s) {
  store = s;
  const root = $('#brain');
  root.innerHTML = shell();
  root.addEventListener('click', onClick);
  root.addEventListener('submit', onSubmit);
  root.addEventListener('change', onChange);
  root.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  $('#brain-btn').addEventListener('click', () => open());
  document.addEventListener('brain:open', (e) => open(e.detail?.prompt));
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-brain]');
    if (b) open(b.dataset.brain);
  });
  store.subscribe(() => { if (ui.open && ui.result) $('#brain-out').innerHTML = output(store.get()); });
  paint();
  return { open, close, isOpen: () => ui.open };
}

export const brainCta = (prompt, label = 'Ask Gemini') => html`<button class="chip chip-brain" type="button" data-brain="${prompt}">${icon('brain')}${label}</button>`;
