import { PRICES, CHECKED_ISO } from './data/prices.js';
import { TRIP } from './data/trip.js';
import { today as isoToday } from './clock.js';

// Fare watch (Hopper's book-now / wait badge, minus the prediction model):
// a labelled rule of thumb, never a forecast. Inputs are only the fare we saw
// on the checked date and the fares you log after opening the recheck link.
//   state.fares[key] = [{ id, iso, inr, created, deleted }]
// Logs are records: removing one flags `deleted`, nothing is spliced out.

export const DAY = 86_400_000;
export const daysBetween = (a, b) => Math.round((new Date(`${b}T00:00:00`) - new Date(`${a}T00:00:00`)) / DAY);

// Flight legs in the current route, keyed by their PRICES entry.
export const flightKeys = (legs) => legs
  .filter((l) => l.mode === 'plane')
  .map((l) => ({ leg: l, key: Object.keys(PRICES).find((k) => PRICES[k] === l.price) }))
  .filter((x) => x.key);

export const logsFor = (state, key) => (state.fares?.[key] || []).filter((x) => !x.deleted).sort((a, b) => (a.iso < b.iso ? -1 : 1));

export const latestFor = (state, key) => {
  const logs = logsFor(state, key);
  return logs.length ? logs[logs.length - 1] : { iso: CHECKED_ISO, inr: PRICES[key].amount, seen: true };
};

// Rules, in order. `today` is injectable so the dev bar can show every verdict.
//   recheck  freshest number is over 14 days old and the flight is still >14 days away
//   book     under 6 weeks to go, or the fare is at / below what we first saw
//   watch    fare has climbed >10 % since we saw it and there is still time
export const RULES = [
  { id: 'recheck', label: 'Recheck', tone: 'ink', why: 'freshest fare is over two weeks old', when: ({ age, out }) => age > 14 && out > 14 },
  { id: 'book', label: 'Book now', tone: 'jade', why: 'under six weeks out · fares rarely fall from here', when: ({ out }) => out <= 42 },
  { id: 'book', label: 'Book now', tone: 'jade', why: 'holding at or below the fare we saw', when: ({ ratio }) => ratio <= 1 },
  { id: 'watch', label: 'Watch', tone: 'sun', why: 'up on the fare we saw · check again in a week', when: ({ ratio }) => ratio > 1.1 },
  { id: 'book', label: 'Book now', tone: 'jade', why: 'within 10 % of the fare we saw', when: () => true },
];

export function verdict(state, key, today = isoToday()) {
  const price = PRICES[key];
  const latest = latestFor(state, key);
  const facts = {
    out: daysBetween(today, price.iso),
    age: daysBetween(latest.iso, today),
    ratio: latest.inr / price.amount,
    latest,
    seen: price.amount,
    delta: latest.inr - price.amount,
  };
  const rule = RULES.find((r) => r.when(facts));
  return { ...facts, id: rule.id, label: rule.label, tone: rule.tone, why: rule.why, rule: true };
}

// Both international legs together against the return quote that started this.
export const vsQuote = (legs, travellers) => {
  const intl = legs.filter((l) => l.mode === 'plane' && (l.from === 'DEL' || l.to === 'DEL'));
  if (!intl.length) return null;
  const total = intl.reduce((s, l) => s + (l.price.perGroup ? Math.ceil(l.price.amount / travellers) : l.price.amount), 0);
  return { total, quote: TRIP.quotedRoundTrip, saved: TRIP.quotedRoundTrip - total };
};

export const newLog = (inr, iso = isoToday()) => ({ id: `f-${Date.now().toString(36)}`, iso, inr: Math.round(inr), created: Date.now() });
