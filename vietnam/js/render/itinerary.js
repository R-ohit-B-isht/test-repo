import { $, $$, html, inr } from '../dom.js';
import { icon } from '../icons.js';
import { DAYS, SLOTS, SLOT_LABEL, sleepFor, mealsFor, whereFor } from '../data/days.js';
import { STOPS, WEATHER, TRIP, inrFromVnd, inrFromUsd } from '../data/trip.js';
import { SOURCES } from '../data/sources.js';
import { findStrategy } from '../strategies.js';
import { PHOTOS } from '../data/photos.js';
import { planTrip } from '../plan.js';
import { priceTag, pickChip, includesText } from './picks.js';

// Horizontal photo shelf (Airbnb). One card per day, four rows in the same order
// every time — Do / Eat / Sleep / Nearby — so the eye learns the card once.
// "Do" is AM / PM / Night: fixed transit lines plus whatever plan.js packed in;
// "Nearby" is everything else at that day's stops, tap to add.

const NEARBY_SHOWN = 6;

const dateOf = (n) => {
  const d = new Date(`${TRIP.start}T00:00:00`);
  d.setDate(d.getDate() + n - 1);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
};

const MEAL = ['B', 'L', 'D'];

const srcLink = (key, label) => {
  const s = key && SOURCES[key];
  return s ? html`<a class="src" href="${s.url}" target="_blank" rel="noopener" title="${s.name}">${label} ${icon('link')}</a>` : '';
};

const pickRow = (x, travellers) => html`
  <div class="pk ${x.cont ? 'is-cont' : ''}">
    ${icon(x.icon)}
    <span class="txt">${x.name}${x.cont ? '' : priceTag(x, travellers)}${!x.cont && x.includes ? html`<span class="sub">${includesText(x)}</span>` : ''}</span>
    ${x.cont ? '' : html`<button class="x" type="button" data-pick="${x.id}" aria-label="Take ${x.name} off">${icon('x')}</button>`}
  </div>`;

const slotRow = (key, slot, travellers) => {
  if (slot.fixed) return html`
    <div class="block">
      <span class="when">${SLOT_LABEL[key]}</span>${icon(slot.icon)}
      <span class="txt">${slot.text}</span>
    </div>`;
  return html`
    <div class="block">
      <span class="when">${SLOT_LABEL[key]}</span>
      <span class="picks">
        ${slot.lead ? html`<span class="lead">${slot.lead}</span>` : ''}
        ${slot.items.length ? slot.items.map((x) => pickRow(x, travellers)) : html`<span class="open">open · tap a nearby pick</span>`}
      </span>
    </div>`;
};

const nearbyRow = (near, tips, travellers) => {
  const shown = near.slice(0, NEARBY_SHOWN);
  const more = near.length - shown.length;
  return html`
    <div class="around">
      ${shown.map(({ x, status }) => pickChip(x, status, travellers))}
      ${more > 0 ? html`<button class="chip pick more" type="button" data-more="${near[NEARBY_SHOWN].x.stop}">+${more} more</button>` : ''}
      ${tips.map((t) => html`<span class="chip tip">${t}</span>`)}
    </div>`;
};

const mealRow = (m, i) => html`
  <div class="meal">
    <span class="m">${MEAL[i]}</span>
    <span class="txt"><b>${m.name}</b><span class="sub">${m.dish}</span></span>
    <span class="amt num">${m.vnd ? html`≈${inr(inrFromVnd(m.vnd))}` : m.src ? 'incl.' : '—'}${srcLink(m.src, '')}</span>
  </div>`;

const stayRow = (s) => html`
  <div class="stay">
    ${icon('bed')}
    <span class="txt"><b>${s.name}</b><span class="sub">${s.area}</span></span>
    <span class="amt num">${s.usd ? html`≈${inr(inrFromUsd(s.usd))}` : ''}${srcLink(s.src, '')}</span>
  </div>`;

