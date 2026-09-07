// Strategy pattern: each route is one object with the same shape, so the
// picker, ledger and itinerary can compare them as identical units.

const leg = (from, to, mode, price, note = '') => ({ from, to, mode, price, note });

const arrive = (P) => leg('DEL', 'HAN', 'plane', P.delHan, 'one way');
const hanoiIn = (P) => leg('Noi Bai', 'Old Quarter', 'bus', P.bus86, 'bus 86 · 45 min');
const hueDown = (P) => leg('HUE', 'DAD', 'train', P.trainHueDad, 'SE1 08:56 → 11:41 · Hai Van');
const toHoiAn = (P) => leg('Da Nang', 'Hoi An', 'bus', P.yellowBus, 'yellow bus · 60–90 min');
const toAirport = (P) => leg('Hoi An', 'DAD', 'car', P.grabToAirport, 'GrabCar · split by group');
const home = (P) => leg('DAD', 'DEL', 'plane', P.dadDel, 'one way');

const nightTrain = (P, s) => leg('HAN', 'HUE', 'train', s.berth === '4' ? P.train4 : P.train6, 'SE1 19:30 → 08:48 · 13 h');

export const STRATEGIES = [
  {
    id: 'train',
    name: 'Open-jaw + night train',
    tag: 'Recommended',
    transit: 'train',
    paidNights: 6,
    legs: (P, s) => [arrive(P), hanoiIn(P), nightTrain(P, s), hueDown(P), toHoiAn(P), toAirport(P), home(P)],
    summary: 'Fly into Hanoi, out of Da Nang. Sleep on the rails once.',
    why: 'Two one-ways beat the return fare, and the train saves a hotel night.',
  },
  {
    id: 'bus',
    name: 'Open-jaw + sleeper bus',
    tag: 'Cheapest',
    transit: 'bus',
    paidNights: 6,
    legs: (P) => [arrive(P), hanoiIn(P), leg('HAN', 'HUE', 'bus', P.busHanHue, 'sleeper · 12–13 h'), hueDown(P), toHoiAn(P), toAirport(P), home(P)],
    summary: 'Same shape, bus instead of train. Saves a little, sleeps worse.',
    why: 'Lowest cash. Reclining bunk, mountain road, no shower.',
  },
  {
    id: 'fly',
    name: 'Open-jaw + fly south',
    tag: 'Fastest',
    transit: 'fly',
    paidNights: 7,
    legs: (P) => [
      arrive(P), hanoiIn(P),
      leg('HAN', 'DAD', 'plane', P.hanDad, 'evening hop'),
      leg('DAD', 'HUE', 'train', P.trainHueDad, 'morning · ~2 h 45'),
      hueDown(P), toHoiAn(P), toAirport(P), home(P),
    ],
    summary: 'Skip the night train. Costs an extra bed and a bag fee.',
    why: 'Fastest, but you pay a hotel night and still ride the train twice.',
  },
  {
    id: 'roundtrip',
    name: 'Return via Hanoi',
    tag: 'One booking',
    transit: 'train',
    paidNights: 6,
    legs: (P, s) => [
      leg('DEL', 'HAN', 'plane', P.delHanReturn, 'return fare'),
      hanoiIn(P), nightTrain(P, s), hueDown(P), toHoiAn(P), toAirport(P),
      leg('DAD', 'HAN', 'plane', P.dadHan, 'day 8 backtrack'),
    ],
    summary: 'The ₹25,893 return, plus a flight back up to catch it.',
    why: 'Simpler ticket, but day 8 is a 2-flight backtrack.',
  },
];

// Routes we costed and dropped. Shown, not selectable.
export const REJECTED = [
  {
    name: 'Via Bangkok',
    legs: (P) => [leg('DEL', 'BKK', 'plane', P.delBkk), leg('BKK', 'HAN', 'plane', P.bkkHan), home(P)],
    verdict: 'Self-transfer, second bag fee, a day lost. Not cheaper once you add those.',
  },
  {
    name: 'Fly Delhi → Da Nang first',
    legs: (P) => [leg('DEL', 'DAD', 'plane', P.delDad)],
    verdict: 'Same in-fare. No cheaper Hanoi → Delhi leg found to pair it with. Flip only if fares flip.',
  },
];

export const transportTotal = (strategy, prices, state) => strategy.legs(prices, state)
  .reduce((sum, l) => sum + (l.price.perGroup ? Math.ceil(l.price.amount / state.travellers) : l.price.amount), 0);

export const findStrategy = (id) => STRATEGIES.find((s) => s.id === id) || STRATEGIES[0];
