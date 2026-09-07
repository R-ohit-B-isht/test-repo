// Section 02: horizontal photo shelf, one card per day. Shells render once per
// strategy; picks, meals and spend patch on every state change. Dots and the
// prev/next arrows scroll the shelf; the active dot follows scroll position.
import { PRICES } from '../data/prices.js';
import { STAYS, STAY_CONF } from '../data/stays.js';
import { EATS } from '../data/eats.js';
import { REACH, PACKAGE_FREE, isExtra, extraTag } from '../data/catalogue.js';
import { buildPlan } from '../plan.js';
import { dayTotal, itemCost, fmt } from '../budget.js';
import { html, raw, $, $$, fmtDate } from '../dom.js';
import { icon } from '../icons.js';
import { dayMedia } from './dayMedia.js';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function pickTag(item, day) {
  if (day.pkg && item.key && PACKAGE_FREE.has(item.key)) return 'in package';
  if (item.reach !== 'base') return REACH[item.reach].label;
  return item.key ? '' : 'free';
}

function planList(day) {
  const fixed = day.fixed.map((f) => html`<li class="dp">${raw(icon(f.ic))}<span>${f.t}</span></li>`);
  const picks = day.picks.filter((p) => !isExtra(p)).map((p) => html`<li class="dp dp--pick">${raw(icon(p.icon))}<span>${p.name}</span><small>${pickTag(p, day)}</small></li>`);
  const extras = day.picks.filter(isExtra).map((p) => html`<li class="dp dp--extra">${raw(icon(p.icon))}<span>${p.name}</span><small>${extraTag(p)}</small></li>`);
  return [...fixed, ...picks, ...extras].join('');
}

const MEAL_IC = { b: 'sun', l: 'meal', d: 'moon' };
function meals(day) {
  return ['b', 'l', 'd'].map((slot) => {
    const e = EATS[day.meals[slot]];
    return html`<li class="dm ${e.incl ? 'dm--incl' : ''}" title="${e.sub}">${raw(icon(MEAL_IC[slot]))}<span>${e.name}</span></li>`;
  }).join('');
}

function spendChips(day, state) {
  const chips = day.items.map((item) => {
    const p = PRICES[item.key];
    if (p.status === 'unavailable') return html`<li class="dc dc--off"><span>${p.short}</span><b>quote</b></li>`;
    const cost = itemCost(item, state);
    if (cost <= 0) return '';
    const label = item.qty > 1 ? `${item.qty} × ${p.short}` : p.short;
    return html`<li class="dc ${item.pick ? 'dc--pick' : ''}"><span>${label}</span><b>${fmt(cost)}</b></li>`;
  });
  return chips.join('') || html`<li class="dc dc--none">All in the package</li>`;
}

function dayCard(day) {
  const stay = STAYS[day.stay];
  return html`
    <li class="day card" id="day-${day.n}" data-day="${day.n}" data-mode="${day.icon}">
      <div class="day__media" data-day-media></div>
      <button type="button" class="day__head" data-daysheet="${day.n}" aria-label="Open day ${day.n}: ${day.place}, ${fmtDate(day.date)}">
        <span class="day__n">Day ${day.n}</span>
        <span class="day__where"><span class="day__place">${day.place}</span><time class="day__date" datetime="${day.date}">${fmtDate(day.date)}</time></span>
        <span class="day__mode" title="${day.nav}">${raw(icon(day.icon))}</span>
      </button>
      <h3 class="day__title">${day.title}</h3>
      <ol class="day__plan" data-day-plan></ol>
      <ul class="day__meals" aria-label="Meals" data-day-meals></ul>
      <footer class="day__foot">
        <span class="day__sleep" title="${STAY_CONF[stay.conf]}">${raw(icon(stay.icon))}<span>${stay.name}<small>${stay.sub}</small></span></span>
        <details class="day__spend fold"><summary>${raw(icon('right'))}<span>Spend</span><b data-day-total></b></summary><ul class="day__chips" data-day-chips></ul></details>
      </footer>
    </li>`;
}

let key = '';
let current = 1;

function setActive(n) {
  current = Number(n);
  $$('[data-day-link]').forEach((a) => a.classList.toggle('is-active', a.dataset.dayLink === String(current)));
  $$('.day').forEach((d) => d.classList.toggle('is-current', d.dataset.day === String(current)));
}

function goTo(n) {
  const list = $('#day-list');
  const el = $(`#day-${n}`);
  if (!el) return;
  setActive(n);
  list.scrollTo({ left: el.offsetLeft - parseFloat(getComputedStyle(list).paddingLeft), behavior: reduced() ? 'auto' : 'smooth' });
}

export function stepDay(delta) {
  const total = $$('.day').length;
  goTo(Math.min(total, Math.max(1, current + delta)));
}

export function mountItinerary() {
  const list = $('#day-list');
  let raf = 0;
  list.addEventListener('scroll', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const x = list.scrollLeft + list.clientWidth / 2;
      const hit = $$('.day', list).find((d) => d.offsetLeft + d.offsetWidth > x);
      if (hit && hit.dataset.day !== String(current)) setActive(hit.dataset.day);
    });
  }, { passive: true });
  $('#day-nav').addEventListener('click', (e) => {
    const a = e.target.closest('[data-day-link]');
    if (!a) return;
    e.preventDefault();
    goTo(a.dataset.dayLink);
  });
  $$('[data-shelf]').forEach((b) => b.addEventListener('click', () => stepDay(Number(b.dataset.shelf))));
}

export function renderItinerary(state) {
  const plan = buildPlan(state);
  if (key !== state.strategy) {
    key = state.strategy;
    $('#days-count').textContent = String(plan.length);
    $('#day-nav').innerHTML = plan.days.map((d) => html`
      <li><a href="#day-${d.n}" data-day-link="${d.n}" aria-label="Day ${d.n}: ${d.nav}" title="Day ${d.n}: ${d.nav}"></a></li>`).join('');
    $('#day-list').innerHTML = plan.days.map(dayCard).join('');
    setActive(Math.min(current, plan.length));
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
