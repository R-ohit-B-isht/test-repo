// Hero: at-a-glance chips over the island photo, and the calculator card:
// per-person all-in total, traveller stepper, the ₹40k like-for-like bar and
// the selected route. Shell renders once; values patch in place so the
// stepper keeps focus. All numbers come from computeBudget(state).
import { TRIP } from '../data/trip.js';
import { computeBudget, fmt, fmtK } from '../budget.js';
import { html, raw, $, fmtRange } from '../dom.js';
import { icon } from '../icons.js';
import { animateNumber } from '../chrome/counter.js';

const SHORT = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });
const chip = (ic, text) => html`<span class="chip">${raw(icon(ic))}${text}</span>`;
const quote = TRIP.quotedRoundTrip;

const shell = () => html`
    <span class="eyebrow">All-in, per person</span>
    <div class="calc-total"><span class="num" data-hero-total></span><small data-hero-sub></small></div>
    <div class="calc-row">
      <span>Travellers <small class="muted" data-hero-group></small></span>
      <span class="stepper" role="group" aria-label="Travellers">
        <button type="button" class="btn-icon" data-step="-1" aria-label="Fewer travellers">−</button>
        <output aria-live="polite" data-hero-n></output>
        <button type="button" class="btn-icon" data-step="1" aria-label="More travellers">+</button>
      </span>
    </div>
    <div class="calc-vs">
      <div class="calc-row"><span>Getting there &amp; back</span><strong data-hero-transport></strong></div>
      <div class="bar" role="img" data-hero-bar><i></i><b></b></div>
      <div class="calc-row"><span>Delhi ⇄ Agatti, one ticket</span><span>${fmt(quote)}</span></div>
      <p class="calc-verdict" data-hero-verdict></p>
    </div>
    <div class="calc-route">${raw(icon('pin'))}<span data-hero-route></span><span class="mode-chips" data-hero-modes></span></div>
    <a class="btn" href="#route">Pick a route ${raw(icon('right'))}</a>`;

export function mountHero(store) {
  const calc = $('#calc');
  calc.innerHTML = shell();
  calc.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-step]');
    if (!btn) return;
    store.set((s) => ({ travellers: Math.min(6, Math.max(1, s.travellers + Number(btn.dataset.step))) }));
  });
}

function verdict(transport) {
  const saving = quote - transport;
  return saving < 0
    ? html`<strong class="is-over">${fmtK(-saving)} over</strong> the ticket, but cabin, meals and the islands are in that number.`
    : html`<strong>${fmtK(saving)} under</strong> the flight you were quoted, door to door.`;
}

let prev = null;

export function renderHero(state) {
  const b = computeBudget(state);
  const { plan } = b;
  $('#hero-window').textContent = fmtRange(plan.start, plan.end);
  $('#hero-chips').innerHTML = [
    chip('clock', `${plan.length} days`),
    chip('sun', `${plan.islandNights} island nights`),
    chip('moon', `${plan.seaNights} at sea`),
    chip('permit', `permit by ${SHORT.format(new Date(`${plan.permitDue}T00:00:00`))}`),
  ].join('');

  const calc = $('#calc');
  const total = $('[data-hero-total]', calc);
  if (!total.firstChild) total.textContent = fmt(b.perPerson);
  total.dataset.prev = String(prev ?? b.perPerson);
  animateNumber(total, b.perPerson, fmt);
  prev = b.perPerson;
  $('[data-hero-sub]', calc).textContent = `${plan.length} days · beds, meals, permit, every ticket`;
  $('[data-hero-group]', calc).textContent = `· ${fmt(b.group)} for ${state.travellers}`;
  $('[data-hero-n]', calc).textContent = state.travellers;
  $('[data-step="-1"]', calc).disabled = state.travellers <= 1;
  $('[data-step="1"]', calc).disabled = state.travellers >= 6;
  $('[data-hero-transport]', calc).textContent = fmt(b.transport);

  const max = Math.max(b.transport, quote);
  const bar = $('[data-hero-bar]', calc);
  bar.setAttribute('aria-label', `${fmt(b.transport)} on this route against the ${fmt(quote)} direct ticket`);
  bar.style.setProperty('--quote-x', `${Math.round((quote / max) * 100)}%`);
  const fill = $('i', bar);
  fill.style.width = `${Math.round((b.transport / max) * 100)}%`;
  fill.classList.toggle('is-over', b.transport > quote);
  $('[data-hero-verdict]', calc).innerHTML = verdict(b.transport);
  $('[data-hero-route]', calc).textContent = plan.strategy.name;
  $('[data-hero-modes]', calc).innerHTML = plan.legs.map((l) => icon(l.icon)).join('');
}
