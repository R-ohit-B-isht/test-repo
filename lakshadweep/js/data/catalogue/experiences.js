// Activities and experiences. Same shape as places.js. `at` is where the map
// pin goes; `bases` lists every island where it can be booked.
const exp = (id, name, icon, bases, hint, extra = {}) => ({ id, name, group: 'experience', icon, at: bases[0], bases, reach: 'base', slots: 1, on: false, hint, source: 'watersports', ...extra });

export const EXPERIENCES = [
  exp('scuba', 'Scuba at the reef drop-off', 'dive', ['Agatti', 'Kavaratti'], 'Discover Scuba, 2 h, no cert', { key: 'scuba', slots: 2 }),
  exp('kayak', 'Lagoon kayak / canoe', 'kayak', ['Agatti', 'Kavaratti', 'Kalpeni', 'Minicoy'], '30–60 min · mornings are calmest', { key: 'kayak', on: true }),
  exp('snorkel', 'Coral-garden snorkel', 'snorkel', ['Agatti', 'Kavaratti', 'Kalpeni'], 'Shallow lagoon · turtles likely', { key: 'snorkel', on: true }),
  exp('fishing', 'Deep-sea big-game fishing', 'fish', ['Agatti', 'Kavaratti'], 'Half-day charter · tuna, GT', { key: 'fishing', slots: 2 }),
  exp('glassBottom', 'Glass-bottom boat', 'glass', ['Kavaratti'], 'Govt Water Sports Centre lagoon', { key: 'glassBottom' }),
  exp('biolum', 'Night bioluminescence, Thinnakara', 'spark', ['Agatti'], 'After dark on the Thinnakara sandbank', {
    at: 'Thinnakara', reach: 'overnight', note: 'Needs a night at the SPORTS tent camp; not in this budget plan', source: 'samudram',
  }),
  exp('lavaDance', 'Lava dance', 'dance', ['Minicoy'], 'Minicoy’s drum dance · on request', { source: 'samudram', note: 'Kalpeni shows a folk dance on the Samudram day' }),
  exp('tuna', 'Malabar-style tuna dinner', 'meal', ['Agatti', 'Kavaratti', 'Minicoy'], 'Mas tuna, fish curry · at dinner', { on: true, slots: 0, source: 'agattiEats', note: 'Inside the meal budget; no extra cost' }),
];
