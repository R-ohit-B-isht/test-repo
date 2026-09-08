import { $, html } from '../dom.js';
import { icon } from '../icons.js';
import { computeBudget } from '../budget.js';
import { livePeople, liveExpenses, personOf, rateOf } from '../split/model.js';
import { buildCSV, CSV_NAME } from '../split/csv.js';
import { onboarding, head, people, summary } from './spl/head.js';
import { balanceCard } from './spl/balances.js';
import { ledger } from './spl/ledger.js';
import { openSheet, closeSheet, refreshSheet, syncForm } from './spl/sheet.js';
import { saveExpense, saveSettle, removeExpense, removePerson, savePerson, addPerson, claimMe } from './spl/actions.js';
import { openPeek, mountPeek } from './mgr/peek.js';

// Split page controller: maps DOM events on the page and the sheet to actions,
// then paints every region from state. Typing happens inside the sheet, which
// is not repainted while a form is open, so inputs never lose focus.

let store = null;
let filter = 'all';
let csvUrl = null;

const tools = (state) => html`
  <article class="card spl-tools">
    <label class="fld"><span>₫ per ₹</span><input type="number" name="rate" inputmode="numeric" min="1" step="1" value="${state.rate > 0 ? state.rate : ''}" placeholder="${rateOf(state)}" aria-describedby="spl-rate-hint" /></label>
    <p class="sub" id="spl-rate-hint">Blank uses the sourced mid-market rate. Cards and ATMs give a few % less.</p>
    <div class="row">
      <a class="btn btn-ghost" id="spl-csv" href="#" download="${CSV_NAME}" ${liveExpenses(state).length ? '' : 'aria-disabled="true"'}>${icon('download')}CSV</a>
      <a class="btn btn-ghost" href="calendar.html">${icon('calendar')}On the calendar</a>
    </div>
  </article>`;

const filterBar = (state, hasMe) => html`
  <div class="seg" role="radiogroup" aria-label="Show">
    <label><input type="radio" name="filter" value="all" ${filter === 'all' ? 'checked' : ''} /><span>Everyone</span></label>
    <label><input type="radio" name="filter" value="mine" ${filter === 'mine' ? 'checked' : ''} ${hasMe ? '' : 'disabled'} /><span>Mine</span></label>
  </div>
  <button class="btn" type="button" data-new ${livePeople(state).length ? '' : 'disabled'}>${icon('plus')}Add expense</button>`;

const onSubmit = (e) => {
  e.preventDefault();
  const form = e.target;
  const name = new FormData(form).get('name');
  if (form.id === 'spl-me') { const id = addPerson(store, name, true); if (id) claimMe(store, id); return; }
  if (form.id === 'spl-add-person') { if (addPerson(store, name, false)) form.reset(); return; }
  if (form.id === 'spl-form') { saveExpense(store, form); return; }
  if (form.id === 'spl-settle') { saveSettle(store, form); return; }
  if (form.id === 'spl-person') savePerson(store, form);
};

const onClick = (e) => {
  const t = e.target;
  const sheet = $('#sheet');
  const state = store.get();
  const hit = (sel) => t.closest(sel);
  if (sheet.contains(t) && (t === sheet || hit('[data-close]'))) return closeSheet();
  if (hit('[data-new]')) return openSheet(state, { mode: 'form', id: null, preset: {} });
  if (hit('[data-x]')) return openSheet(state, { mode: 'x', id: hit('[data-x]').dataset.x });
  if (hit('[data-edit]')) return openSheet(state, { mode: 'form', id: hit('[data-edit]').dataset.edit });
  if (hit('[data-remove]')) return removeExpense(store, hit('[data-remove]').dataset.remove);
  if (hit('[data-settle]')) { const d = hit('[data-settle]').dataset; return openSheet(state, { mode: 'settle', id: null, preset: { from: d.from, to: d.to, inr: Number(d.inr) } }); }
  if (hit('[data-person]')) return openSheet(state, { mode: 'person', id: hit('[data-person]').dataset.person });
  if (hit('[data-me]')) { const id = hit('[data-me]').dataset.me; claimMe(store, id); return openSheet(store.get(), { mode: 'person', id }); }
  if (hit('[data-remove-person]')) return removePerson(store, hit('[data-remove-person]').dataset.removePerson);
  if (hit('[data-peek]')) { const meta = state.expenses.find((r) => r.receipt?.id === hit('[data-peek]').dataset.peek)?.receipt; return meta && openPeek(meta); }
  if (hit('#spl-csv[aria-disabled="true"]')) e.preventDefault();
  return undefined;
};

const onChange = (e) => {
  const t = e.target;
  if (t.name === 'filter') { filter = t.value; renderSplit(store.get()); return; }
  if (t.name === 'rate') { const n = Math.round(Number(t.value)); store.set({ rate: n > 0 ? n : 0 }); return; }
  const form = t.closest('#spl-form');
  if (form) syncForm(form, store.get());
};

export function mountSplit(s) {
  store = s;
  const root = $('#split');
  if (!root) return;
  mountPeek();
  const sheet = $('#sheet');
  [root, sheet, $('#spl-fab')].forEach((el) => {
    el.addEventListener('submit', onSubmit);
    el.addEventListener('click', onClick);
    el.addEventListener('change', onChange);
  });
  sheet.addEventListener('input', (e) => { const form = e.target.closest('#spl-form'); if (form && e.target.type === 'number') syncForm(form, store.get()); });
  sheet.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });
  root.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.name === 'rate') e.target.blur(); });
}

export function renderSplit(state) {
  const root = $('#split');
  if (!root) return;
  const you = personOf(state, state.me);
  const hasMe = !!(you && !you.deleted);
  $('#spl-me-wrap').innerHTML = hasMe ? '' : onboarding();
  $('#spl-head').innerHTML = hasMe ? head(state) : '';
  $('#spl-people').innerHTML = people(state);
  $('#spl-filter').innerHTML = filterBar(state, hasMe);
  $('#spl-ledger').innerHTML = ledger(state, filter);
  $('#spl-sum').innerHTML = summary(state, computeBudget(state).group);
  $('#spl-bal').innerHTML = balanceCard(state);
  $('#spl-tools').innerHTML = tools(state);
  const gone = state.expenses.filter((x) => x.deleted).length;
  $('#spl-bin').textContent = gone ? `${gone} removed row${gone > 1 ? 's' : ''} kept for undo.` : '';
  $('#spl-fab').hidden = !livePeople(state).length;
  if (csvUrl) URL.revokeObjectURL(csvUrl);
  csvUrl = URL.createObjectURL(new Blob([buildCSV(state)], { type: 'text/csv;charset=utf-8' }));
  $('#spl-csv').href = csvUrl;
  refreshSheet(state);
}
