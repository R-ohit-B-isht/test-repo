import { html, inr } from '../../dom.js';
import { icon } from '../../icons.js';
import { fmtDate } from '../../export/dates.js';
import { CATS, MODES, livePeople, nameOf, catOf, sharesOf, toInr, rateOf, clampInr, defaultIso, dayLabel, personOf } from '../../split/model.js';
import { avatar, avatarOf, signed } from './bits.js';
import { typed } from './ledger.js';

// Sheet faces for the Split page: one expense, the add / edit form, a
// settle-up form and the person card. Markup + form readers only.

const closeBtn = html`<button class="btn-icon" type="button" data-close aria-label="Close">×</button>`;

const pick = (state, name, type, checked, size = '') => livePeople(state).map((p) => html`
  <label class="ppick ${size}"><input type="${type}" name="${name}" value="${p.id}" ${checked(p.id) ? 'checked' : ''} /><span>${avatar(p, 'sm')}<b>${nameOf(state, p.id)}</b></span></label>`);

const partRows = (state, x, mode) => livePeople(state).map((p) => html`
  <label class="part" data-pid="${p.id}" ${x.split.parts[p.id] == null ? 'hidden' : ''}>
    ${avatar(p, 'sm')}<span>${nameOf(state, p.id)}</span>
    <input type="number" name="part-${p.id}" inputmode="decimal" min="0" step="${mode === 'exact' ? '1' : '0.5'}" value="${x.split.parts[p.id] ?? (mode === 'shares' ? 1 : '')}" aria-label="${mode === 'exact' ? 'Rupees' : 'Shares'} for ${p.name}" />
  </label>`);

export const expenseForm = (state, own, preset = {}) => {
  const x = own || {
    title: '', iso: preset.iso || defaultIso(), cat: 'food', amount: '', cur: 'INR', by: state.me || livePeople(state)[0]?.id,
    split: { mode: 'equal', parts: Object.fromEntries(livePeople(state).map((p) => [p.id, 1])) }, note: '',
  };
  const mode = x.split.mode;
  return html`
    <form class="sh-form spl-form" id="spl-form" data-id="${own?.id || ''}" data-mode="${mode}">
      <div class="card-head"><span class="eyebrow">${own ? 'Edit expense' : 'New expense'}</span>${closeBtn}</div>
      <label class="fld"><span>What</span><input name="title" required maxlength="60" value="${x.title}" placeholder="Bánh mì, Grab to Ba Na, hostel night…" autocomplete="off" /></label>
      <div class="fld-row spl-amt">
        <label class="fld"><span>How much</span><input name="amount" type="number" inputmode="decimal" min="0" step="any" required value="${x.amount}" placeholder="0" /></label>
        <div class="fld"><span>Currency</span>
          <div class="seg" role="radiogroup" aria-label="Currency">
            <label><input type="radio" name="cur" value="INR" ${x.cur !== 'VND' ? 'checked' : ''} /><span>₹</span></label>
            <label><input type="radio" name="cur" value="VND" ${x.cur === 'VND' ? 'checked' : ''} /><span>₫</span></label>
          </div>
        </div>
      </div>
      <p class="sub spl-rate" data-rate>${x.cur === 'VND' && x.amount ? `≈ ${inr(toInr(x.amount, 'VND', state))} at ₫${rateOf(state)} per ₹` : `₫ converts at ₫${rateOf(state)} per ₹ (change below the list)`}</p>
      <div class="fld-row">
        <label class="fld"><span>When</span><input name="iso" type="date" required value="${x.iso}" /></label>
        ${own ? '' : html`<label class="fld"><span>Repeat</span><select name="nights">${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => html`<option value="${n}">${n === 1 ? 'Once' : `${n} nights, one row each`}</option>`)}</select></label>`}
      </div>
      <div class="fld"><span>Category</span>
        <div class="seg spl-cats-seg" role="radiogroup" aria-label="Category">
          ${CATS.map((c) => html`<label><input type="radio" name="cat" value="${c.id}" ${x.cat === c.id ? 'checked' : ''} /><span>${icon(c.icon)}${c.label}</span></label>`)}
        </div>
      </div>
      <div class="fld"><span>Paid by</span><div class="ppicks" role="radiogroup">${pick(state, 'by', 'radio', (id) => id === x.by)}</div></div>
      <div class="fld"><span>Split among</span><div class="ppicks">${pick(state, 'among', 'checkbox', (id) => id in x.split.parts)}</div></div>
      <div class="fld"><span>How</span>
        <div class="seg" role="radiogroup" aria-label="Split mode">
          ${Object.entries(MODES).map(([k, v]) => html`<label><input type="radio" name="mode" value="${k}" ${mode === k ? 'checked' : ''} /><span>${v}</span></label>`)}
        </div>
      </div>
      <div class="parts" ${mode === 'equal' ? 'hidden' : ''}>${partRows(state, x, mode)}<p class="sub" data-parts-sum></p></div>
      <label class="fld"><span>Note</span><input name="note" maxlength="120" value="${x.note || ''}" placeholder="Optional" /></label>
      <label class="fld spl-receipt"><span>Receipt</span>
        <span class="spl-drop ${x.receipt ? 'has-file' : ''}">${icon(x.receipt ? 'file' : 'upload')}<span>${x.receipt ? x.receipt.name : 'Photo or PDF · stays on this device'}</span><input type="file" name="receipt" accept="application/pdf,image/*" class="sr-only" /></span>
      </label>
      <p class="ms-err" role="alert" hidden></p>
      <div class="sh-actions">
        <button class="btn" type="submit">${icon('check')}${own ? 'Save' : 'Add'}</button>
        <button class="btn btn-ghost" type="button" data-close>Cancel</button>
      </div>
    </form>`;
};

