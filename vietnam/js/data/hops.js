// Every intercity hop with the ways to do it (Rome2Rio / 12Go, but only the
// options that fit this trip's dates). `state.hops[hop.id]` holds your choice
// per hop; strategies.js turns the choice into the budget leg and days.js fixed
// slots re-label through `hopSlot`. Hops marked `info` are covered by a tour
// pickup when that tour is on, so they compare but do not change the budget.
//   min: door-to-door minutes · price: PRICES key (null = included) · fx: what
//   the day's fixed slot says when this option is chosen · links: book.js keys.

const way = (id, mode, name, min, price, note, extra = {}) => ({ id, mode, name, min, price, note, ...extra });

export const HOPS = [
  {
    id: 'dadHoian', day: 1, from: 'Da Nang ✈', to: 'Hoi An', km: 27, slot: 'am',
    ways: [
      way('shuttle', 'bus', 'Hoi An Express shuttle', 60, 'shuttleHoiAn', 'shared van · hostel drop · book the 11:30', {
        fx: { text: 'Land Da Nang 10:50 · shared shuttle to Hoi An', at: '10:50', till: '12:45' }, links: ['hoianExpress'],
      }),
      way('grab', 'car', 'GrabCar', 45, 'grabAirportHoiAn', 'per car · no waiting for the van', {
        fx: { text: 'Land Da Nang 10:50 · GrabCar straight to Hoi An', at: '10:50', till: '12:15' }, links: ['grabPrices'],
      }),
      way('yellow', 'bus', 'Yellow bus #1', 100, 'yellowBus', 'GrabBike to the bus stop first · slow, cheap', {
        fx: { text: 'Land Da Nang 10:50 · yellow bus #1 to Hoi An', at: '10:50', till: '13:15' }, links: ['danangHoian'],
      }),
    ],
  },
  {
    id: 'dadHue', day: 3, from: 'Da Nang', to: 'Hue', km: 100, slot: 'pm',
    ways: [
      way('train', 'train', 'SE2 train', 157, 'trainDadHue', '12:46 → 15:23 · sit left for the Hai Van coast', {
        fx: { icon: 'train', text: 'SE2 12:46 → Hue 15:23 · left-side seats for the Hai Van coast', at: '12:46', till: '15:23' },
        links: ['dsvn', '12go:da-nang/hue', 'baolau'],
      }),
      way('bus', 'bus', 'Limousine van', 150, 'busDadHue', 'hourly · hotel pickup both ends · tunnel, no views', {
        fx: { icon: 'bus', text: 'Limousine van ~13:00 → Hue ~15:30 · pickup at the Da Nang office', at: '13:00', till: '15:30' },
        links: ['12go:da-nang/hue', 'impressBus'],
      }),
      way('car', 'car', 'Private car over the pass', 180, 'carDadHue', 'per car · stops at Hai Van gate + Lang Co', {
        fx: { icon: 'car', text: 'Private car 12:30 → Hue ~15:30 · Hai Van pass + Lang Co stop', at: '12:30', till: '15:30' },
        links: ['minhVuCar'],
      }),
    ],
  },
  {
    id: 'hueHan', day: 4, from: 'Hue', to: 'Hanoi', km: 660, strategy: true,
    ways: [
      way('train', 'train', 'SE20 sleeper', 865, 'train6', '21:30 → 11:55 · a bed, not a hotel', { berth: { 4: 'train4', 6: 'train6' }, links: ['dsvn', '12go:hue/hanoi', 'baolau'] }),
      way('bus', 'bus', 'Sleeper bus', 720, 'busHueHan', '~18:00 hostel pickup · arrives before dawn', { links: ['vexere:hue/hanoi', '12go:hue/hanoi', 'baolau'] }),
      way('fly', 'plane', 'VietJet HUI → HAN', 240, 'hueHan', '75 min in the air · ~4 h door to door · +1 hotel night', { links: ['flight:hueHan'] }),
    ],
  },
  {
    id: 'hanNinhbinh', day: 6, from: 'Hanoi', to: 'Ninh Binh', km: 95, info: 'ninhbinhTour',
    ways: [
      way('tour', 'bus', 'Day tour pickup', 150, null, 'in the tour price · 07:30 Old Quarter pickup', { links: ['ninhbinhTour'] }),
      way('limo', 'bus', 'Limousine van', 150, 'limoNinhBinh', 'hourly 07:00–17:00 · hotel pickup · DIY day', { links: ['12go:hanoi/ninh-binh'] }),
      way('train', 'train', 'SE train', 130, 'trainNinhBinh', '~06:00 / 09:00 from Ga Hanoi · Tam Coc is 7 km more', { links: ['dsvn', '12go:hanoi/ninh-binh', 'baolau'] }),
    ],
  },
  {
    id: 'hanHalong', day: 7, from: 'Hanoi', to: 'Ha Long', km: 160, info: 'halongDay',
    ways: [
      way('cruise', 'bus', 'Cruise shuttle', 150, null, 'in the US$46 cruise price · 08:20 Old Quarter pickup', { links: ['halongDay'] }),
      way('limo', 'bus', 'Limousine van', 165, 'limoHalong', 'hourly · 5B expressway · buy the US$40 pier ticket', { links: ['12go:hanoi/ha-long'] }),
    ],
  },
  {
    id: 'hanAirport', day: 8, from: 'Old Quarter', to: 'Noi Bai ✈', km: 28, slot: 'pm',
    ways: [
      way('bus86', 'bus', 'Bus 86', 60, 'bus86', 'every 25–30 min from Long Bien · bags fine', {
        fx: { icon: 'bus', text: 'Bus 86 from Long Bien by 15:30 · 45,000 ₫ · HAN by 16:30', at: '15:30', till: '16:30' }, links: ['bus86'],
      }),
      way('grab', 'car', 'GrabCar', 50, 'grabHanAirport', 'per car · door to terminal · surge in rain', {
        fx: { icon: 'car', text: 'GrabCar from the hostel 15:45 · tolls included · HAN by 16:35', at: '15:45', till: '16:35' }, links: ['threelandAirport'],
      }),
    ],
  },
];

export const findHop = (id) => HOPS.find((h) => h.id === id);

// Your way for a hop: the saved choice, else the first (what the plan assumes).
export const wayOf = (hop, hops = {}) => hop.ways.find((w) => w.id === hops?.[hop.id]) || hop.ways[0];

// Fixed-slot override for a day slot when a non-default way is chosen.
export const hopSlot = (hopId, hops) => {
  const hop = findHop(hopId);
  const w = hop && wayOf(hop, hops);
  return w?.fx || null;
};

// The PRICES entry a way costs for this state (berth choice for the sleeper).
export const wayPrice = (w, P, state) => (w.price ? P[w.berth?.[state.berth] || w.price] : null);

// Rupees per person for a way, split by the group where per car; null when included.
export const wayInr = (w, P, state) => {
  const pr = wayPrice(w, P, state);
  if (!pr) return null;
  return pr.perGroup ? Math.ceil(pr.amount / Math.max(1, state.travellers)) : pr.amount;
};

export const hhmm = (min) => (min >= 60 ? `${Math.floor(min / 60)} h${min % 60 ? ` ${String(min % 60).padStart(2, '0')}` : ''}` : `${min} min`);
