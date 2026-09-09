import { html } from '../../dom.js';
import { icon } from '../../icons.js';
import { livePeople } from '../../split/model.js';
import { avatar } from '../spl/bits.js';
import { brainCta } from '../brain.js';
import { RULES, TIERS, INR_PER_PT, scorePrompt } from '../../score.js';

// Markup only. Controller: render/score.js. Model: score.js.
// Shape borrowed from league tables (Duolingo: ranked rows, a promotion line,
// one number per row) and fantasy matchups (Sleeper: tap a score, see how it
// was earned). Everything is drawn from tokens already in use on Split.

const inr = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const pts = (n) => html`<b class="num">${n}</b><small>pts</small>`;

// ── Hero: the plan's score, its tier, the road to the next one ────────────
export const hero = (score, ups) => {
  const { pts: total, tier, next, fun, best } = score;
  const floor = tier.min;
  const span = next ? next.min - floor : 1;
  const pct = next ? Math.round(((total - floor) / span) * 100) : 100;
  return html`
    <article class="card sc-hero">
      <div class="sc-hero-main">
        <span class="eyebrow">${icon('star')}Trip score</span>
        <p class="sc-big"><b class="num">${total}</b><span>pts</span></p>
        <p class="sc-tier"><span class="chip chip-tier is-${tier.id}">${tier.label}</span><span class="sub">${tier.note}</span></p>
      </div>
      <div class="sc-hero-side">
        <div class="sc-meter" role="img" aria-label="${next ? `${total} of ${next.min} points to ${next.label}` : 'Top tier reached'}">
          <span class="sc-meter-fill" style="--w: ${pct}%"></span>
        </div>
        <p class="sub sc-next">${next ? html`<b class="num">${next.min - total}</b> to <b>${next.label}</b>` : html`${icon('check')}Top tier · nothing above Legend`}</p>
        <p class="sub"><b class="num">${fun}</b> fun picks packed · best day <a href="calendar.html#d${best.n}" data-open-day="${best.n}">Day ${best.n}</a> · <b class="num">${best.pts}</b> pts</p>
        <div class="row sc-hero-cta">
          ${ups.length ? brainCta(scorePrompt(score, ups), 'Lift it with Gemini') : ''}
          <button class="btn" type="button" data-sc-share>${icon('share')}Share the board</button>
        </div>
      </div>
    </article>`;
};

// ── Days: one bar per day, click opens the day board ─────────────────────
export const daysStrip = (score) => {
  const max = Math.max(1, ...score.days.map((d) => d.pts));
  return html`
    <section class="card sc-days" aria-labelledby="sc-days-h">
      <h2 class="eyebrow" id="sc-days-h">${icon('grid')}Points per day</h2>
      <ol class="sc-bars">
        ${score.days.map((d) => html`
          <li class="${d.n === score.best.n ? 'is-best' : ''} ${d.pts ? '' : 'is-empty'}">
            <button type="button" data-open-day="${d.n}" aria-label="Day ${d.n} · ${d.title} · ${d.pts} points">
              <span class="sc-bar"><span style="--h: ${Math.round((d.pts / max) * 100)}%"></span></span>
              <b class="num">${d.pts}</b>
              <span class="num">${d.n}</span>
            </button>
          </li>`)}
      </ol>
    </section>`;
};

// ── Standings: the league table ──────────────────────────────────────────
const medal = (rank) => (rank <= 3 ? html`<span class="sc-rank is-${rank}">${rank}</span>` : html`<span class="sc-rank num">${rank}</span>`);

const breakdown = (r) => html`
  <div class="sc-break">
    <div>
      <span class="eyebrow">${icon('heart')}Planned · ${r.cols.planned}</span>
      ${r.planned.length ? html`<ul>${r.planned.map((q) => html`<li><span>${q.x.name}</span><b class="num">+${q.pts}</b></li>`)}</ul>` : html`<p class="sub">Hearts on picks that made the plan count here.</p>`}
    </div>
    <div>
      <span class="eyebrow">${icon('wallet')}Paid · ${r.cols.paid}</span>
      <p class="sub">${r.fronted ? html`Fronted <b class="num">${inr(r.fronted)}</b> for the group · 1 pt per ${inr(INR_PER_PT)}` : 'Nothing fronted yet — Split rows you paid for others count here.'}</p>
    </div>
    <div>
      <span class="eyebrow">${icon('check')}Showed · ${r.cols.showed}</span>
      ${r.showed.length ? html`<ul>${r.showed.map((q) => html`<li><span>${q.x.name}</span><b class="num">+${q.pts}</b></li>`)}</ul>` : html`<p class="sub">Tick "was there" on the match sheet below.</p>`}
    </div>
  </div>`;

