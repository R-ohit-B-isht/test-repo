import { inrFromUsd, inrFromVnd } from './trip.js';

// Every price: rupees per person unless `perGroup`, plus how sure we are.
//   kind: 'observed' = a fare seen on Google Flights for the exact travel date,
//   one adult, taxes included, no checked bag · 'listed' = a published fixed
//   price · 'estimate' = a range from a guide, with the midpoint used.
// Flights carry `date` (the day searched), `carrier` (what was quoted) and
// `iso` / `isoBack` (the dates booking links search for).
const p = (amount, source, kind, range, extra = {}) => ({ amount, source, kind, range, ...extra });
const flight = (amount, source, date, carrier, range, iso, isoBack) => p(amount, source, 'observed', range, { date, carrier, iso, isoBack });

export const CHECKED = 'Google Flights, checked 7 Sep 2026';
export const CHECKED_ISO = '2026-09-07';

export const PRICES = {
  // International, one way. Searched for the exact dates below.
  delDad: flight(14072, 'gfDelDad', 'Fri 23 Oct', 'AirAsia X · 1 stop KUL', 'dep 23:20 · lands Da Nang Sat 10:50', '2026-10-23'),
  hanDel: flight(16535, 'gfHanDel', 'Sat 31 Oct', 'VietJet · non-stop', 'dep 19:10 · lands Delhi 22:50', '2026-10-31'),
  delHan: flight(18112, 'gfDelHan', 'Sat 24 Oct', 'IndiGo · non-stop', 'dep 04:45 · lands 10:50', '2026-10-24'),
  dadDel: flight(21474, 'gfDadDel', 'Sat 31 Oct', 'Thai AirAsia · 1 stop DMK', 'dep 12:40 · lands 19:50', '2026-10-31'),
  delDadSat: flight(19600, 'gfDelDadSat', 'Sat 24 Oct', 'Thai AirAsia X · 1 stop DMK', 'dep 20:55 · lands Sun 09:05', '2026-10-24'),
  delHanReturn: flight(34646, 'gfDelHanRt', '24 → 31 Oct', 'IndiGo · non-stop both ways', 'return fare', '2026-10-24', '2026-10-31'),
  delDadReturn: flight(35641, 'gfDelDadRt', '23 → 31 Oct', 'AirAsia X · via KUL both ways', 'return fare', '2026-10-23', '2026-10-31'),

  // Domestic hops. Cabin bag only; a 20 kg bag adds roughly ₹700–1,000.
  hanDad: flight(3849, 'gfHanDad', 'Sat 24 Oct', 'Vietravel · non-stop', 'dep 16:55 · lands 18:20', '2026-10-24'),
  hueHan: flight(3245, 'gfHueHan', 'Tue 27 Oct', 'VietJet · non-stop', 'dep 15:55 · lands 17:10', '2026-10-27'),

  // Rail and road
  train6: p(inrFromVnd(490000), 'vnTrainHueHan', 'listed', '490,000–605,000 ₫ 6-berth', { iso: '2026-10-27' }),
  train4: p(inrFromVnd(640000), 'vnTrainHueHan', 'listed', '640,000–715,000 ₫ 4-berth', { iso: '2026-10-27' }),
  busHueHan: p(inrFromVnd(600000), 'vexereBus', 'estimate', '430,000–800,000 ₫ sleeper · limousine', { iso: '2026-10-27' }),
  trainDadHue: p(inrFromVnd(99000), 'vnTrainDadHue', 'listed', '99,000 ₫ soft seat AC', { iso: '2026-10-26' }),
  shuttleHoiAn: p(inrFromUsd(6), 'hoianExpress', 'listed', 'US$6 shared shuttle'),
  yellowBus: p(inrFromVnd(30000), 'danangHoian', 'listed', 'flat 30,000 ₫'),
  grabMarble: p(inrFromVnd(275000), 'marbleMountains', 'estimate', '250,000–300,000 ₫ per car', { perGroup: true }),
  grabToStation: p(inrFromVnd(125000), 'marbleMountains', 'estimate', '100,000–150,000 ₫ per car, Marble Mountains → Da Nang', { perGroup: true }),
  bus86: p(inrFromVnd(45000), 'bus86', 'listed', 'flat 45,000 ₫'),

  // Daily rates — sliders start here, you decide the comfort
  bed: p(inrFromUsd(9), 'hostels', 'estimate', 'dorm US$5–16/night'),
  food: p(inrFromUsd(10.5), 'foodBudget', 'estimate', 'US$6–10 street · US$10–18 mixed'),
  local: p(inrFromVnd(80000), 'grabPrices', 'estimate', '2–3 GrabBike hops a day'),

  // Fixed admin
  evisa: p(inrFromUsd(25), 'evisa', 'listed', 'US$25 single entry'),
  sim: p(inrFromVnd(165000), 'viettel', 'listed', '150,000 ₫ plan + SIM card'),
};

export const KIND_LABEL = {
  observed: 'seen',
  listed: 'listed',
  estimate: 'est.',
};

// Same routes, neighbouring days. Shows why the trip starts on a Friday night.
export const DATE_GRID = {
  out: { route: 'DEL → DAD', source: 'gfDelDad', days: [['Thu 22', 21039], ['Fri 23', 14072], ['Sat 24', 19600]], pick: 1 },
  back: { route: 'HAN → DEL', source: 'gfHanDel', days: [['Fri 30', 21465], ['Sat 31', 16535], ['Sun 1 Nov', 22303]], pick: 1 },
};
