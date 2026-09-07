// Strategy pattern: each way of getting Delhi ⇄ islands is a pure description
// (legs + ordered day blocks). Budget, map, itinerary and checklist only know
// the interface, never the individual strategy.

const shipLeg = (from, to, prices, shipClass) => ({
  from, to, icon: 'ship',
  mode: shipClass === 'first' ? 'Ship · 1st-class berth' : 'Ship · 2nd class',
  hours: 17,
  price: shipClass === 'first' ? prices.shipFirst : prices.shipSecond,
});
const trainLeg = (prices, trainClass) => ({
  from: 'Delhi', to: 'Kochi', icon: 'train',
  mode: trainClass === '3a' ? 'Train · AC 3-tier' : 'Train · Sleeper',
  hours: 46,
  price: trainClass === '3a' ? prices.train3A : prices.trainSleeper,
});
const fly = (from, to, price, hours, mode = 'Flight') => ({ from, to, icon: 'plane', mode, hours, price });
const vessel = (from, to, prices) => ({ from, to, icon: 'boat', mode: 'Speed vessel', hours: 2, price: prices.speedVessel });

const ISLAND_CORE = ['agattiLagoon', 'bangaram', 'toKavaratti', 'kavaratti'];

export const STRATEGIES = [
  {
    id: 'sail-both',
    name: 'Sail both ways',
    badge: 'Two nights at sea',
    blurb: 'Fly to Kochi, ship out, ship back. Two nights at sea.',
    shipLegs: 2,
    days: ['flyDelKochi', 'sailKochiAgatti', 'sailArriveAgatti', ...ISLAND_CORE, 'sailKavarattiKochi', 'atSeaKochi', 'flyKochiDel'],
    legs: (p, { shipClass }) => [
      fly('Delhi', 'Kochi', p.delKochi, 3.5),
      shipLeg('Kochi', 'Agatti', p, shipClass),
      vessel('Agatti', 'Kavaratti', p),
      shipLeg('Kavaratti', 'Kochi', p, shipClass),
      fly('Kochi', 'Delhi', p.kochiDel, 3.5),
    ],
  },
  {
    id: 'fly-sail',
    name: 'Fly in, sail out',
    badge: 'Most island time',
    blurb: 'FLY91 to Agatti on day two; overnight ship home. +1 lagoon day.',
    shipLegs: 1,
    days: ['flyDelKochi', 'flyKochiAgatti', 'agattiLagoon', 'bangaram', 'agattiScuba', 'toKavaratti', 'kavaratti', 'sailKavarattiKochi', 'atSeaKochi', 'flyKochiDel'],
    legs: (p, { shipClass }) => [
      fly('Delhi', 'Kochi', p.delKochi, 3.5),
      fly('Kochi', 'Agatti', p.kochiAgattiAir, 1.25, 'FLY91'),
      vessel('Agatti', 'Kavaratti', p),
      shipLeg('Kavaratti', 'Kochi', p, shipClass),
      fly('Kochi', 'Delhi', p.kochiDel, 3.5),
    ],
  },
  {
    id: 'train-sail',
    name: 'Train down, sail, fly home',
    badge: 'Slow · 12 days',
    blurb: 'Kerala Express to Kochi (46 h), ship both ways, fly back.',
    shipLegs: 2,
    days: ['trainOut1', 'trainOut2', 'trainOut3', 'sailKochiAgatti', 'sailArriveAgatti', ...ISLAND_CORE, 'sailKavarattiKochi', 'atSeaKochi', 'flyKochiDel'],
    legs: (p, { shipClass, trainClass }) => [
      trainLeg(p, trainClass),
      shipLeg('Kochi', 'Agatti', p, shipClass),
      vessel('Agatti', 'Kavaratti', p),
      shipLeg('Kavaratti', 'Kochi', p, shipClass),
      fly('Kochi', 'Delhi', p.kochiDel, 3.5),
    ],
  },
  {
    id: 'fly-both',
    name: 'Fly everything',
    badge: 'No ship schedule',
    blurb: 'Every leg by air. Fastest; still far under the ₹40k ticket.',
    shipLegs: 0,
    days: ['flyDelKochi', 'flyKochiAgatti', 'agattiLagoon', 'bangaram', 'agattiScuba', 'toKavaratti', 'kavaratti', 'vesselBackAgatti', 'flyAgattiKochi', 'flyKochiDel'],
    legs: (p) => [
      fly('Delhi', 'Kochi', p.delKochi, 3.5),
      fly('Kochi', 'Agatti', p.kochiAgattiAir, 1.25, 'FLY91'),
      vessel('Agatti', 'Kavaratti', p),
      vessel('Kavaratti', 'Agatti', p),
      fly('Agatti', 'Kochi', p.agattiKochiAir, 1.25, 'FLY91'),
      fly('Kochi', 'Delhi', p.kochiDel, 3.5),
    ],
  },
  {
    id: 'samudram',
    name: 'Govt Samudram cruise',
    badge: 'Package · 7 days',
    blurb: 'SPORTS 5-day cruise: Minicoy, Kavaratti, Kalpeni. Sleep on the ship.',
    shipLegs: 0,
    days: ['flyDelKochi', 'samudramBoard', 'samudramMinicoy', 'samudramKavaratti', 'samudramKalpeni', 'samudramReturn', 'flyKochiDel'],
    legs: (p) => [
      fly('Delhi', 'Kochi', p.delKochi, 3.5),
      { from: 'Kochi', to: 'Kochi', via: ['Minicoy', 'Kavaratti', 'Kalpeni'], icon: 'ship', mode: 'M.V. Kavaratti · Gold cabin, all meals', hours: 96, price: p.samudramGold, package: true },
      fly('Kochi', 'Delhi', p.kochiDel, 3.5),
    ],
  },
];

export function getStrategy(id) {
  return STRATEGIES.find((s) => s.id === id) || STRATEGIES[0];
}

export const SHIP_CLASSES = [
  { id: 'second', name: '2nd class', hint: 'AC push-back seat' },
  { id: 'first', name: '1st class', hint: 'Cabin berth' },
];
export const TRAIN_CLASSES = [
  { id: 'sleeper', name: 'Sleeper', hint: 'Non-AC berth' },
  { id: '3a', name: 'AC 3-tier', hint: 'AC berth + bedding' },
];