const dayCard = (day, state, transit, plan) => {
  const stop = STOPS.find((s) => s.id === day.stop);
  const wx = WEATHER[day.weather];
  const photo = PHOTOS[day.photo];
  const planned = plan.days[day.n - 1];
  const near = plan.nearby[day.n - 1];
  return html`
    <article class="card day" data-day="${day.n}" aria-label="Day ${day.n}: ${day.title}">
      <div class="photo">
        <img src="assets/photos/${day.photo}.jpg" alt="${photo.alt}" width="${photo.w}" height="${photo.h}" loading="lazy" decoding="async" />
        <span class="n num" aria-hidden="true">${day.n}</span>
        <span class="wx chip ${wx.icon === 'sun' ? 'chip-sun' : 'chip-rain'}" title="${wx.note}">${icon(wx.icon)} ${wx.temp}</span>
      </div>
      <div class="body">
        <div>
          <span class="eyebrow">Day ${day.n} · ${dateOf(day.n)} · ${whereFor(day, transit) || stop.name}</span>
          <h3 style="margin-top:6px">${day.title}</h3>
        </div>
        <section class="row-do" aria-label="Do">
          <span class="lbl">Do</span>
          <div class="blocks">${SLOTS.map((k) => slotRow(k, planned.slots[k], state.travellers))}</div>
        </section>
        <section class="row-eat" aria-label="Eat">
          <span class="lbl">Eat</span>
          <div class="meals">${mealsFor(day, transit).map(mealRow)}</div>
        </section>
        <section class="row-sleep" aria-label="Sleep">
          <span class="lbl">Sleep</span>
          ${stayRow(sleepFor(day, transit))}
        </section>
        <section class="row-around" aria-label="Nearby">
          <span class="lbl">Nearby</span>
          ${nearbyRow(near, day.tips, state.travellers)}
        </section>
      </div>
    </article>`;
};

const setCurrent = (n) => {
  $$('.day').forEach((el) => el.classList.toggle('is-current', Number(el.dataset.day) === n));
  $$('#day-dots button').forEach((b) => b.setAttribute('aria-current', Number(b.dataset.day) === n ? 'true' : 'false'));
  document.dispatchEvent(new CustomEvent('day:current', { detail: n }));
};

export function mountItinerary(store) {
  const shelf = $('#shelf');
  $('#day-dots').innerHTML = DAYS.map((d) => html`<button type="button" data-day="${d.n}" aria-label="Day ${d.n}"></button>`).join('');
  let pending = null;
  const go = (n) => {
    const target = $(`.day[data-day="${n}"]`, shelf);
    if (!target) return;
    pending = n;
    shelf.scrollTo({ left: target.offsetLeft - shelf.offsetLeft, behavior: 'smooth' });
  };
  const current = () => Number($$('.day').find((el) => el.classList.contains('is-current'))?.dataset.day || 1);
  $('#day-dots').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) go(Number(b.dataset.day)); });
  $('#day-prev').addEventListener('click', () => go(Math.max(1, current() - 1)));
  $('#day-next').addEventListener('click', () => go(Math.min(DAYS.length, current() + 1)));
  document.addEventListener('day:go', (e) => {
    $('#days').scrollIntoView({ behavior: 'smooth', block: 'start' });
    go(e.detail);
  });
  shelf.addEventListener('click', (e) => {
    const pick = e.target.closest('[data-pick]');
    if (pick) { store.togglePick(pick.dataset.pick); return; }
    const more = e.target.closest('[data-more]');
    if (more) document.dispatchEvent(new CustomEvent('picker:show', { detail: more.dataset.more }));
  });

  const io = new IntersectionObserver((entries) => {
    if (pending !== null) {
      const r = $(`.day[data-day="${pending}"]`, shelf).getBoundingClientRect(); const s = shelf.getBoundingClientRect();
      if (r.left >= s.left - 8 && r.right <= s.right + 8) { setCurrent(pending); pending = null; return; }
    }
    const best = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio || a.target.dataset.day - b.target.dataset.day)[0];
    if (best) setCurrent(Number(best.target.dataset.day));
  }, { root: shelf, threshold: [0.6] });
  shelf.addEventListener('rendered', () => $$('.day', shelf).forEach((el) => io.observe(el)));
}

export function renderItinerary(state) {
  const transit = findStrategy(state.strategy).transit;
  const plan = planTrip(state, transit);
  const shelf = $('#shelf');
  const scroll = shelf.scrollLeft;
  const cur = Number($$('.day').find((el) => el.classList.contains('is-current'))?.dataset.day || 1);
  shelf.innerHTML = DAYS.map((d) => dayCard(d, state, transit, plan)).join('');
  shelf.scrollLeft = scroll;
  setCurrent(cur);
  shelf.dispatchEvent(new Event('rendered'));
}
