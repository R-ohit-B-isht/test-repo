// Trip constants. Day 1 is the morning you land (the Delhi flight leaves the night
// before). Change `start` and checklist deadlines / day labels recompute; the fares
// in prices.js were searched for these exact dates, so re-check them if you move it.

export const TRIP = {
  title: 'Vietnam, middle then north',
  subtitle: 'Eight days, 24–31 Oct. Delhi return. Cheaper than the ₹40k quote.',
  start: '2026-10-24',
  days: 8,
  origin: 'Delhi (DEL)',
  quotedRoundTrip: 40000,
  observedWindow: 'Google Flights fares for 23–31 Oct 2026, checked 7 Sep',
};

// Mid-market rates observed on xe.com, Sep 2026. Used to convert sourced
// VND / USD prices into rupees. Cards and ATMs will be a few % worse.
export const FX = {
  vndPerInr: 276,
  inrPerUsd: 95.7,
};

export const inrFromVnd = (vnd) => Math.round(vnd / FX.vndPerInr);
export const inrFromUsd = (usd) => Math.round(usd * FX.inrPerUsd);

export const STOPS = [
  { id: 'hanoi', name: 'Hanoi', region: 'north', photo: 'hanoi' },
  { id: 'ninhbinh', name: 'Ninh Binh', region: 'north', photo: 'ninhbinh' },
  { id: 'halong', name: 'Ha Long Bay', region: 'north', photo: 'halong' },
  { id: 'hue', name: 'Hue', region: 'central', photo: 'hue' },
  { id: 'danang', name: 'Da Nang', region: 'central', photo: 'danang' },
  { id: 'hoian', name: 'Hoi An', region: 'central', photo: 'hoian' },
];

// Late-October climate, per the weather sources in sources.js.
export const WEATHER = {
  north: { icon: 'sun', label: 'North', temp: '23–30°', rain: '158 mm', note: 'Best month of the year', source: 'hanoiclimate' },
  central: { icon: 'rain', label: 'Central', temp: '23–29°', rain: '300–400 mm', note: 'Typhoon window · 20+ wet days', source: 'typhoon' },
};

export const CREDITS = [
  { name: 'Citymapper', took: 'Route alternatives as identical comparison units with inline mode chips' },
  { name: 'Wise', took: 'Calculator card as the hero object; the number is the headline' },
  { name: 'Airbnb', took: 'Horizontal photo shelves, category chips, repeated card metadata' },
  { name: 'Skyscanner / KAYAK', took: 'Segmented travel modes, icon-led tiles, single warm action colour' },
  { name: 'Tripadvisor', took: 'Photo-led trip hero with title overlay' },
  { name: 'trivago', took: 'Trust indicator (source, date) sitting next to every price' },
  { name: 'Screenroom', took: 'Design brief, measured tokens, wave-field pattern, markup audit' },
];
