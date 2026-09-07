// Strategy pattern: each way of getting Delhi ⇄ islands is a pure function
// from (prices, options) → ordered legs. The budget and route views only
// know the interface, never the individual strategy.

function ship(prices, shipClass) {
  return shipClass === 'first' ? prices.shipFirst : prices.shipSecond;
}

export const STRATEGIES = [
  {
    id: 'fly-sail',
    name: 'Fly in, sail out',
    recommended: true,
    summary: 'Fly Kochi → Agatti so you land on day two; come back on the overnight ship. The best trade of money for days.',
    itineraryNote: 'This is the plan the ten days below are written for.',
    legs(prices, { shipClass }) {
      return [
        { from: 'Delhi', to: 'Kochi', mode: 'Flight', price: prices.delKochi },
        { from: 'Kochi', to: 'Agatti', mode: 'Flight · Alliance Air', price: prices.kochiAgattiAir },
        { from: 'Agatti', to: 'Kavaratti', mode: 'High-speed vessel', price: prices.speedVessel },
        { from: 'Kavaratti', to: 'Kochi', mode: `Ship · ${shipClass === 'first' ? 'first-class cabin' : 'second class'}`, price: ship(prices, shipClass) },
        { from: 'Kochi', to: 'Delhi', mode: 'Flight', price: prices.kochiDel },
      ];
    },
  },
  {
    id: 'sail-both',
    name: 'Ship both ways',
    summary: 'Cheapest on paper. Costs you two more nights at sea, and both sailings have to line up with the weekly schedule.',
    itineraryNote: 'Day 2 becomes an overnight sailing from Kochi and you lose one Agatti day; Days 8–9 stay as written.',
    legs(prices, { shipClass }) {
      const s = ship(prices, shipClass);
      return [
        { from: 'Delhi', to: 'Kochi', mode: 'Flight', price: prices.delKochi },
        { from: 'Kochi', to: 'Agatti', mode: `Ship · ${shipClass === 'first' ? 'first-class cabin' : 'second class'}`, price: s },
        { from: 'Agatti', to: 'Kavaratti', mode: 'High-speed vessel', price: prices.speedVessel },
        { from: 'Kavaratti', to: 'Kochi', mode: `Ship · ${shipClass === 'first' ? 'first-class cabin' : 'second class'}`, price: s },
        { from: 'Kochi', to: 'Delhi', mode: 'Flight', price: prices.kochiDel },
      ];
    },
  },
  {
    id: 'fly-both',
    name: 'Fly both ways',
    summary: 'Fastest, no ship schedule to chase. Still well under the ₹40k quote because every leg is booked separately.',
    itineraryNote: 'Days 8–9 collapse into one: vessel back to Agatti, then the morning Alliance Air flight to Kochi. You gain a Kochi day.',
    legs(prices) {
      return [
        { from: 'Delhi', to: 'Kochi', mode: 'Flight', price: prices.delKochi },
        { from: 'Kochi', to: 'Agatti', mode: 'Flight · Alliance Air', price: prices.kochiAgattiAir },
        { from: 'Agatti', to: 'Kavaratti', mode: 'High-speed vessel', price: prices.speedVessel },
        { from: 'Kavaratti', to: 'Agatti', mode: 'High-speed vessel', price: prices.speedVessel },
        { from: 'Agatti', to: 'Kochi', mode: 'Flight · Alliance Air', price: prices.agattiKochiAir },
        { from: 'Kochi', to: 'Delhi', mode: 'Flight', price: prices.kochiDel },
      ];
    },
  },
];

export function getStrategy(id) {
  return STRATEGIES.find((s) => s.id === id) || STRATEGIES[0];
}

export function transportTotal(strategy, prices, options) {
  return strategy.legs(prices, options).reduce((sum, leg) => sum + leg.price.amount, 0);
}
