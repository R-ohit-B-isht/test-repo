// Paid experiences. `key` → PRICES; `slots` = how much of a day it takes
// (0 = rides along, doesn't count as an activity); `when` hints the time of day.
// Kavaratti items priced from the SPORTS water-sports tariff; Agatti from operators.
const exp = (id, name, icon, bases, hint, extra = {}) => ({
  id, name, group: 'experience', icon, at: bases[0], bases, reach: 'base', slots: 1, on: false, hint, source: 'watersports', ...extra,
});

export const EXPERIENCES = [
  exp('scuba', 'Scuba at the reef drop-off', 'dive', ['Agatti', 'Kavaratti'], 'Discover Scuba, 2 h, no cert', { key: 'scuba', slots: 2, on: true, when: 'am' }),
  exp('kayak', 'Lagoon kayak / canoe', 'kayak', ['Agatti', 'Kavaratti', 'Kalpeni', 'Minicoy'], '30–60 min · mornings are calmest', { key: 'kayak', on: true, when: 'am' }),
  exp('snorkel', 'Coral-garden snorkel', 'snorkel', ['Agatti', 'Kavaratti', 'Kalpeni'], 'Shallow lagoon · turtles likely', { key: 'snorkel', on: true, when: 'am' }),
  exp('glassBottom', 'Glass-bottom boat', 'glass', ['Kavaratti'], 'Govt Water Sports Centre lagoon · 1 h', { key: 'glassBottom', on: true, when: 'pm' }),
  exp('jetSki', 'Jet-ski joyride', 'wave', ['Kavaratti', 'Agatti'], '10 min flat out across the lagoon', { key: 'jetSki', on: true, when: 'pm', source: 'sportsTariff' }),
  exp('bananaBoat', 'Banana boat', 'boat', ['Kavaratti'], '20 min · you will fall in', { key: 'bananaBoat', on: true, when: 'pm', source: 'sportsTariff' }),
  exp('parasail', 'Parasailing', 'bird', ['Kavaratti', 'Agatti'], '20 min above the lagoon · weather permitting', { key: 'parasail', when: 'pm', source: 'sportsTariff' }),
  exp('sailboat', 'Sailboat hour', 'boat', ['Kavaratti'], 'Yacht / sailboat joyride, 1 h', { key: 'sailboat', when: 'pm', source: 'sportsTariff' }),
  exp('nightFishing', 'Night lagoon fishing', 'fish', ['Kavaratti'], '3 h after dark · cook the catch', { key: 'nightFishing', when: 'night', source: 'sportsTariff' }),
  exp('fishing', 'Deep-sea big-game fishing', 'fish', ['Agatti', 'Kavaratti'], 'Half-day charter · tuna, GT', { key: 'fishing', slots: 2, when: 'am' }),
  exp('biolum', 'Night bioluminescence, Thinnakara', 'spark', ['Agatti'], 'After dark on the Thinnakara sandbank', {
    at: 'Thinnakara', reach: 'overnight', when: 'night', note: 'Needs a night at the SPORTS tent camp; not in this budget plan', source: 'samudram',
  }),
  exp('lavaDance', 'Lava dance', 'dance', ['Minicoy'], 'Minicoy’s drum dance · on request', { when: 'night', source: 'samudram', note: 'Kalpeni shows a folk dance on the Samudram day' }),
  exp('tuna', 'Malabar-style tuna dinner', 'meal', ['Agatti', 'Kavaratti', 'Minicoy'], 'Mas tuna, fish curry · at dinner', { on: true, slots: 0, when: 'night', source: 'agattiEats', note: 'Inside the meal budget; no extra cost' }),
];
