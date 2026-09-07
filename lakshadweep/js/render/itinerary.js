import { DAYS } from '../data/days.js';
import { PRICES } from '../data/prices.js';
import { dayTotal, itemCost, fmt } from '../budget.js';
import { html, raw, $, $$, fmtDate } from '../dom.js';

function spendBreakdown(day, state) {
  return day.spend
    .map((item) => ({ item, cost: itemCost(item, state) }))
    .filter(({ cost }) => cost > 0)
    .map(({ item, cost }) => `${PRICES[item.key].label.split(',')[0]} ${fmt(cost)}`)
    .join(' · ');
}

function dayEntry(day) {
  return html`
    <li class="day reveal" id="day-${day.n}" data-day="${day.n}" style="--stagger:${(day.n % 3) * 40}ms">
      <div class="day__meta">
        <span class="day__n">Day ${String(day.n).padStart(2, '0')}</span>
        <span class="day__date">${fmtDate(day.date)}</span>
        <span class="tag">${day.island}</span>
      </div>
      <div class="day__body">
        <h3 class="day__title">${day.title}</h3>
        <p class="day__moves">${day.moves}</p>
        <ul class="day__plan">${raw(day.plan.map((p) => html`<li>${p}</li>`).join(''))}</ul>
        <dl class="day__foot">
          <div><dt>Sleep</dt><dd>${day.sleep}</dd></div>
          <div><dt>Spend today</dt><dd><span data-day-total></span><small data-day-breakdown></small></dd></div>
        </dl>
      </div>
    </li>`;
}

export function mountItinerary() {
  $('#day-nav').innerHTML = DAYS.map((d) => html`
    <li><a href="#day-${d.n}" data-day-link="${d.n}"><strong>${String(d.n).padStart(2, '0')}</strong><span>${d.nav || d.island.split(' → ').pop()}</span></a></li>`).join('');
  $('#day-list').innerHTML = DAYS.map(dayEntry).join('');
  watchActiveDay();
}

export function renderItinerary(state) {
  for (const day of DAYS) {
    const el = $(`#day-${day.n}`);
    $('[data-day-total]', el).textContent = fmt(dayTotal(day, state));
    $('[data-day-breakdown]', el).textContent = spendBreakdown(day, state);
  }
}

function watchActiveDay() {
  const links = $$('[data-day-link]');
  const setActive = (n) => links.forEach((a) => a.classList.toggle('is-active', a.dataset.dayLink === String(n)));
  const io = new IntersectionObserver((entries) => {
    const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (hit) setActive(hit.target.dataset.day);
  }, { rootMargin: '-30% 0px -50% 0px', threshold: [0, 0.25, 0.5] });
  $$('.day').forEach((d) => io.observe(d));
}

export function stepDay(delta) {
  const active = $('.daynav .is-active') || $('[data-day-link]');
  const n = Math.min(DAYS.length, Math.max(1, Number(active.dataset.dayLink) + delta));
  $(`#day-${n}`).scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}
