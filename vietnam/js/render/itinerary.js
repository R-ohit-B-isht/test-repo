import { $, $$, html, inr } from '../dom.js';
import { icon } from '../icons.js';
import { DAYS, sleepFor, blockText, mealsFor, whereFor } from '../data/days.js';
import { STOPS, WEATHER, TRIP, inrFromVnd, inrFromUsd } from '../data/trip.js';
import { PRICES } from '../data/prices.js';
import { SOURCES } from '../data/sources.js';
import { findStrategy } from '../strategies.js';
import { PHOTOS } from '../data/photos.js';

// Horizontal photo shelf (Airbnb). One card per day, four rows in the same order
// every time — Do / Eat / Sleep / Around — so the eye learns the card once.
// Transit-dependent lines and the budget toggles swap without rebuilding the shelf.

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

// Price tag on a "Do" line: free, or the listed entry fee, dimmed when the
// matching budget switch is off.
const doPrice = (block, state) => {
  if (!block.price) return '';
  if (block.price === 'free') return html`<span class="tag tag-free">free</span>`;
  const off = block.toggle && !state.activities[block.toggle];
  return html`<span class="tag ${off ? 'tag-off' : ''}" title="${PRICES[block.price].range}">${inr(PRICES[block.price].amount)}${off ? ' · off' : ''}</span>`;
};

const doRow = (block, state, transit) => html`
  <div class="block">
    <span class="when">${block.when}</span>${icon(block.icon)}
    <span class="txt">${blockText(block, transit)} ${doPrice(block, state)}</span>
  </div>`;

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
          <span class="eyebrow">Day ${day.n} · ${dateOf(day.n)} · ${whereFor(day, transit) || stop.name}</span>
          <h3 style="margin-top:6px">${day.title}</h3>
        </div>
        <section class="row-do" aria-label="Do">
          <span class="lbl">Do</span>
          <div class="blocks">${day.blocks.map((b) => doRow(b, state, transit))}</div>
        </section>
        <section class="row-eat" aria-label="Eat">
          <span class="lbl">Eat</span>
          <div class="meals">${mealsFor(day, transit).map(mealRow)}</div>
        </section>
        <section class="row-sleep" aria-label="Sleep">
          <span class="lbl">Sleep</span>
          ${stayRow(sleepFor(day, transit))}
        </section>
        ${day.around.length ? html`
        <section class="row-around" aria-label="Around">
          <span class="lbl">Around</span>
          <div class="around">${day.around.map((a) => html`<span class="chip">${a}</span>`)}</div>
        </section>` : ''}
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
