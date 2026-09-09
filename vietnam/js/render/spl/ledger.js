import { html, inr, vnd } from '../../dom.js';
import { icon } from '../../icons.js';
import { fmtDate } from '../../export/dates.js';
import { catOf, dayLabel, nameOf, myLine, sharesOf } from '../../split/model.js';
import { byDate } from '../../split/math.js';
import { avatarOf, signed, empty } from './bits.js';

// The ledger: every expense and payment, grouped by date (trip days named),
// newest first. Each row is a button that opens its sheet.

export const typed = (x) => (x.cur === 'VND' ? vnd(x.amount) : '');

const who = (state, x) => {
  if (x.kind === 'settle') return html`${nameOf(state, x.by)} paid ${x.to === state.me ? 'you' : nameOf(state, x.to)} <b class="num">${inr(x.inr)}</b>`;
  const n = Object.keys(sharesOf(x)).length;
  return html`${nameOf(state, x.by)} paid <b class="num">${inr(x.inr)}</b> · ${n === 1 ? 'one person' : `${n} ways`}`;
};

const mine = (state, x) => {
  if (!state.me) return html`<span class="xamt"><b class="num">${inr(x.inr)}</b>${typed(x) ? html`<small class="num">${typed(x)}</small>` : ''}</span>`;
  if (x.kind === 'settle') return x.by === state.me ? signed(x.inr, { lend: 'you paid' }) : x.to === state.me ? signed(-x.inr, { owe: 'you got' }) : signed(0, { zero: 'not you' });
  const involved = x.by === state.me || state.me in x.split.parts;
  return involved ? signed(myLine(state, x), { lend: 'you lent', owe: 'you owe' }) : signed(0, { zero: 'not you' });
};

const row = (state, x) => html`
  <li>
    <button class="xrow ${x.kind === 'settle' ? 'is-settle' : ''}" type="button" data-x="${x.id}">
      <span class="xic ev-${x.kind === 'settle' ? 'settle' : x.cat}">${icon(x.kind === 'settle' ? 'check' : catOf(x.cat).icon)}</span>
      <span class="xtxt">
        <b>${x.kind === 'settle' ? 'Settle up' : x.title}</b>
        <small>${avatarOf(state, x.by, 'xs')}${who(state, x)}${x.receipt ? icon('file') : ''}</small>
      </span>
      ${mine(state, x)}
    </button>
  </li>`;

const group = (state, g) => {
  const total = g.rows.filter((x) => x.kind === 'spend').reduce((n, x) => n + x.inr, 0);
  const day = dayLabel(g.iso);
  return html`
    <section class="xday" aria-label="${fmtDate(g.iso)}">
      <header class="xday-h">
        <span>${day ? html`<b>${day}</b> · ` : ''}${fmtDate(g.iso, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
        ${total ? html`<span class="num">${inr(total)}</span>` : ''}
      </header>
      <ul class="xlist">${g.rows.map((x) => row(state, x))}</ul>
    </section>`;
};

export const ledger = (state, filter) => {
  let groups = byDate(state);
  if (filter === 'mine' && state.me) groups = groups.map((g) => ({ ...g, rows: g.rows.filter((x) => x.by === state.me || x.to === state.me || (x.split && state.me in x.split.parts)) })).filter((g) => g.rows.length);
  if (!groups.length) {
    return empty(
      filter === 'mine' ? 'Nothing with you in it.' : 'Nothing logged yet.',
      filter === 'mine' ? 'Rows you paid or share show here.' : 'First bánh mì is on someone. Log it and the maths is done.',
      html`<button class="btn" type="button" data-new>${icon('plus')}Add an expense</button>`,
    );
  }
  return html`${groups.map((g) => group(state, g))}`;
};
