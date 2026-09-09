// Strategy pattern: each route is an object with the same shape, so the picker,
// map, budget and itinerary switch on `strategy.transit` without branching on ids.
// Direction is middle → north because the cheapest exact-date fares land in Da Nang
// (Fri night AirAsia via KUL) and leave from Hanoi (Sat evening VietJet non-stop).

import { findHop, wayOf, wayPrice } from './data/hops.js';

const leg = (from, to, mode, price, note = '') => ({ from, to, mode, price, note });

// A hop you can do more than one way (hops.js): the leg follows your choice.
const hopLeg = (id, P, s) => {
  const hop = findHop(id);
  const w = wayOf(hop, s.hops);
  return leg(hop.from, hop.to, w.mode, wayPrice(w, P, s), `day ${hop.day} · ${w.name}`);
};

// Shared legs. Flight legs carry their searched date, shown next to the fare.
const arrive = (P) => leg('DEL', 'DAD', 'plane', P.delDad, `${P.delDad.date} · ${P.delDad.carrier}`);
const home = (P) => leg('HAN', 'DEL', 'plane', P.hanDel, `${P.hanDel.date} · ${P.hanDel.carrier}`);
const toHoiAn = (P, s) => hopLeg('dadHoian', P, s);
const toMarble = (P) => leg('Hoi An', 'Marble Mts', 'car', P.grabMarble, 'day 3 · Grab, split by car');
const toStation = (P) => leg('Marble Mts', 'Da Nang stn', 'car', P.grabToStation, 'day 3 · Grab, split by car');
const toHue = (P, s) => hopLeg('dadHue', P, s);
const airportBus = (P, s) => hopLeg('hanAirport', P, s);

const northBy = {
  train: (P, s) => leg('Hue', 'Hanoi', 'train', s.berth === '4' ? P.train4 : P.train6, 'night 4 · SE20 21:30 → 11:55'),
  bus: (P) => leg('Hue', 'Hanoi', 'bus', P.busHueHan, 'night 4 · sleeper, ~12 h'),
  fly: (P) => leg('Hue', 'Hanoi', 'plane', P.hueHan, `${P.hueHan.date} · ${P.hueHan.carrier}`),
};

export const STRATEGIES = [
  {
    id: 'train',
    name: 'Open-jaw + night train',
    tag: 'Recommended',
    transit: 'train',
    paidNights: 6,
    summary: 'Fly into Da Nang Fri night, out of Hanoi Sat evening. One night on the rails.',
    why: 'Two one-ways beat every return fare, and the SE20 saves a hotel night.',
    legs: (P, s) => [arrive(P), toHoiAn(P, s), toMarble(P), toStation(P), toHue(P, s), northBy.train(P, s), airportBus(P, s), home(P)],
  },
  {
    id: 'bus',
    name: 'Open-jaw + sleeper bus',
    tag: 'Flexible',
    transit: 'bus',
    paidNights: 6,
    summary: 'Same shape, sleeper bus instead of the train. Hostel pickup, ~12 h.',
    why: 'Book days out, not weeks. Reclining bunk, no shower, arrives before dawn.',
    legs: (P, s) => [arrive(P), toHoiAn(P, s), toMarble(P), toStation(P), toHue(P, s), northBy.bus(P), airportBus(P, s), home(P)],
  },
  {
    id: 'fly',
    name: 'Open-jaw + fly north',
    tag: 'Fastest',
    transit: 'fly',
    paidNights: 7,
    summary: 'Skip the night train: Hue → Hanoi in 75 min. Costs a bed and a bag fee.',
    why: 'Fastest. You pay a Hanoi hotel night and get a Hanoi evening on day 4.',
    legs: (P, s) => [arrive(P), toHoiAn(P, s), toMarble(P), toStation(P), toHue(P, s), northBy.fly(P), airportBus(P, s), home(P)],
  },
  {
    id: 'roundtrip',
    name: 'Return via Hanoi',
    tag: 'One booking',
    transit: 'train',
    paidNights: 6,
    summary: 'The ₹34,646 IndiGo return, plus a hop down to Da Nang on day 1.',
    why: 'Simpler ticket, same plan. Only wins if the return fare drops under ₹27k.',
    legs: (P, s) => [
      leg('DEL', 'HAN', 'plane', P.delHanReturn, `${P.delHanReturn.date} · ${P.delHanReturn.carrier}`),
      leg('HAN', 'DAD', 'plane', P.hanDad, `${P.hanDad.date} · ${P.hanDad.carrier}`),
      toHoiAn(P, s), toMarble(P), toStation(P), toHue(P, s), northBy.train(P, s), airportBus(P, s),
    ],
  },
];

// Routes we costed for the same dates and dropped. Shown, not selectable.
export const REJECTED = [
  {
    name: 'North first: land Hanoi, leave Da Nang',
    legs: (P) => [leg('DEL', 'HAN', 'plane', P.delHan), leg('DAD', 'DEL', 'plane', P.dadDel)],
    verdict: 'Sat 24 in, Sat 31 out. ₹9k more than the same days the other way round, and the plan runs into the wet south at the end.',
  },
  {
    name: 'Delhi → Da Nang on the Saturday',
    legs: (P) => [leg('DEL', 'DAD', 'plane', P.delDadSat), leg('HAN', 'DEL', 'plane', P.hanDel)],
    verdict: 'Thai AirAsia X via Bangkok, lands Sunday 09:05. ₹5.5k more than Friday night and you lose Saturday.',
  },
  {
    name: 'Return ticket, Delhi ↔ Da Nang',
    legs: (P) => [leg('DEL', 'DAD', 'plane', P.delDadReturn)],
    verdict: 'Ends in Da Nang, so day 7–8 becomes a backtrack south. ₹5k more than open-jaw before that.',
  },
];

export const findStrategy = (id) => STRATEGIES.find((s) => s.id === id) ?? STRATEGIES[0];

export const transportTotal = (strategy, P, state) => strategy.legs(P, state).reduce((sum, l) => sum + (l.price.perGroup ? Math.ceil(l.price.amount / state.travellers) : l.price.amount), 0);
