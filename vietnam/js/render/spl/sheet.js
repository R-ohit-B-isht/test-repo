import { $, $$, inr } from '../../dom.js';
import { toInr, rateOf } from '../../split/model.js';
import { balances } from '../../split/math.js';
import { expenseForm, settleForm, expenseFace, personFace } from './form.js';

// The Split page's use of the shell's #sheet overlay: one row, the add / edit
// form, a settle-up form or a person card. Holds which face is open so a store
// change can repaint read-only faces without touching a form you are typing in.

let ui = { mode: null, id: null, preset: null, lastFocus: null };

const setOpen = (root, on) => {
  root.dataset.open = String(on);
  root.setAttribute('aria-hidden', String(!on));
  document.body.classList.toggle('is-locked', on);
};

const face = (state) => {
  if (ui.mode === 'form') return expenseForm(state, ui.id ? state.expenses.find((x) => x.id === ui.id) : null, ui.preset || {});
  if (ui.mode === 'settle') return settleForm(state, ui.preset || {});
  if (ui.mode === 'person') return personFace(state, ui.id, balances(state)[ui.id] || 0);
  const x = state.expenses.find((e) => e.id === ui.id && !e.deleted);
  return x ? expenseFace(state, x) : '';
};

export const closeSheet = () => {
  setOpen($('#sheet'), false);
  ui = { ...ui, mode: null };
  ui.lastFocus?.focus();
  ui.lastFocus = null;
};

export const openSheet = (state, next) => {
  const root = $('#sheet');
  if (!ui.mode) ui.lastFocus = document.activeElement;
  ui = { ...ui, ...next };
  const markup = face(state);
  if (!markup) return closeSheet();
  $('.card', root).innerHTML = markup;
  setOpen(root, true);
  $('.card', root).scrollTop = 0;
  ($('input[name=title], input[name=name], input[name=amount]', root) || $('[data-close]', root))?.focus();
  return undefined;
};

// After a store change: repaint read-only faces, leave forms alone.
export const refreshSheet = (state) => {
  const root = $('#sheet');
  if (root.dataset.open !== 'true' || !ui.mode || ui.mode === 'form' || ui.mode === 'settle') return;
  const m = face(state);
  if (m) $('.card', root).innerHTML = m; else closeSheet();
};

// Live form behaviour: parts rows follow the "among" boxes and the mode,
// the ₫ line follows the amount, the receipt drop shows the chosen file.
export const syncForm = (form, state) => {
  const mode = $('input[name=mode]:checked', form)?.value || 'equal';
  const amount = Number($('input[name=amount]', form).value) || 0;
  const cur = $('input[name=cur]:checked', form)?.value || 'INR';
  const total = toInr(amount, cur, state);
  form.dataset.mode = mode;
  const among = new Set($$('input[name=among]:checked', form).map((i) => i.value));
  const parts = $('.parts', form);
  if (parts) {
    parts.hidden = mode === 'equal';
    $$('.part', parts).forEach((row) => { row.hidden = !among.has(row.dataset.pid); $('input', row).step = mode === 'exact' ? '1' : '0.5'; });
    const sum = $$('.part:not([hidden]) input', parts).reduce((n, i) => n + (Number(i.value) || 0), 0);
    $('[data-parts-sum]', parts).textContent = mode === 'exact'
      ? `${inr(sum)} of ${inr(total)}${Math.abs(sum - total) > among.size ? ' — does not add up yet' : ''}`
      : `${sum} share${sum === 1 ? '' : 's'} · 1 share = ${inr(sum ? total / sum : 0)}`;
  }
  const rate = $('[data-rate]', form);
  if (rate) rate.textContent = cur === 'VND' && amount ? `≈ ${inr(toInr(amount, 'VND', state))} at ₫${rateOf(state)} per ₹` : `₫ converts at ₫${rateOf(state)} per ₹ (change below the list)`;
  const file = $('input[name=receipt]', form)?.files?.[0];
  if (file) { const drop = $('.spl-drop', form); drop.classList.add('has-file'); $('span', drop).textContent = file.name; }
};
