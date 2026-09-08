import { html, inr } from '../../dom.js';
import { icon } from '../../icons.js';
import { livePeople, liveExpenses, nameOf } from '../../split/model.js';
import { balances, settleUp } from '../../split/math.js';
import { avatarOf, signed } from './bits.js';

// Balances card: where each person stands, then the shortest list of
// payments that clears everything, each with a one-tap "Record" button.

const row = (state, p, n) => html`
  <li class="bal-row ${p.id === state.me ? 'is-me' : ''}">
    ${avatarOf(state, p.id)}
    <span class="bal-name">${nameOf(state, p.id)}</span>
    ${signed(n, { lend: 'gets back', owe: 'owes', zero: 'settled' })}
  </li>`;

const transfer = (state, t, i) => html`
  <li class="bal-pay">
    <span class="bal-pair">${avatarOf(state, t.from, 'sm')}<b>${nameOf(state, t.from)}</b>${icon('arrow')}${avatarOf(state, t.to, 'sm')}<b>${nameOf(state, t.to)}</b></span>
    <span class="num bal-amt">${inr(t.inr)}</span>
    <button class="btn btn-ghost" type="button" data-settle="${i}" data-from="${t.from}" data-to="${t.to}" data-inr="${t.inr}">${icon('check')}Record</button>
  </li>`;

export const balanceCard = (state) => {
  const people = livePeople(state);
  if (people.length < 2 || !liveExpenses(state).length) return '';
  const net = balances(state);
  const pays = settleUp(net);
  return html`
    <article class="card spl-bal" id="spl-bal">
      <header class="spl-sum-head"><span class="eyebrow">Balances</span>${pays.length ? html`<small class="sub">${pays.length} payment${pays.length > 1 ? 's' : ''} clears it</small>` : html`<small class="sub chip chip-jade">${icon('check')}all settled</small>`}</header>
      <ul class="bal-list">${people.map((p) => row(state, p, net[p.id] || 0))}</ul>
      ${pays.length ? html`<ul class="bal-pays" aria-label="Settle up">${pays.map((t, i) => transfer(state, t, i))}</ul>` : ''}
    </article>`;
};
