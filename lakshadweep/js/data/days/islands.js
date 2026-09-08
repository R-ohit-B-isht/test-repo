// Island-day blocks on the homestay routes. Few fixed items on purpose: picked
// places and experiences fill the day (max 4 things, all on the same island).
export const ISLAND_BLOCKS = {
  agattiLagoon: {
    icon: 'snorkel', place: 'Agatti', nav: 'Agatti', photo: 'lagoon', base: 'Agatti', at: 'Agatti',
    title: 'Lagoon day',
    fixed: [{ ic: 'sun', t: 'Slow morning; swim when the tide is in' }],
    meals: { b: 'homestay', l: 'fryKing', d: 'homestay' },
    stay: 'agattiHome',
    spend: [],
  },
  bangaram: {
    icon: 'boat', place: 'Agatti', nav: 'Agatti', photo: 'bangaram', base: 'Agatti', at: 'Agatti',
    title: 'Blue-water day',
    fixed: [{ ic: 'clock', t: 'Confirm boats and sea state with the host' }],
    meals: { b: 'homestay', l: 'packed', d: 'cucumber' },
    stay: 'agattiHome',
    spend: [],
  },
  agattiScuba: {
    icon: 'dive', place: 'Agatti', nav: 'Agatti', photo: 'lagoon', base: 'Agatti', at: 'Agatti',
    title: 'Under, then across',
    fixed: [{ ic: 'walk', t: 'Walk the island end to end at golden hour' }],
    meals: { b: 'homestay', l: 'homestay', d: 'fryKing' },
    stay: 'agattiHome',
    spend: [],
  },
  toKavaratti: {
    icon: 'boat', place: 'Agatti → Kavaratti', nav: 'Kavaratti', photo: 'boat', base: 'Kavaratti', at: 'Kavaratti', cap: 2, free: ['pm', 'night'],
    title: 'Two hours of open water',
    fixed: [{ ic: 'boat', t: 'High-speed vessel, sit on the shaded side' }, { ic: 'rupee', t: 'Only island with ATMs: take cash' }],
    meals: { b: 'homestay', l: 'kavarattiHotel', d: 'homestay' },
    stay: 'kavarattiHome',
    spend: [{ key: 'speedVessel', transport: true }],
  },
  kavaratti: {
    icon: 'glass', place: 'Kavaratti', nav: 'Kavaratti', photo: 'kavaratti', base: 'Kavaratti', at: 'Kavaratti',
    title: 'The big calm lagoon',
    fixed: [{ ic: 'wave', t: 'SPORTS Water Sports Centre: fixed tariff, cheapest in the islands' }],
    meals: { b: 'homestay', l: 'kavarattiHotel', d: 'homestay' },
    stay: 'kavarattiHome',
    spend: [],
  },
  vesselBackAgatti: {
    icon: 'boat', place: 'Kavaratti → Agatti', nav: 'Agatti', photo: 'boat', base: 'Agatti', at: 'Agatti', cap: 1, free: ['pm'],
    title: 'Back across the channel',
    fixed: [{ ic: 'boat', t: 'Morning vessel to Agatti' }, { ic: 'moon', t: 'Early night for the 09:50 flight' }],
    meals: { b: 'homestay', l: 'homestay', d: 'cucumber' },
    stay: 'agattiHome',
    spend: [{ key: 'speedVessel', transport: true }],
  },
};
