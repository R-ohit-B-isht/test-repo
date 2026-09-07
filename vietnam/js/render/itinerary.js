import { $, $$, html, inr } from '../dom.js';
import { icon } from '../icons.js';
import { DAYS, sleepFor, blockText } from '../data/days.js';
import { STOPS, WEATHER, TRIP } from '../data/trip.js';
import { PRICES } from '../data/prices.js';
import { findStrategy } from '../strategies.js';
import { PHOTOS } from '../data/photos.js';

// Horizontal photo shelf (Airbnb). One card per day; the transit-dependent
// lines swap when the route changes. Dots + arrows + scroll-snap.

const dateOf = (n) => {
  const d = new Date(`${TRIP.start}T00:00:00`);
  d.setDate(d.getDate() + n - 1);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
};

const spendChips = (day, state) => day.spend
  .filter((s) => state.activities[s.toggle])
  .map((s) => html`<span class="chip chip-jade">${icon('ticket')} ${inr(PRICES[s.key].amount)}</span>`);

const dayCard = (day, state, transit) => {
  const stop = STOPS.find((s) => s.id === day.stop);
  const wx = WEATHER[day.weather];
  const photo = PHOTOS[day.photo];
  return html`
    <article class="card day" data-day="${day.n}" aria-label="Day ${day.n}: ${day.title}">
      <div class="photo">
        <img src="assets/photos/${day.photo}.jpg" alt="${photo.alt}" width="${photo.w}" height="${photo.h}" loading="lazy" decoding="async" />
        <span class="n num" aria-hidden="true">${day.n}</span>
        <span class="wx chip ${wx.icon === 'sun' ? 'chip-sun' : 'chip-rain'}" title="${wx.note}">${icon(wx.icon)} ${wx.temp}</span>
      </div>
      <div class="body">
        <div>
          <span class="eyebrow">Day ${day.n} · ${dateOf(day.n)} · ${stop.name}</span>
          <h3 style="margin-top:6px">${day.title}</h3>
        </div>
        <div class="blocks">
          ${day.blocks.map((b) => html`<div class="block"><span class="when">${b.when}</span>${icon(b.icon)}<span>${blockText(b, transit)}</span></div>`)}
        </div>
        <div class="foot">
          <span class="chip">${icon('bed')} ${sleepFor(day, transit)}</span>
          ${spendChips(day, state)}
        </div>
      </div>
    </article>`;
};

const setCurrent = (n) => {
  $$('.day').forEach((el) => el.classList.toggle('is-current', Number(el.dataset.day) === n));
  $$('#day-dots button').forEach((b) => b.setAttribute('aria-current', Number(b.dataset.day) === n ? 'true' : 'false'));
};

export function mountItinerary() {
  const shelf = $('#shelf');
  $('#day-dots').innerHTML = DAYS.map((d) => html`<button type="button" data-day="${d.n}" aria-label="Day ${d.n}"></button>`).join('');
  const go = (n) => {
    const target = $(`.day[data-day="${n}"]`, shelf);
    if (target) shelf.scrollTo({ left: target.offsetLeft - shelf.offsetLeft, behavior: 'smooth' });
  };
  const current = () => Number($$('.day').find((el) => el.classList.contains('is-current'))?.dataset.day || 1);
  $('#day-dots').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) go(Number(b.dataset.day)); });
  $('#day-prev').addEventListener('click', () => go(Math.max(1, current() - 1)));
  $('#day-next').addEventListener('click', () => go(Math.min(DAYS.length, current() + 1)));

  const io = new IntersectionObserver((entries) => {
    const best = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (best) setCurrent(Number(best.target.dataset.day));
  }, { root: shelf, threshold: [0.6] });
  shelf.addEventListener('rendered', () => $$('.day', shelf).forEach((el) => io.observe(el)));
}

export function renderItinerary(state) {
  const transit = findStrategy(state.strategy).transit;
  const shelf = $('#shelf');
  const scroll = shelf.scrollLeft;
  const cur = Number($$('.day').find((el) => el.classList.contains('is-current'))?.dataset.day || 1);
  shelf.innerHTML = DAYS.map((d) => dayCard(d, state, transit)).join('');
  shelf.scrollLeft = scroll;
  setCurrent(cur);
  shelf.dispatchEvent(new Event('rendered'));
}
