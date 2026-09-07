// Section 02: icon-led day cards derived from the selected strategy's blocks.
// Card shells render once per strategy; the plan list, meals and spend chips
// re-render on every state change (picks move between days).
import { PRICES } from '../data/prices.js';
import { PHOTOS, ITEM_PHOTOS, itemPhotos, photoSize } from '../data/photos.js';
import { STAYS, STAY_CONF } from '../data/stays.js';
import { EATS } from '../data/eats.js';
import { CATALOGUE, REACH, PACKAGE_FREE } from '../data/catalogue.js';
import { buildPlan } from '../plan.js';
import { dayTotal, itemCost, fmt } from '../budget.js';
import { html, raw, $, $$, fmtDate } from '../dom.js';
import { icon } from '../icons.js';

const img = (p, cls) => html`<img class="${cls}" src="${p.src}" alt="${p.alt}" width="${photoSize(p).w}" height="${photoSize(p).h}" loading="lazy" decoding="async">`;

// First photo of an item not already shown on an earlier card, so consecutive
// days on the same island don't repeat one shot. Falls back to the first.
function fresh(photos, used) {
  const i = Math.max(0, photos.findIndex((p) => !used.has(p.id)));
  used.add(photos[i].id);
  return i;
}

const lead = (s, i) => html`
    <button type="button" class="day__lead" data-gallery="${s.item.id}" data-gallery-i="${i}" aria-label="${s.photos.length} photos of ${s.item.name}">
      ${raw(img(s.photos[i], 'day__photo'))}
      <span class="day__lead-tag">${raw(icon('camera'))}${s.photos.length}</span>
    </button>`;

// A day's fallback photo that belongs to a catalogue item (e.g. the Kavaratti
// palm) opens that item's gallery; pure transit shots stay plain.
function fallback(day, used) {
  if (!day.photo) return '';
  const id = Object.keys(ITEM_PHOTOS).find((k) => ITEM_PHOTOS[k].includes(day.photo));
  const item = id && CATALOGUE.find((c) => c.id === id);
  if (!item) { used.add(day.photo); return img(PHOTOS[day.photo], 'day__photo'); }
  const s = { item, photos: itemPhotos(id) };
  return lead(s, fresh(s.photos, used));
}

// Photo-first: the day's picks that have exact photos lead (tap → lightbox);
// transit-only days fall back to the strategy's generic photo.
function media(day, used) {
  const shot = day.picks.map((p) => ({ item: p, photos: itemPhotos(p.id) })).filter((s) => s.photos.length);
  if (!shot.length) return fallback(day, used);
  const [first, ...rest] = shot;
  const li = fresh(first.photos, used);
  const strip = rest.slice(0, 3).map((s) => {
    const i = fresh(s.photos, used);
    return html`
    <button type="button" class="day__thumb" data-gallery="${s.item.id}" data-gallery-i="${i}" aria-label="${s.photos.length} photos of ${s.item.name}">${raw(img(s.photos[i], ''))}</button>`;
  });
  return lead(first, li) + (strip.length ? html`<span class="day__strip">${raw(strip.join(''))}</span>` : '');
}

function pickTag(item, day) {
  if (day.pkg && item.key && PACKAGE_FREE.has(item.key)) return 'in package';
  if (item.reach !== 'base') return REACH[item.reach].label;
  return item.key ? '' : 'free';
}

function planList(day) {
  const fixed = day.fixed.map((f) => html`<li class="dp">${raw(icon(f.ic))}<span>${f.t}</span></li>`);
  const picks = day.picks.map((p) => html`<li class="dp dp--pick">${raw(icon(p.icon))}<span>${p.name}</span><small>${pickTag(p, day)}</small></li>`);
  return [...fixed, ...picks].join('');
}

function meals(day) {
  return ['b', 'l', 'd'].map((slot) => {
    const e = EATS[day.meals[slot]];
    return html`<li class="dm ${e.incl ? 'dm--incl' : ''}" title="${e.sub}"><b>${slot.toUpperCase()}</b><span>${e.name}</span></li>`;
  }).join('');
}

