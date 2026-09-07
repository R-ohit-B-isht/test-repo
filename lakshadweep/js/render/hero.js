// Hero: one big number (essentials, per person), like-for-like transport
// comparison against the ₹40k quote, four stat chips, and the route map.
import { TRIP } from '../data/trip.js';
import { computeBudget, fmt, fmtK } from '../budget.js';
import { html, raw, $, fmtRange } from '../dom.js';
import { icon } from '../icons.js';
import { routeMap } from './map.js';

const SHORT = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });
const stat = (ic, value, label) => html`<div class="stat"><dt>${raw(icon(ic))}<span>${label}</span></dt><dd>${value}</dd></div>`;

let mapKey = '';

export function renderHero(state) {
  const b = computeBudget(state);
  const { plan } = b;
  const quote = TRIP.quotedRoundTrip;
  const saving = quote - b.transport;
  const pct = Math.min(100, Math.round((b.transport / quote) * 100));

  $('#hero-window').textContent = fmtRange(plan.start, plan.end);
  $('#hero-total').textContent = fmt(b.essentials);
  $('#hero-sub').textContent = `per person · ${plan.length} days · beds, meals, permit and every ticket`;

  $('#hero-vs').innerHTML = html`
    <div class="vs__row vs__row--quote"><span class="vs__lbl">Delhi ⇄ Agatti, one ticket</span><span class="vs__bar"><i style="width:100%"></i></span><span class="vs__n">${fmt(quote)}</span></div>
    <div class="vs__row vs__row--ours"><span class="vs__lbl">${plan.strategy.name}, ${plan.legs.length} legs</span><span class="vs__bar"><i style="width:${pct}%"></i></span><span class="vs__n">${fmt(b.transport)}</span></div>
    <p class="vs__verdict">${saving > 0 ? raw(html`<strong>${fmtK(saving)}</strong> less to get there and back, Delhi to the atolls and home.`) : raw(html`<strong>${fmtK(-saving)}</strong> more than the ticket, but cabin, meals and three islands are inside that number.`)}</p>`;

  $('#hero-stats').innerHTML = [
    stat('sun', `${plan.islandNights}`, 'island nights'),
    stat('moon', `${plan.seaNights}`, 'nights at sea'),
    stat('clock', `${Math.round(plan.travelHours)} h`, 'in motion'),
    stat('permit', SHORT.format(new Date(`${plan.permitDue}T00:00:00`)), 'permit by'),
  ].join('');

  const key = `${state.strategy}:${state.shipClass}:${state.trainClass}:${JSON.stringify(state.picks)}`;
  if (key !== mapKey) {
    mapKey = key;
    $('#hero-map').innerHTML = routeMap(plan) + html`<figcaption class="hero__cap">To scale · D1, D2… mark where each day is spent · ${plan.strategy.blurb}</figcaption>`;
  }
  $('#status-dates').textContent = `${fmtRange(plan.start, plan.end)} · ${state.travellers} pax`;
}
