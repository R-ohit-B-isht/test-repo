import { $, html, inr } from '../dom.js';
import { icon } from '../icons.js';
import { TRIP, WEATHER } from '../data/trip.js';
import { computeBudget } from '../budget.js';

// Hero: photo + title overlay (Tripadvisor), calculator card as the hero object (Wise).

export function renderHeroStatic() {
  $('#hero-bg').innerHTML = html`<img src="assets/photos/hoian.jpg" alt="Silk lanterns glowing over a street in Hoi An at night" width="1024" height="682" fetchpriority="high" />`;
  $('#hero-copy').innerHTML = html`
    <span class="eyebrow">01 · Late October · Delhi return</span>
    <h1 id="hero-title" style="margin-top:16px">${TRIP.title}</h1>
    <p class="hero-sub">${TRIP.subtitle}</p>
    <div class="hero-weather">
      ${Object.values(WEATHER).map((w) => html`<span class="chip ${w.icon === 'sun' ? 'chip-sun' : 'chip-rain'}">${icon(w.icon)} ${w.label} ${w.temp} · ${w.rain}</span>`)}
    </div>`;
}

const step = (dir) => html`<button class="btn-icon" type="button" data-step="${dir}" aria-label="${dir > 0 ? 'Add a traveller' : 'Remove a traveller'}">${dir > 0 ? '+' : '−'}</button>`;

export function renderHero(state) {
  const b = computeBudget(state);
  const flights = b.lines[0].amount;
  const usPct = Math.min(100, Math.round((flights / TRIP.quotedRoundTrip) * 100));
  $('#calc').innerHTML = html`
    <span class="eyebrow">Per person · all in</span>
    <div class="total num" style="margin-top:8px">${inr(b.total)}<small>${b.strategy.name}</small></div>
    <div class="calc-row">
      <span class="muted small">Travellers</span>
      <div class="stepper" role="group" aria-label="Travellers">
        ${step(-1)}<output class="num" aria-live="off">${state.travellers}</output>${step(1)}
      </div>
    </div>
    <div class="quote">
      <div class="legend"><span>Your ₹40k quote</span><b class="num">Flights here: ${inr(flights)}</b></div>
      <div class="bar" role="img" aria-label="Flights cost ${usPct}% of the ₹40,000 quote"><span class="them"></span><span class="us" style="width:${usPct}%"></span></div>
      <div class="legend"><span></span><span class="num">Saves ${inr(b.vsQuote)} on airfare</span></div>
    </div>
    <a class="btn" href="#route">${icon('arrow')} Pick a route</a>`;
}

export function mountHero(store) {
  renderHeroStatic();
  $('#calc').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-step]');
    if (!btn) return;
    const n = Math.min(4, Math.max(1, store.get().travellers + Number(btn.dataset.step)));
    store.set({ travellers: n });
  });
}
