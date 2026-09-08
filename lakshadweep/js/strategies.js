// Strategy pattern: each way of getting Delhi ⇄ islands is a pure description
// (legs + ordered day blocks). Budget, map, itinerary and checklist only know
// the interface, never the individual strategy. `legs(fare)` receives a resolver
// (PRICES id → fare for the current ship/train class).

export const SHIP_CLASSES = [
  { id: 'bunk', name: 'Bunk', hint: 'Shared AC hall' },
  { id: 'second', name: '2nd class', hint: '4-berth cabin' },
  { id: 'first', name: '1st class', hint: '2-berth cabin' },
];
export const TRAIN_CLASSES = [
  { id: 'sleeper', name: 'Sleeper', hint: 'Non-AC berth' },
  { id: '3a', name: 'AC 3-tier', hint: 'AC berth + bedding' },
];

const shipLeg = (from, to, key, fare, shipClass) => ({
  from, to, icon: 'ship',
  mode: `Ship · ${SHIP_CLASSES.find((c) => c.id === shipClass)?.name || 'Bunk'}`,
  hours: 17,
  price: fare(key),
});
const trainLeg = (fare, trainClass) => ({
  from: 'Delhi', to: 'Kochi', icon: 'train',
  mode: trainClass === '3a' ? 'Train · AC 3-tier' : 'Train · Sleeper',
  hours: 46,
  price: fare('trainSleeper'),
});
const fly = (from, to, price, hours, mode = 'Flight') => ({ from, to, icon: 'plane', mode, hours, price });
const vessel = (from, to, fare) => ({ from, to, icon: 'boat', mode: 'Speed vessel', hours: 2, price: fare('speedVessel') });

const ISLAND_CORE = ['agattiLagoon', 'bangaram', 'toKavaratti', 'kavaratti'];

export const STRATEGIES = [
  {
    id: 'sail-both',
    name: 'Sail both ways',
    badge: 'Two nights at sea',
    blurb: 'Fly to Kochi, ship out, ship back. Two nights at sea.',
    shipLegs: 2,
    days: ['flyDelKochi', 'sailKochiAgatti', 'sailArriveAgatti', ...ISLAND_CORE, 'sailKavarattiKochi', 'atSeaKochi', 'flyKochiDel'],
    legs: (fare, { shipClass }) => [
      fly('Delhi', 'Kochi', fare('delKochi'), 3.5),
      shipLeg('Kochi', 'Agatti', 'shipOut', fare, shipClass),
      vessel('Agatti', 'Kavaratti', fare),
      shipLeg('Kavaratti', 'Kochi', 'shipBack', fare, shipClass),
      fly('Kochi', 'Delhi', fare('kochiDel'), 3.5),
    ],
  },
  {
    id: 'fly-sail',
    name: 'Fly in, sail out',
    badge: 'Most island time',
    blurb: 'Fly to Agatti on day two; overnight ship home. +1 lagoon day.',
    shipLegs: 1,
    days: ['flyDelKochi', 'flyKochiAgatti', 'agattiLagoon', 'bangaram', 'agattiScuba', 'toKavaratti', 'kavaratti', 'sailKavarattiKochi', 'atSeaKochi', 'flyKochiDel'],
    legs: (fare, { shipClass }) => [
      fly('Delhi', 'Kochi', fare('delKochi'), 3.5),
      fly('Kochi', 'Agatti', fare('kochiAgattiAir'), 1.25, 'IndiGo / FLY91'),
      vessel('Agatti', 'Kavaratti', fare),
      shipLeg('Kavaratti', 'Kochi', 'shipBack', fare, shipClass),
      fly('Kochi', 'Delhi', fare('kochiDel'), 3.5),
    ],
  },
  {
    id: 'train-sail',
    name: 'Train down, sail, fly home',
    badge: 'Slow · 12 days',
    blurb: 'Kerala Express to Kochi (46 h), ship both ways, fly back.',
    shipLegs: 2,
    days: ['trainOut1', 'trainOut2', 'trainOut3', 'sailKochiAgatti', 'sailArriveAgatti', ...ISLAND_CORE, 'sailKavarattiKochi', 'atSeaKochi', 'flyKochiDel'],
    legs: (fare, { shipClass, trainClass }) => [
      trainLeg(fare, trainClass),
      shipLeg('Kochi', 'Agatti', 'shipOut', fare, shipClass),
      vessel('Agatti', 'Kavaratti', fare),
      shipLeg('Kavaratti', 'Kochi', 'shipBack', fare, shipClass),
      fly('Kochi', 'Delhi', fare('kochiDel'), 3.5),
    ],
  },
  {
    id: 'fly-both',
    name: 'Fly everything',
    badge: 'No ship schedule',
    blurb: 'Every leg by air. Fastest; the 14 Oct Agatti → Kochi fare was steep.',
    shipLegs: 0,
    days: ['flyDelKochi', 'flyKochiAgatti', 'agattiLagoon', 'bangaram', 'agattiScuba', 'toKavaratti', 'kavaratti', 'vesselBackAgatti', 'flyAgattiKochi', 'flyKochiDel'],
    legs: (fare) => [
      fly('Delhi', 'Kochi', fare('delKochi'), 3.5),
      fly('Kochi', 'Agatti', fare('kochiAgattiAir'), 1.25, 'IndiGo / FLY91'),
      vessel('Agatti', 'Kavaratti', fare),
      vessel('Kavaratti', 'Agatti', fare),
      fly('Agatti', 'Kochi', fare('agattiKochiAir'), 1.25, 'FLY91'),
      fly('Kochi', 'Delhi', fare('kochiDel'), 3.5),
    ],
  },
  {
    id: 'samudram',
    name: 'Govt Samudram cruise',
    badge: 'Package · 7 days',
    blurb: 'SPORTS 5-day cruise: Minicoy, Kavaratti, Kalpeni. Sleep on the ship.',
    shipLegs: 0,
    days: ['flyDelKochi', 'samudramBoard', 'samudramMinicoy', 'samudramKavaratti', 'samudramKalpeni', 'samudramReturn', 'flyKochiDel'],
    legs: (fare) => [
      fly('Delhi', 'Kochi', fare('delKochi'), 3.5),
      { from: 'Kochi', to: 'Kochi', via: ['Minicoy', 'Kavaratti', 'Kalpeni'], icon: 'ship', mode: 'M.V. Kavaratti · Gold cabin, all meals', hours: 96, price: fare('samudramGold'), package: true },
      fly('Kochi', 'Delhi', fare('kochiDel'), 3.5),
    ],
  },
];

export function getStrategy(id) {
  return STRATEGIES.find((s) => s.id === id) || STRATEGIES[0];
}
