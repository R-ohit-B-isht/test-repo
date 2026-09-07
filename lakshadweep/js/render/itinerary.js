// Section 02: icon-led day cards derived from the selected strategy's blocks.
import { PRICES } from '../data/prices.js';
import { PHOTOS } from '../data/photos.js';
import { buildPlan } from '../plan.js';
import { dayTotal, itemCost, fmt } from '../budget.js';
import { html, raw, $, $$, fmtDate } from '../dom.js';
import { icon } from '../icons.js';

const short = (key) => PRICES[key].short;

function figure(id) {
  if (!id) return '';
  const p = PHOTOS[id];
  return html`<img class="day__photo" src="${p.src}" alt="${p.alt}" width="960" height="640" loading="lazy" decoding="async">`;
}

const ACTIVITY_ICON = { snorkel: 'snorkel', kayak: 'kayak', bangaram: 'boat', scuba: 'dive', glassBottom: 'glass' };

function spendChips(day, state) {
  const chips = day.spend.map((item) => {
    const cost = itemCost(item, state);
    if (item.optional && !state.activities[item.optional]) {
      return html`<li class="dc dc--off">${raw(icon(ACTIVITY_ICON[item.optional]))}<span>+ ${short(item.key)}</span></li>`;
    }
    if (cost <= 0) return '';
    return html`<li class="dc">${item.optional ? raw(icon(ACTIVITY_ICON[item.optional])) : ''}<span>${short(item.key)}</span><b>${fmt(cost)}</b></li>`;
  });
  return chips.join('') || html`<li class="dc dc--none">Included in the cruise fare</li>`;
}

function dayCard(day) {
  const pad = String(day.n).padStart(2, '0');
  return html`
    <li class="day reveal" id="day-${day.n}" data-day="${day.n}" data-mode="${day.icon}" style="--stagger:${(day.n % 3) * 40}ms">
      <header class="day__head">
        <span class="day__n">${pad}</span>
        <span class="day__where"><span class="day__place">${day.place}</span><time class="day__date" datetime="${day.date}">${fmtDate(day.date)}</time></span>
        <span class="day__mode" title="${day.nav}">${raw(icon(day.icon))}</span>
      </header>
      ${raw(figure(day.photo))}
      <h3 class="day__title">${day.title}</h3>
      <ol class="day__plan">${raw(day.plan.map((p) => html`<li>${p}</li>`).join(''))}</ol>
      <footer class="day__foot">
        <span class="day__sleep">${raw(icon(day.sleepIcon))}<span>${day.sleep}</span></span>
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
  for (const day of plan.days) {
    const el = $(`#day-${day.n}`);
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