export const settleForm = (state, preset) => html`
  <form class="sh-form spl-form" id="spl-settle" autocomplete="off">
    <div class="card-head"><span class="eyebrow">Record a payment</span>${closeBtn}</div>
    <div class="fld"><span>Who paid</span><div class="ppicks" role="radiogroup">${pick(state, 'by', 'radio', (id) => id === preset.from)}</div></div>
    <div class="fld"><span>To</span><div class="ppicks" role="radiogroup">${pick(state, 'to', 'radio', (id) => id === preset.to)}</div></div>
    <div class="fld-row">
      <label class="fld"><span>Rupees</span><input name="amount" type="number" inputmode="numeric" min="1" step="1" required value="${preset.inr || ''}" /></label>
      <label class="fld"><span>When</span><input name="iso" type="date" required value="${defaultIso()}" /></label>
    </div>
    <p class="ms-err" role="alert" hidden></p>
    <div class="sh-actions">
      <button class="btn" type="submit">${icon('check')}Record</button>
      <button class="btn btn-ghost" type="button" data-close>Cancel</button>
    </div>
  </form>`;

export const expenseFace = (state, x) => {
  const shares = x.kind === 'settle' ? null : sharesOf(x);
  const day = dayLabel(x.iso);
  return html`
    <div class="card-head">
      <span class="row"><span class="evc ev-${x.kind === 'settle' ? 'settle' : x.cat} is-tag">${icon(x.kind === 'settle' ? 'check' : catOf(x.cat).icon)}<span>${x.kind === 'settle' ? 'Payment' : catOf(x.cat).label}</span></span></span>
      ${closeBtn}
    </div>
    <h3 class="h3" id="sheet-title">${x.kind === 'settle' ? `${nameOf(state, x.by)} paid ${x.to === state.me ? 'you' : nameOf(state, x.to)}` : x.title}</h3>
    <p class="sub">${day ? `${day} · ` : ''}${fmtDate(x.iso, { weekday: 'long', day: 'numeric', month: 'long' })}${x.note ? ` · ${x.note}` : ''}</p>
    ${x.series ? html`<p class="sub spl-series">${icon('calendar')}Night ${x.series.n} of ${x.series.of} · same amount each night</p>` : ''}
    <p class="spl-big num">${inr(x.inr)}${typed(x) ? html` <small>${typed(x)}</small>` : ''}</p>
    ${shares ? html`
      <ul class="spl-shares">
        <li class="is-payer">${avatarOf(state, x.by, 'sm')}<span>${nameOf(state, x.by)} paid</span><b class="num">${inr(x.inr)}</b></li>
        ${Object.entries(shares).map(([id, n]) => html`<li>${avatarOf(state, id, 'sm')}<span>${nameOf(state, id)} owes</span><b class="num">${inr(n)}</b></li>`)}
      </ul>` : ''}
    ${x.receipt ? html`<button class="btn btn-ghost" type="button" data-peek="${x.receipt.id}">${icon('eye')}Receipt · ${x.receipt.name}</button>` : ''}
    <div class="sh-actions">
      ${x.kind === 'settle' ? '' : html`<button class="btn" type="button" data-edit="${x.id}">${icon('sparkle')}Edit</button>`}
      <button class="btn btn-ghost" type="button" data-remove="${x.id}">${icon('trash')}Remove</button>
      ${x.series ? html`<button class="btn btn-ghost" type="button" data-remove-series="${x.series.id}">${icon('trash')}All ${x.series.of} nights</button>` : ''}
    </div>`;
};

