import { $, html, inr } from '../dom.js';
import { icon } from '../icons.js';
import { PRICES, CHECKED } from '../data/prices.js';
import { legLinks } from '../book.js';
import { flightKeys, verdict, logsFor, vsQuote, newLog } from '../fare.js';
import { isPinned, today } from '../clock.js';

// Fare watch card under the route legs (Hopper's verdict badge, stated as a
// rule). One row per flight: verdict, the fare we saw, your latest logged
// fare, recheck deep-links for the exact date, and a box to log what you saw.

const toast = (text, undo) => document.dispatchEvent(new CustomEvent('toast', { detail: { text, undo } }));

const badge = (v) => html`<span class="chip chip-${v.tone} fare-verdict" title="Rule of thumb: ${v.why}">${icon(v.id === 'book' ? 'check' : v.id === 'watch' ? 'clock' : 'undo')}${v.label}</span>`;

const trend = (v) => {
  if (v.latest.seen) return html`<span class="muted num">${inr(v.seen)} · ${CHECKED.split(', ')[1]}</span>`;
  const pct = Math.round((v.delta / v.seen) * 100);
  const cls = v.delta > 0 ? 'up' : v.delta < 0 ? 'down' : 'same';
  return html`<span class="fare-trend ${cls} num">${inr(v.latest.inr)} logged ${v.latest.iso.slice(5).replace('-', '/')} · ${v.delta > 0 ? '+' : ''}${inr(v.delta)} (${pct > 0 ? '+' : ''}${pct}%)</span>`;
};

const logRow = (key, l) => html`<li class="num">${l.iso.slice(5).replace('-', '/')} · ${inr(l.inr)} <button type="button" class="link" data-fare-del="${key}:${l.id}" aria-label="Remove this fare log">${icon('x')}</button></li>`;

const row = ({ leg, key }, state) => {
  const v = verdict(state, key);
  const links = legLinks(leg, state);
  const logs = logsFor(state, key);
  return html`
    <div class="fare" data-fare="${key}">
      <div class="fare-head">
        ${icon('plane')}
        <div>
          <b>${leg.from} → ${leg.to}</b> <span class="muted small">${leg.price.date} · ${leg.price.carrier}</span>
          <div class="small">${trend(v)}</div>
        </div>
        ${badge(v)}
      </div>
      <p class="small muted fare-why">${v.why} · ${v.out < 0 ? 'flown' : `${v.out} days to go`}</p>
      <div class="row fare-tools">
        ${links.map((l) => html`<a class="btn btn-sm" href="${l.url}" target="_blank" rel="noopener noreferrer">${l.name}${icon('link')}</a>`)}
        <form class="fare-log" data-fare-log="${key}">
          <label class="sr-only" for="fare-${key}">Fare you saw today, rupees</label>
          <input id="fare-${key}" name="inr" type="number" inputmode="numeric" min="1000" max="200000" step="1" placeholder="₹ you saw" required />
          <button class="btn btn-sm" type="submit">Log</button>
        </form>
      </div>
      ${logs.length ? html`<ul class="fare-logs small">${logs.map((l) => logRow(key, l))}</ul>` : ''}
    </div>`;
};

export const faresCard = (legs, state) => {
  const flights = flightKeys(legs);
  const q = vsQuote(legs, state.travellers);
  return html`
    <div class="fare-top">
      <div><span class="eyebrow">Fare watch</span><h3 class="h3">${q && q.saved > 0 ? html`${inr(q.saved)} under your ₹40k quote` : 'Flights, exact dates'}</h3></div>
      <span class="small muted">Rule of thumb, not a forecast${isPinned() ? html` · <b>clock pinned to ${today()}</b>` : ''}</span>
    </div>
    ${flights.map((f) => row(f, state))}`;
};

// Store wiring: logs append, removal flags `deleted` and offers Undo.
export function mountFares(store) {
  const host = $('#fares');
  if (!host) return;
  host.addEventListener('submit', (e) => {
    const f = e.target.closest('[data-fare-log]');
    if (!f) return;
    e.preventDefault();
    const inrVal = Number(new FormData(f).get('inr'));
    if (!Number.isFinite(inrVal) || inrVal < 1000) return;
    const key = f.dataset.fareLog;
    store.set((s) => ({ fares: { ...(s.fares || {}), [key]: [...(s.fares?.[key] || []), newLog(inrVal)] } }));
    toast(`Logged ${inr(inrVal)} for ${key in PRICES ? PRICES[key].date : key}`);
  });
  host.addEventListener('click', (e) => {
    const b = e.target.closest('[data-fare-del]');
    if (!b) return;
    const [key, id] = b.dataset.fareDel.split(':');
    const flag = (on) => store.set((s) => ({ fares: { ...s.fares, [key]: s.fares[key].map((x) => (x.id === id ? { ...x, deleted: on } : x)) } }));
    flag(true);
    toast('Fare log removed', () => flag(false));
  });
}
