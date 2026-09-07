import { TRIP } from '../data/trip.js';
import { computeBudget, fmt } from '../budget.js';
import { html, $, fmtRange } from '../dom.js';
import { animateNumber } from '../chrome/counter.js';

export function renderHeroStatic() {
  $('#hero-window').textContent = `fares observed ${TRIP.observedWindow}`;
  $('#route-window').textContent = TRIP.observedWindow;
  $('#status-dates').textContent = fmtRange(TRIP.start, TRIP.end);
  $('#booking-start').textContent = fmtRange(TRIP.start, TRIP.end);
}

let prev = null;

function animateStats(root, values) {
  root.querySelectorAll('dd[data-count]').forEach((dd, i) => {
    dd.dataset.prev = String(prev ? prev[i] : values[i]);
    animateNumber(dd, values[i], fmt);
  });
}

export function renderHero(state) {
  const b = computeBudget(state);
  const saving = TRIP.quotedRoundTrip - b.transport;
  const gap = b.perPerson - TRIP.quotedRoundTrip;
  $('#hero-vs').textContent = gap <= 0
    ? `at ${fmt(b.perPerson)} a head — ${fmt(-gap)} under the ${fmt(TRIP.quotedRoundTrip)} you were quoted just to get there`
    : `at ${fmt(b.perPerson)} a head — ${fmt(gap)} more than the ${fmt(TRIP.quotedRoundTrip)} you were quoted just to get there`;

  $('#hero-stats').innerHTML = html`
    <div><dt>Dates</dt><dd>${fmtRange(TRIP.start, TRIP.end)}<small>Tue → Thu, post-monsoon</small></dd></div>
    <div><dt>Islands</dt><dd>${TRIP.islands.length}<small>${TRIP.islands.join(' · ')}</small></dd></div>
    <div><dt>Delhi ⇄ islands</dt><dd data-count="${b.transport}">${fmt(b.transport)}<small>${b.strategy.name}</small></dd></div>
    <div><dt>Whole trip, per person</dt><dd data-count="${b.perPerson}">${fmt(b.perPerson)}<small>${state.travellers} travelling · everything below</small></dd></div>
    <div><dt>vs. the ${fmt(TRIP.quotedRoundTrip)} quote</dt><dd class="is-good" data-count="${saving}">${fmt(saving)}<small>saved on transport alone</small></dd></div>
  `;

  const values = [b.transport, b.perPerson, saving];
  animateStats($('#hero-stats'), values);
  prev = values;
}
