import { html, inr } from '../../dom.js';
import { icon } from '../../icons.js';
import { CATS, livePeople, liveExpenses, me } from '../../split/model.js';
import { balances, totals } from '../../split/math.js';
import { SPLIT_MAX_PEOPLE } from '../../config.js';
import { avatar } from './bits.js';

// Split page header: who you are, your one number, the people strip and the
// spend-vs-plan summary. Markup only; render/split.js wires the events.

export const onboarding = () => html`
  <form class="spl-me card" id="spl-me" autocomplete="off">
    <span class="spl-me-ic">${icon('users')}</span>
    <div>
      <h3>First, who are you?</h3>
      <p class="sub">Your name stays in this browser, so every "you paid" below is really you.</p>
    </div>
    <div class="spl-me-row">
      <input type="text" name="name" placeholder="Your name" required maxlength="24" aria-label="Your name" autocomplete="given-name" />
      <button class="btn" type="submit">${icon('check')}That's me</button>
    </div>
  </form>`;

const headline = (state, net) => {
  const mine = state.me ? net[state.me] || 0 : 0;
  if (!liveExpenses(state).length) return { line: 'Nothing logged yet.', cls: '' };
  if (mine > 0) return { line: html`You get back <b>${inr(mine)}</b>`, cls: 'is-up' };
  if (mine < 0) return { line: html`You owe <b>${inr(-mine)}</b>`, cls: 'is-down' };
  return { line: 'You are all square.', cls: 'is-even' };
};

export const head = (state) => {
  const t = totals(state);
  const net = balances(state);
  const { line, cls } = headline(state, net);
  const you = me(state);
  return html`
    ${you ? avatar(you, 'lg') : ''}
    <div class="spl-headtxt">
      <p class="spl-line ${cls}">${line}</p>
      <p class="sub">${icon('wallet')}${inr(t.total)} spent · ${t.count} row${t.count === 1 ? '' : 's'} · ${icon('shield')}saved in this browser, never in a share link</p>
    </div>`;
};

export const people = (state) => {
  const list = livePeople(state);
  return html`
    ${list.map((p) => html`
      <button class="pchip ${p.id === state.me ? 'is-me' : ''}" type="button" data-person="${p.id}" aria-label="${p.name}${p.id === state.me ? ', you' : ''}">
        ${avatar(p)}<span>${p.id === state.me ? 'You' : p.name}</span>
      </button>`)}
    ${list.length < SPLIT_MAX_PEOPLE ? html`
      <form class="pchip pchip-add" id="spl-add-person" autocomplete="off">
        ${icon('plus')}<input type="text" name="name" placeholder="Add a friend" maxlength="24" aria-label="Friend's name" required />
        <button class="sr-only" type="submit">Add</button>
      </form>` : ''}`;
};

const bar = (n, max, cls = '') => html`<span class="spl-bar ${cls}"><i style="width: ${max ? Math.min(100, (100 * n) / max) : 0}%"></i></span>`;

export const summary = (state, planned) => {
  const t = totals(state);
  if (!t.count) return '';
  const mine = state.me ? { paid: t.paid[state.me] || 0, share: t.share[state.me] || 0 } : null;
  const cats = CATS.map((c) => ({ ...c, n: t.byCat[c.id] || 0 })).filter((c) => c.n).sort((a, b) => b.n - a.n);
  const top = cats[0]?.n || 1;
  return html`
    <article class="card spl-sum">
      <header class="spl-sum-head">
        <span class="eyebrow">Group spend</span>
        <b class="num">${inr(t.total)}</b>
        ${planned ? html`<small class="sub">of ${inr(planned)} planned · ${Math.round((100 * t.total) / planned)}%</small>` : ''}
      </header>
      ${planned ? bar(t.total, planned, t.total > planned ? 'is-over' : '') : ''}
      ${mine ? html`
        <dl class="spl-you">
          <div><dt>You paid</dt><dd class="num">${inr(mine.paid)}</dd></div>
          <div><dt>Your share</dt><dd class="num">${inr(mine.share)}</dd></div>
          <div><dt>Per head</dt><dd class="num">${inr(t.total / Math.max(1, livePeople(state).length))}</dd></div>
        </dl>` : ''}
      <ul class="spl-cats" aria-label="By category">
        ${cats.map((c) => html`<li><span class="spl-cat-ic">${icon(c.icon)}</span><span class="spl-cat-name">${c.label}</span>${bar(c.n, top)}<b class="num">${inr(c.n)}</b></li>`)}
      </ul>
    </article>`;
};
