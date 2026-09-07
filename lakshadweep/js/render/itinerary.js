// Section 02: icon-led day cards derived from the selected strategy's blocks.
// Card shells render once per strategy; the plan list, meals and spend chips
// re-render on every state change (picks move between days).
import { PRICES } from '../data/prices.js';
import { STAYS, STAY_CONF } from '../data/stays.js';
import { EATS } from '../data/eats.js';
import { REACH, PACKAGE_FREE } from '../data/catalogue.js';
import { buildPlan } from '../plan.js';
import { dayTotal, itemCost, fmt } from '../budget.js';
import { html, raw, $, $$, fmtDate } from '../dom.js';
import { icon } from '../icons.js';
import { dayMedia } from './dayMedia.js';

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
      <button type="button" class="day__head" data-daysheet="${day.n}" aria-label="Open day ${day.n}: ${day.place}, ${fmtDate(day.date)}">
        <span class="day__n">${pad}</span>
        <span class="day__where"><span class="day__place">${day.place}</span><time class="day__date" datetime="${day.date}">${fmtDate(day.date)}</time></span>
        <span class="day__mode" title="${day.nav}">${raw(icon(day.icon))}</span>
        <span class="day__open">${raw(icon('grid'))}</span>
      </button>
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
    const m = dayMedia(day, used);
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