const standingRow = (state, r) => html`
  <details class="sc-row ${r.p.id === state.me ? 'is-me' : ''} ${r.rank === 1 && r.total > 0 ? 'is-lead' : ''}" data-key="p:${r.p.id}">
    <summary>
      ${medal(r.rank)}
      ${avatar(r.p)}
      <span class="sc-name">${r.p.id === state.me ? 'You' : r.p.name}${r.p.id === state.me && r.p.name ? html`<small>${r.p.name}</small>` : ''}</span>
      <span class="sc-col num" title="Planned">${r.cols.planned}</span>
      <span class="sc-col num" title="Paid">${r.cols.paid}</span>
      <span class="sc-col num" title="Showed">${r.cols.showed}</span>
      <span class="sc-total">${pts(r.total)}</span>
      ${icon('chevron', 'sc-chev')}
    </summary>
    ${breakdown(r)}
  </details>`;

export const table = (state, st) => {
  const people = livePeople(state);
  if (!people.length) {
    return html`
      <section class="card sc-table" aria-labelledby="sc-lb-h">
        <h2 class="eyebrow" id="sc-lb-h">${icon('users')}Leaderboard</h2>
        <div class="sc-empty">
          <span class="ic-wrap">${icon('users')}</span>
          <h3>No one on the board yet.</h3>
          <p class="sub">Say who you are, add friends on Split, heart picks — the table fills itself.</p>
          <div class="row"><button class="btn btn-primary" type="button" data-who>${icon('plus')}Say who you are</button><a class="btn btn-ghost" href="split.html">${icon('wallet')}Add friends on Split</a></div>
        </div>
      </section>`;
  }
  return html`
    <section class="card sc-table" aria-labelledby="sc-lb-h">
      <div class="sc-table-head">
        <h2 class="eyebrow" id="sc-lb-h">${icon('users')}Leaderboard · ${people.length}</h2>
        ${st.leader ? html`<span class="sub">${icon('star')}${st.leader.p.id === state.me ? 'You lead' : `${st.leader.p.name} leads`}</span>` : html`<span class="sub">No points yet — heart, pay, show up.</span>`}
      </div>
      <div class="sc-cols" aria-hidden="true"><span></span><span></span><span>Planned</span><span>Paid</span><span>Showed</span><span>Total</span></div>
      <div class="sc-rows">
        ${st.rows.map((r, i) => html`${i === st.split && st.split ? html`<div class="sc-line"><span>top of the table</span></div>` : ''}${standingRow(state, r)}`)}
      </div>
      ${!state.me ? html`<p class="sub sc-note"><button class="link" type="button" data-who>Say who you are</button> to mark your own row.</p>` : ''}
    </section>`;
};

// ── Match sheet: who showed at what ──────────────────────────────────────
const whoRow = (state, people, r) => html`
  <span class="sc-who" role="group" aria-label="Who was there">
    ${people.map((p) => html`<button class="sc-tick ${r.who.includes(p.id) ? 'is-on' : ''}" type="button" data-showed="${r.x.id}" data-pid="${p.id}" aria-pressed="${r.who.includes(p.id) ? 'true' : 'false'}" aria-label="${p.id === state.me ? 'You' : p.name} · ${r.x.name}${r.who.includes(p.id) ? ' · was there' : ''}">${avatar(p, 'sm')}</button>`)}
  </span>`;

export const sheet = (state, days) => {
  const people = livePeople(state);
  const live = days.filter((d) => d.items.length);
  return html`
    <section class="card sc-sheet" aria-labelledby="sc-sheet-h">
      <div class="sc-table-head">
        <h2 class="eyebrow" id="sc-sheet-h">${icon('check')}Match sheet</h2>
        <span class="sub">Tap a face once you've been. Points land on Showed.</span>
      </div>
      ${people.length ? '' : html`<p class="sub sc-note">Add people first — <button class="link" type="button" data-who>say who you are</button>.</p>`}
      ${live.map((d) => html`
        <div class="sc-day">
          <h3><span class="num">Day ${d.n}</span><span>${d.title}</span><b class="num">${d.pts} pts</b></h3>
          <ul>
            ${d.items.map((r) => html`
              <li class="${r.who.length ? 'is-lived' : ''}">
                <span class="ic-wrap">${icon(r.x.icon || 'ticket')}</span>
                <span class="sc-item"><b>${r.x.name}</b><small>${r.rule.label} · +${r.pts}</small></span>
                ${people.length ? whoRow(state, people, r) : ''}
              </li>`)}
          </ul>
        </div>`)}
    </section>`;
};

// ── House rules ──────────────────────────────────────────────────────────
export const rules = () => html`
  <details class="card sc-rules" data-key="rules">
    <summary><span class="eyebrow">${icon('info')}House rules</span>${icon('chevron', 'sc-chev')}</summary>
    <div class="sc-rules-grid">
      <ul>${RULES.map((r) => html`<li><span>${r.label}</span><b class="num">+${r.pts}</b></li>`)}<li><span>Fronted for the group</span><b class="num">+1 / ${inr(INR_PER_PT)}</b></li></ul>
      <ul>${TIERS.map((t) => html`<li><span class="chip chip-tier is-${t.id}">${t.label}</span><b class="num">${t.min}+</b></li>`)}</ul>
    </div>
    <p class="sub">Points are ours, not sourced: a way to compare plans and a reason to show up. Prices and hours still come from Sources.</p>
  </details>`;
