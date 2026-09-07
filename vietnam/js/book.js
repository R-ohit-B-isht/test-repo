import { TRIP, isoOf } from './data/trip.js';
import { DAYS, sleepFor } from './data/days.js';
import { SOURCES } from './data/sources.js';
import { PRICES } from './data/prices.js';
import { findStrategy } from './strategies.js';

// Booking deep-links (Adapter pattern: one small adapter per provider turns a
// plain request — route + date + people — into that provider's URL). Each link
// opens a live search for the exact dates; nothing here is a fare or a seat.
// Providers that ignore query parameters get their honest landing page instead.

const iso = isoOf;
const ddmmyyyy = (d) => d.split('-').reverse().join('-');
const enc = encodeURIComponent;

const IATA = { DEL: 'DEL', DAD: 'DAD', HAN: 'HAN', Hue: 'HUI', Hanoi: 'HAN', 'Da Nang': 'DAD' };
const code = (x) => IATA[x] || x;
const yymmdd = (d) => d.slice(2).replace(/-/g, '');

const FLIGHT = {
  google: (o, d, date, back) => ({ name: 'Google Flights', url: `https://www.google.com/travel/flights?q=${enc(`Flights from ${code(o)} to ${code(d)} on ${date}${back ? ` returning ${back}` : ' one way'}`)}` }),
  skyscanner: (o, d, date, back) => ({ name: 'Skyscanner', url: `https://www.skyscanner.co.in/transport/flights/${code(o).toLowerCase()}/${code(d).toLowerCase()}/${yymmdd(date)}/${back ? `${yymmdd(back)}/` : ''}` }),
};

const STAY = {
  hostelworld: (slug, from, to, guests) => ({ name: 'Hostelworld', url: `https://www.hostelworld.com/hostels/asia/vietnam/${slug}/?from=${from}&to=${to}&guests=${guests}` }),
  booking: (city, from, to, guests) => ({ name: 'Booking.com', url: `https://www.booking.com/searchresults.html?ss=${enc(`${city}, Vietnam`)}&checkin=${from}&checkout=${to}&group_adults=${guests}&no_rooms=1` }),
};

const TICKET = {
  klook: (q) => ({ name: 'Klook', url: `https://www.klook.com/search/result/?query=${enc(q)}` }),
  gyg: (q, date) => ({ name: 'GetYourGuide', url: `https://www.getyourguide.com/s/?q=${enc(q)}${date ? `&date_from=${date}` : ''}` }),
};

const GROUND = {
  twelveGo: (from, to, date, people) => ({ name: '12Go', url: `https://12go.asia/en/travel/${from}/${to}?date=${date}&people=${people}` }),
  dsvn: () => ({ name: 'dsvn.vn · official rail', url: 'https://dsvn.vn/#/' }),
  vexere: (routePath, date) => ({ name: 'Vexere', url: `https://vexere.com/en-US/${routePath}.html?date=${ddmmyyyy(date)}` }),
};

const src = (key) => (SOURCES[key] ? { name: SOURCES[key].name.split(' · ')[0], url: SOURCES[key].url, official: true } : null);

// Contiguous nights at one bed → one stay search per hostel, dates from DAYS.
export const stays = (state) => {
  const transit = findStrategy(state.strategy).transit;
  const runs = [];
  DAYS.forEach((d) => {
    const s = sleepFor(d, transit);
    if (!s.usd) return;
    const last = runs[runs.length - 1];
    if (last && last.name === s.name && last.to === d.n) { last.to = d.n + 1; return; }
    runs.push({ name: s.name, area: s.area, stop: s.stop || d.stop, from: d.n, to: d.n + 1, src: s.src });
  });
  return runs.map((r) => {
    const [slug, city] = SLUG[r.stop] || SLUG.hanoi;
    const from = iso(r.from); const to = iso(r.to);
    return { ...r, city, nights: r.to - r.from, from, to, links: [STAY.hostelworld(slug, from, to, state.travellers), STAY.booking(city, from, to, state.travellers), src(r.src)].filter(Boolean) };
  });
};
const SLUG = { hoian: ['hoi-an', 'Hoi An'], hue: ['hue', 'Hue'], hanoi: ['hanoi', 'Hanoi'], danang: ['da-nang', 'Da Nang'] };

const bedLinks = (state, stops) => stays(state).filter((r) => stops.includes(r.stop))
  .map((r) => ({ ...r.links[0], name: `${r.city} · ${r.links[0].name}` }));

const GROUND_LINKS = {
  'Da Nang→Hue:train': (d, n) => [GROUND.dsvn(), GROUND.twelveGo('da-nang', 'hue', d, n)],
  'Hue→Hanoi:train': (d, n) => [GROUND.dsvn(), GROUND.twelveGo('hue', 'hanoi', d, n)],
  'Hue→Hanoi:bus': (d, n) => [GROUND.vexere('sleeper-bus-ticket-booking-from-hue-thua-thien-hue-to-ha-noi-2647t1241', d), GROUND.twelveGo('hue', 'hanoi', d, n)],
};

// Links for one route leg from strategies.js (`{from, to, mode, price}`):
// flights search both engines for the fare's date, rail / bus legs go to the
// official seller plus 12Go, shuttles and Grab have nothing to pre-book.
export const legLinks = (leg, state) => {
  const { iso: date, isoBack } = leg.price;
  if (!date) return [];
  if (leg.mode === 'plane') return [FLIGHT.google(leg.from, leg.to, date, isoBack), FLIGHT.skyscanner(leg.from, leg.to, date, isoBack)];
  const f = GROUND_LINKS[`${leg.from}→${leg.to}:${leg.mode}`];
  return f ? f(date, state.travellers) : [];
};

// Steps that are not a route leg: the official page plus one marketplace.
const STEP_LINKS = {
  evisa: () => [src('evisa')],
  parks: () => [src('banaHills'), src('vinNamHoian'), TICKET.klook('Ba Na Hills ticket')],
  tours: () => [TICKET.klook('Ninh Binh day tour Hanoi'), TICKET.klook('Ha Long Bay day cruise'), TICKET.gyg('Ha Long Bay cruise', iso(7))],
  esim: () => [src('viettel'), TICKET.klook('Vietnam eSIM')],
  centralBed: (state) => bedLinks(state, ['hoian', 'hue', 'danang']),
  hanoiBed: (state) => bedLinks(state, ['hanoi']),
};

// Links for a checklist step: by the route leg it books, else by its `link` key.
export const stepLinks = (step, state) => {
  if (step.link) return (STEP_LINKS[step.link]?.(state) || []).filter(Boolean);
  if (!step.price) return [];
  const legs = findStrategy(state.strategy).legs(PRICES, state);
  const leg = legs.find((l) => l.price === PRICES[step.price]);
  return leg ? legLinks(leg, state) : [];
};

// Paid activity → ticket searches plus the official page it was priced from.
export const ticketLinks = (x, dayN) => [src(x.src), TICKET.klook(x.q || x.name), TICKET.gyg(x.q || x.name, dayN ? iso(dayN) : null)].filter(Boolean);

export const TRIP_DATES = { start: TRIP.start, end: iso(TRIP.days) };