export const personFace = (state, id, net) => {
  const p = personOf(state, id);
  if (!p) return '';
  const isMe = id === state.me;
  return html`
    <form class="sh-form spl-form" id="spl-person" data-id="${id}" autocomplete="off">
      <div class="card-head"><span class="row">${avatar(p, 'lg')}</span>${closeBtn}</div>
      <h3 class="h3" id="sheet-title">${isMe ? `${p.name} (you)` : p.name}</h3>
      <p class="sub">${signed(net, { lend: 'gets back', owe: 'owes', zero: 'settled' })}</p>
      <label class="fld"><span>Name</span><input name="name" required maxlength="24" value="${p.name}" /></label>
      <div class="sh-actions">
        <button class="btn" type="submit">${icon('check')}Save</button>
        ${isMe ? '' : html`<button class="btn btn-ghost" type="button" data-me="${id}">${icon('users')}This is me</button>`}
        ${isMe ? '' : html`<button class="btn btn-ghost" type="button" data-remove-person="${id}">${icon('trash')}Remove</button>`}
      </div>
    </form>`;
};

// Form → expense fields (no id / timestamps). Returns { data } or { error }.
export function readExpense(form, state) {
  const f = new FormData(form);
  const among = f.getAll('among');
  const mode = f.get('mode') || 'equal';
  const amount = Number(f.get('amount'));
  const cur = f.get('cur') === 'VND' ? 'VND' : 'INR';
  if (!(amount > 0)) return { error: 'Type an amount above zero.' };
  if (!f.get('by')) return { error: 'Who paid?' };
  if (!among.length) return { error: 'Pick at least one person to split among.' };
  const rupees = clampInr(toInr(amount, cur, state));
  if (rupees < 1) return { error: 'That rounds to less than a rupee.' };
  const parts = {};
  among.forEach((id) => { parts[id] = mode === 'equal' ? 1 : Math.max(0, Number(f.get(`part-${id}`)) || 0); });
  const sum = Object.values(parts).reduce((a, b) => a + b, 0);
  if (mode !== 'equal' && sum <= 0) return { error: mode === 'exact' ? 'Exact amounts add up to zero.' : 'Give someone at least one share.' };
  if (mode === 'exact' && Math.abs(sum - rupees) > Math.max(1, among.length)) return { error: `Exact amounts add to ${inr(sum)}, not ${inr(rupees)}.` };
  const nights = Math.min(8, Math.max(1, Math.round(Number(f.get('nights')) || 1)));
  return { nights, data: { kind: 'spend', title: String(f.get('title')).trim().slice(0, 60), iso: f.get('iso'), cat: catOf(f.get('cat')).id, amount, cur, inr: rupees, by: f.get('by'), split: { mode, parts }, note: String(f.get('note') || '').trim().slice(0, 120) } };
}

export function readSettle(form) {
  const f = new FormData(form);
  const rupees = clampInr(f.get('amount'));
  if (!f.get('by') || !f.get('to')) return { error: 'Pick both people.' };
  if (f.get('by') === f.get('to')) return { error: 'Paying yourself does not count.' };
  if (rupees < 1) return { error: 'Type an amount above zero.' };
  return { data: { kind: 'settle', title: 'Settle up', iso: f.get('iso'), cat: 'other', amount: rupees, cur: 'INR', inr: rupees, by: f.get('by'), to: f.get('to'), split: { mode: 'equal', parts: {} }, note: '' } };
}
