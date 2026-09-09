import { DEFAULT_STATE, SHAREABLE } from './config.js';
import { DEFAULT_PICKS, activityInr, lookup } from './data/activities.js';
import { DAYS, SLOTS, mealsFor, sleepFor, whereFor } from './data/days.js';
import { STOPS, TRIP, dateOf, dayDate, inrFromVnd, inrFromUsd } from './data/trip.js';
import { PHOTOS } from './data/photos.js';
import { PRICES } from './data/prices.js';
import { findStrategy } from './strategies.js';
import { computeBudget } from './budget.js';
import { decodePlan, encodePlan } from './share.js';

// The magazine (trip.html): a read-only, print-shaped issue of one plan.
// With ?p= in the URL it reads the plan carried by the link and never touches
// the store; without it, it is your own saved plan, live. Pure model here,
// markup in render/mag.js.

export const COVER_PHOTO = 'halong';

// Which plan this page is about: a shared link (read-only) or your own.
export const magSource = (search, mine) => {
  const p = new URLSearchParams(search).get('p');
  if (!p) return { from: 'mine', state: mine, p: null };
  const patch = decodePlan(p);
  if (!patch) return { from: 'bad', state: mine, p: null };
  const fresh = structuredClone(DEFAULT_STATE);
  fresh.picks = { ...DEFAULT_PICKS };
  return { from: 'link', p, state: { ...fresh, ...Object.fromEntries(SHAREABLE.map((k) => [k, k in patch ? patch[k] : fresh[k]])) } };
};

const page = (name) => `${location.origin}${location.pathname.replace(/[^/]*$/, name)}`;
export const magUrl = (state) => `${page('trip.html')}?p=${encodePlan(state)}`;
export const plannerUrl = (p) => `${page('days.html')}?p=${p}`;

const money = (m) => (m.vnd ? inrFromVnd(m.vnd) : m.usd ? inrFromUsd(m.usd) : null);

const doRow = (x, travellers) => ({
  id: x.id, name: x.name, icon: x.icon, must: !!x.must, cont: !!x.cont, hint: x.hint || null,
  inr: x.cont ? null : activityInr(x, travellers), free: !!x.free, est: !!x.est, pic: x,
});

const slotOf = (k, slot, travellers) => (slot.fixed
  ? { k, fixed: true, icon: slot.icon, text: slot.text }
  : { k, fixed: false, lead: slot.lead || null, items: slot.items.map((x) => doRow(x, travellers)) });

const dayModel = (day, state, transit, plan) => {
  const pd = plan.days[day.n - 1];
  const photo = PHOTOS[day.photo];
  const fun = SLOTS.flatMap((k) => (pd.slots[k].fixed ? [] : pd.slots[k].items)).filter((x) => !x.cont);
  return {
    n: day.n, iso: dayDate(day.n), date: dateOf(day.n), title: day.title,
    where: whereFor(day, transit) || STOPS.find((s) => s.id === day.stop).name,
    stop: day.stop, weather: day.weather,
    photo: { src: `assets/photos/${day.photo}.jpg`, ...photo },
    slots: SLOTS.map((k) => slotOf(k, pd.slots[k], state.travellers)),
    count: fun.length,
    see: pd.see.map((x) => ({ id: x.id, name: x.name, icon: x.icon })),
    meals: mealsFor(day, transit).map((m, i) => ({ i, name: m.name, dish: m.dish, inr: money(m), src: m.src })),
    sleep: (() => { const s = sleepFor(day, transit); return { name: s.name, area: s.area, inr: money(s), src: s.src }; })(),
    tips: day.tips || [],
  };
};

// Stops in the order the trip visits them, with the days spent at each.
const routeOf = (days) => {
  const out = [];
  days.forEach((d) => {
    const last = out[out.length - 1];
    if (last && last.id === d.stop) last.days.push(d.n);
    else out.push({ id: d.stop, name: STOPS.find((s) => s.id === d.stop).name, days: [d.n] });
  });
  return out;
};

export function magModel(state) {
  const strategy = findStrategy(state.strategy);
  const b = computeBudget(state);
  const plan = b.plan;
  const days = DAYS.map((d) => dayModel(d, state, strategy.transit, plan));
  const flights = b.legs.filter((l) => l.mode === 'plane').map((l) => ({
    from: l.from, to: l.to, note: l.note, inr: l.price.perGroup ? Math.ceil(l.price.amount / state.travellers) : l.price.amount, range: l.price.range || '',
  }));
  const ground = b.legs.filter((l) => l.mode !== 'plane');
  const first = dayDate(1);
  const last = dayDate(TRIP.days);
  const fmt = (d, o) => d.toLocaleDateString('en-IN', o);
  return {
    title: TRIP.title,
    dates: `${fmt(first, { day: 'numeric' })}–${fmt(last, { day: 'numeric', month: 'long', year: 'numeric' })}`,
    out: `Delhi, ${PRICES.delDad.date}`,
    travellers: state.travellers,
    strategy: { name: strategy.name, summary: strategy.summary },
    total: b.total, group: b.group, lines: b.lines, vsQuote: b.vsQuote, quote: TRIP.quotedRoundTrip,
    tickets: plan.paid.length,
    fun: days.reduce((s, d) => s + d.count, 0),
    cover: { src: `assets/photos/${COVER_PHOTO}.jpg`, ...PHOTOS[COVER_PHOTO] },
    route: routeOf(days),
    days,
    flights,
    ground,
    checked: TRIP.observedWindow,
    credits: [...new Set([COVER_PHOTO, ...DAYS.map((d) => d.photo)])].map((k) => ({ key: k, ...PHOTOS[k] })),
    noRoom: plan.noRoom.map((id) => lookup(state, id)?.name).filter(Boolean),
  };
}
