import { $, html } from '../dom.js';
import { icon } from '../icons.js';
import { TRIP } from '../data/trip.js';
import { PAGES } from '../pages.js';
import { stepLinks } from '../book.js';
import { today } from '../clock.js';
import { serve, dueOf, isOverdue, tripDay } from '../ritual.js';
import { linkChips } from './links.js';

// Countdown ritual card (Duolingo streak + Ahead's "come back tomorrow").
// Lives on Days and Book. One task, one tick, seven dots; T-1 with nothing
// left is the peak: the lantern lights.

const fmt = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

const goChip = (href) => {
  const page = PAGES.find((p) => p.href === href);
  if (page) return html`<a href="${href}">${page.label}${icon('arrow')}</a>`;
  const host = new URL(href).hostname.replace(/^www\./, '').split('.')[0];
  return html`<a href="${href}" target="_blank" rel="noopener noreferrer">${host}${icon('link')}</a>`;
};

const links = (t, state) => {
  if (t.step) return linkChips(stepLinks(t.src, state));
  return t.href ? [goChip(t.href)] : [];
};

const row = (t, state, left) => {
  const late = isOverdue(t, left);
  const l = links(t, state);
  return html`
    <div class="ritual-task ${late ? 'is-late' : ''}">
      <span class="ic-wrap">${icon(t.icon)}</span>
      <div class="txt">
        <b>${t.title}</b>
        <span>${t.hint}</span>
        ${l.length ? html`<div class="links">${l}</div>` : ''}
      </div>
      <div class="side">
        <span class="when">${late ? 'overdue' : `by ${fmt(dueOf(t))}`}</span>
        <button class="tick" type="button" data-ritual="${t.id}" data-step="${t.step ? '1' : '0'}" aria-label="Done: ${t.title}">
          <span class="box">${icon('check')}</span>
        </button>
      </div>
    </div>`;
};

const ready = (eve) => html`
  <div class="ritual-ready">
    <div class="lantern-glow">${icon('lantern')}</div>
    <h3>${eve ? 'Ready. Sleep.' : 'Ready.'}</h3>
    <p>Every task done. Xin chào, Việt Nam.</p>
  </div>`;

const restToday = (s) => html`
  <div class="ritual-rest">
    <span class="ic-wrap is-done">${icon('check')}</span>
    <div class="txt">
      <b>Done for today</b>
      <span>Back tomorrow${s.next ? html` · next: ${s.next.title}` : ''}</span>
    </div>
  </div>`;

const more = (s, state) => (s.overdue.length ? html`
  <details class="ritual-more">
    <summary>${s.overdue.length} more overdue</summary>
    ${s.overdue.map((t) => row(t, state, s.left))}
  </details>` : '');

const dots = (s) => html`
  <div class="ritual-week" role="img" aria-label="${s.streak} day streak">
    ${s.week.map((d) => html`<span class="${d.hit ? 'is-hit' : ''} ${d.isToday ? 'is-today' : ''}"><i></i>${d.letter}</span>`)}
  </div>
  <span class="ritual-streak">${icon('sparkle')} ${s.streak ? `${s.streak} day streak` : 'Start a streak'}</span>`;

const count = (s) => {
  if (s.phase === 'trip') return ['You\'re there', `Day ${tripDay(s.left)}`, `of ${TRIP.days}`];
  if (s.phase === 'after') return ['Home', `${TRIP.days}/${TRIP.days}`, `${s.doneCount} tasks · best streak ${s.best}`];
  if (s.phase === 'eve') return ['Tomorrow', 'T-1', 'Day 1 is tomorrow'];
  return [s.phase === 'far' ? 'Early bird' : 'One tiny thing a day', `T-${s.left}`, `days to Hoi An · ${s.doneCount}/${s.total} done`];
};

const body = (s, state) => {
  if (s.phase === 'trip') {
    return html`
      <div class="ritual-rest">
        <span class="ic-wrap">${icon('grid')}</span>
        <div class="txt"><b>Today's board</b><span>What's next, where to eat, how to get there.</span></div>
        <button class="btn btn-quiet" type="button" data-peek="${tripDay(s.left)}">${icon('arrow')} Open Day ${tripDay(s.left)}</button>
      </div>`;
  }
  if (s.phase === 'after') return html`<div class="ritual-rest"><span class="ic-wrap is-done">${icon('lantern')}</span><div class="txt"><b>Eight days done.</b><span>The Split page still knows who owes who.</span></div></div>`;
  if (!s.next) return ready(s.phase === 'eve');
  if (s.ticked) return html`${restToday(s)}${more(s, state)}`;
  return html`${row(s.next, state, s.left)}${more(s, state)}`;
};

export function renderRitual(state) {
  const host = $('#ritual');
  if (!host) return;
  const s = serve(state);
  const [eyebrow, big, sub] = count(s);
  const peak = !s.next && s.phase !== 'trip' && s.phase !== 'after';
  host.innerHTML = html`
    <div class="card ritual is-${s.phase} ${peak ? 'is-ready' : ''} ${s.ticked ? 'is-ticked' : ''}">
      <div class="ritual-count">
        <span class="eyebrow">${eyebrow}</span>
        <b class="num">${big}</b>
        <span class="sub">${sub}</span>
      </div>
      <div class="ritual-body">${body(s, state)}</div>
      ${s.phase === 'trip' || s.phase === 'after' ? '' : html`<div class="ritual-foot">${dots(s)}</div>`}
    </div>`;
}

export function mountRitual(store) {
  const host = $('#ritual');
  if (!host) return;
  host.addEventListener('click', (e) => {
    const tick = e.target.closest('[data-ritual]');
    if (tick) { store.tickRitual(tick.dataset.ritual, tick.dataset.step === '1', today()); return; }
    const peek = e.target.closest('[data-peek]');
    if (peek) document.dispatchEvent(new CustomEvent('day:open', { detail: Number(peek.dataset.peek) }));
  });
}
