// The stopover and the crossing: Fort Kochi on the way in and out, and the two
// nights at sea. Base 'Kochi' / 'sea' matches the transit day blocks, so these
// land on the mainland and ship days only. `when` hints the time of day.
const kochi = (id, name, icon, hint, extra = {}) => ({
  id, name, group: 'stopover', icon, at: 'Kochi', bases: ['Kochi'], reach: 'base', slots: 1, on: false, hint, source: 'keralatourism', ...extra,
});
const aboard = (id, name, icon, hint, when) => ({
  id, name, group: 'stopover', icon, at: 'sea', bases: ['sea'], reach: 'base', slots: 0, on: true, hint, source: 'shipfares', ...(when && { when }),
});

export const STOPOVER = [
  kochi('fishingNets', 'Chinese fishing nets', 'camera', 'Vasco da Gama Square · best at sunset', { slots: 0, on: true, when: 'pm' }),
  kochi('kathakali', 'Kathakali, Kerala Kathakali Centre', 'dance', 'Make-up 17:00, show 18:00 · KB Jacob Rd', { key: 'kathakali', on: true, when: 'night', source: 'kathakali' }),
  kochi('kalari', 'Kalaripayattu show', 'spark', '19:15–20:00 · same venue as Kathakali', { key: 'kalari', when: 'night', source: 'kathakali' }),
  kochi('waterMetro', 'Water Metro to Vypin & back', 'boat', 'AC electric ferry · 20 min each way', { key: 'waterMetro', on: true, when: 'am', source: 'watermetro' }),
  kochi('mattancherry', 'Mattancherry Palace & Jew Town', 'walk', 'Dutch Palace murals, spice streets · closed Fri', { slots: 0, on: true, key: 'palace', when: 'am' }),
  kochi('cherai', 'Cherai Beach half-day', 'sun', 'Vypin ferry + bus, ~1 h each way', { slots: 2, key: 'cheraiTrip', when: 'am' }),
  aboard('seaSunrise', 'Sunrise mid-ocean', 'sun', 'Up before the canteen opens', 'am'),
  aboard('dolphins', 'Dolphins off the bow', 'wave', 'Watch from the rail · with luck'),
  aboard('deckSunset', 'Sunset from the aft deck', 'sun', 'Open sea, no land in sight', 'pm'),
  aboard('deckStars', 'Stargazing mid-ocean', 'moon', 'No light pollution for 200 km', 'night'),
];