function spendChips(day, state) {
  const chips = day.items.map((item) => {
    const p = PRICES[item.key];
    if (p.status === 'unavailable') return html`<li class="dc dc--off">${raw(icon('rupee'))}<span>${p.short}: quote</span></li>`;
    const cost = itemCost(item, state);
    if (cost <= 0) return '';
    const label = item.qty > 1 ? `${item.qty} × ${p.short}` : p.short;
    return html`<li class="dc ${item.pick ? 'dc--pick' : ''}"><span>${label}</span><b>${fmt(cost)}</b></li>`;
  });
  return chips.join('') || html`<li class="dc dc--none">All in the package</li>`;
}

function dayCard(day) {
  const pad = String(day.n).padStart(2, '0');
  const stay = STAYS[day.stay];
  return html`
    <li class="day reveal" id="day-${day.n}" data-day="${day.n}" data-mode="${day.icon}" style="--stagger:${(day.n % 3) * 40}ms">
      <header class="day__head">
        <span class="day__n">${pad}</span>
        <span class="day__where"><span class="day__place">${day.place}</span><time class="day__date" datetime="${day.date}">${fmtDate(day.date)}</time></span>
        <span class="day__mode" title="${day.nav}">${raw(icon(day.icon))}</span>
      </header>
      <div class="day__media" data-day-media></div>
      <h3 class="day__title">${day.title}</h3>
      <ol class="day__plan" data-day-plan></ol>
      <ul class="day__meals" aria-label="Meals" data-day-meals></ul>
      <footer class="day__foot">
        <span class="day__sleep" title="${STAY_CONF[stay.conf]}">${raw(icon(stay.icon))}<span>${stay.name}<small>${stay.sub}</small></span></span>
        <details class="day__spend"><summary><span>Spend</span><b data-day-total></b></summary><ul class="day__chips" data-day-chips></ul></details>
      </footer>
    </li>`;
}

let key = '';
let io = null;
let hold = 0;

export function renderItinerary(state) {
  const plan = buildPlan(state);
  if (key !== state.strategy) {
    key = state.strategy;
    $('#days-count').textContent = String(plan.length);
    $('#day-nav').innerHTML = plan.days.map((d) => html`
      <li><a href="#day-${d.n}" data-day-link="${d.n}" title="Day ${d.n}: ${d.nav}">${raw(icon(d.icon))}<strong>${String(d.n).padStart(2, '0')}</strong><span>${d.nav}</span></a></li>`).join('');
    $('#day-list').innerHTML = plan.days.map(dayCard).join('');
    watchActiveDay();
  }
  const used = new Set();
  for (const day of plan.days) {
    const el = $(`#day-${day.n}`);
    const m = media(day, used);
    if (el.dataset.media !== m) { el.dataset.media = m; $('[data-day-media]', el).innerHTML = m; }
    $('[data-day-plan]', el).innerHTML = planList(day);
    $('[data-day-meals]', el).innerHTML = meals(day);
    $('[data-day-total]', el).textContent = fmt(dayTotal(day, state));
    $('[data-day-chips]', el).innerHTML = spendChips(day, state);
  }
}

function watchActiveDay() {
  if (io) io.disconnect();
  const links = $$('[data-day-link]');
  const setActive = (n) => links.forEach((a) => a.classList.toggle('is-active', a.dataset.dayLink === String(n)));
  io = new IntersectionObserver((entries) => {
    if (Date.now() < hold) return;
    const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (hit) {
      setActive(hit.target.dataset.day);
      $$('.day.is-current').forEach((d) => d.classList.remove('is-current'));
    }
  }, { rootMargin: '-30% 0px -50% 0px', threshold: [0, 0.25, 0.5] });
  $$('.day').forEach((d) => io.observe(d));
  $$('.day.reveal').forEach((d) => d.classList.add('is-in'));
}

export function stepDay(delta) {
  const links = $$('[data-day-link]');
  const active = $('.daynav .is-active') || links[0];
  const n = Math.min(links.length, Math.max(1, Number(active.dataset.dayLink) + delta));
  links.forEach((a) => a.classList.toggle('is-active', a.dataset.dayLink === String(n)));
  $$('.day').forEach((d) => d.classList.toggle('is-current', d.dataset.day === String(n)));
  hold = Date.now() + 900;
  $(`#day-${n}`).scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
}
