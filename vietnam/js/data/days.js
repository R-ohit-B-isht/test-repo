// Eight days, middle → north. Each day has three slots — AM / PM / Night — and
// each slot is either fixed transit (`fx`) or an open window the planner fills
// from the switched-on activities (plan.js): `stops` lists which places are in
// reach that slot, first is preferred; `h` is the hours available (default
// am 4 · pm 5 · night 3); `lead` is a line shown before the picks.
// Anything that differs by route transit ('train' | 'bus' | 'fly') is an object
// keyed by transit. Meal / stay `vnd` and `usd` are sourced list prices; `src`
// keys SOURCES. `tips` are transport / timing notes, not activities.

const fx = (icon, text) => ({ fixed: true, icon, text });
const open = (stops, extra = {}) => ({ stops, ...extra });
const meal = (name, dish, vnd, src) => ({ name, dish, vnd, src });
const stay = (name, area, usd, src) => ({ name, area, usd, src });

const hoianBed = stay('SacLo Villa & Hostel', 'dorm · 10 min walk to the Ancient Town', 7, 'hwHoian');
const hueBed = stay('Hue Imperial Hostel', 'dorm · Pham Ngu Lao strip', 5, 'hwHue');
const hanoiBed = stay('Nexy Hostel', 'dorm · Old Quarter', 6, 'hwHanoi');

export const SLOT_HOURS = { am: 4, pm: 5, night: 3 };
export const SLOTS = ['am', 'pm', 'night'];
export const SLOT_LABEL = { am: 'AM', pm: 'PM', night: 'Night' };

export const DAYS = [
  {
    n: 1, stop: 'hoian', photo: 'hoian', title: 'Land. Lanterns.', weather: 'central',
    slots: {
      am: fx('plane', 'Land Da Nang 10:50 · shared shuttle to Hoi An'),
      pm: open(['hoian'], { h: 4, lead: 'Check in ~13:30' }),
      night: open(['hoian']),
    },
    meals: [
      meal('On board or at KUL', 'AirAsia sells food on board · klia2 food court on the layover', null, null),
      meal('Central Market food court', 'cao lầu · white rose dumplings', 45000, 'hoianFood'),
      meal('Cơm Gà Bà Buội', '22 Phan Chu Trinh · cơm gà xé', 55000, 'hoianEats'),
    ],
    sleep: hoianBed,
    tips: ['Fuse Old Town Hoi An · dorm US$9.28', 'Shuttle US$6 · Grab ~350,000 ₫'],
  },
  {
    n: 2, stop: 'hoian', photo: 'golden', title: 'Hands in the clouds.', weather: 'central',
    slots: {
      am: open(['hoian', 'danang']),
      pm: open(['hoian', 'danang']),
      night: open(['hoian', 'danang']),
    },
    meals: [
      meal('Cao Lầu Thanh', '26 Thái Phiên · opens 06:30', 40000, 'hoianEats'),
      meal('Madam Khanh', 'the bánh mì queen · 115 Trần Cao Vân', 40000, 'hoianFood'),
      meal('Bánh Mì Phượng', '2B Phan Chu Trinh · sit-down or take-away', 40000, 'hoianFood'),
    ],
    sleep: hoianBed,
    tips: ['Da Nang is 30 km · Grab ~300,000 ₫ each way', 'Rain day: tailor fitting, café hopping'],
  },
  {
    n: 3, stop: 'danang', where: 'Da Nang → Hue', photo: 'haivan', title: 'Marble Mountains. Hai Van by rail.', weather: 'central',
    slots: {
      am: open(['danang'], { lead: 'Grab out of Hoi An at 07:00' }),
      pm: fx('train', 'SE2 12:46 → Hue 15:23 · left-side seats for the Hai Van coast'),
      night: open(['hue']),
    },
    meals: [
      meal('Bánh Mì Phượng, to go', 'buy it before the 07:00 Grab', 40000, 'hoianFood'),
      meal('Mì Quảng 1A', '1A Hải Phòng · 5 min from Da Nang station', 50000, 'danangFood'),
      meal('Quán Hạnh', '11–15 Phó Đức Chính · set of five Hue dishes', 120000, 'hueHanh'),
    ],
    sleep: hueBed,
    tips: ['Yellow bus #1 instead of Grab · 30,000 ₫, slower', 'Bags: leave at the hostel, collect on the way to the station'],
  },
  {
    n: 4, stop: 'hue', where: { train: 'Hue → sleeper', bus: 'Hue → night bus', fly: 'Hue → Hanoi' }, photo: 'hue', title: 'Hue. Then north overnight.', weather: 'central',
    slots: {
      am: open(['hue']),
      pm: open(['hue'], { h: { train: 5, bus: 4, fly: 2 }, lead: { fly: 'Be at HUI by 14:30' } }),
      night: {
        train: fx('train', 'SE20 21:30 → Hanoi 11:55 · lower berth'),
        bus: fx('bus', 'Sleeper bus ~18:00 · hostel pickup · ~12 h'),
        fly: open(['hanoi'], { h: 2, lead: 'VietJet 15:55 → HAN 17:10 · Old Quarter by 19:00' }),
      },
    },
    meals: [
      meal('Bún Bò Huế Bà Tuyết', 'the city\u2019s own noodle soup', 40000, 'hueFood'),
      meal('Lạc Thiện', 'bánh khoái · the deaf family\u2019s place by the citadel', 60000, 'hueFood'),
      { train: meal('Bánh Bèo Bà Đỏ', 'steamed rice cakes · early, before the train', 25000, 'hueFood'), bus: meal('Bánh Bèo Bà Đỏ', 'steamed rice cakes · before pickup', 25000, 'hueFood'), fly: meal('Bún Chả Đắc Kim', '1 Hàng Mành, Hanoi · set', 70000, 'hanoiEats') },
    ],
    sleep: { train: stay('SE20 sleeper', 'lower berth, even-numbered car', null, 'vnTrainHueHan'), bus: stay('Sleeper bus bunk', 'cabin bus if you are tall', null, 'vexereBus'), fly: hanoiBed },
    tips: ['Citadel + 2 tombs combo 420,000 ₫ if you take both tombs', 'Tombs are 6–10 km south · GrabBike ~40,000 ₫ a hop'],
  },
  {
    n: 5, stop: 'hanoi', photo: 'hanoi', title: 'Hanoi Old Quarter.', weather: 'north',
    slots: {
      am: open(['hanoi'], { h: { train: 1.5, bus: 3, fly: 4 }, lead: { train: 'Arrive 11:55 · drop bags', bus: 'Arrive before dawn · nap first', fly: 'Slow morning' } }),
      pm: open(['hanoi']),
      night: open(['hanoi']),
    },
    meals: [
      { train: meal('On the SE20', 'pack bánh bèo or bánh mì in Hue', null, null), bus: meal('Xôi Yến', '35B Nguyễn Hữu Huân · open from 05:00', 35000, 'hanoiEats'), fly: meal('Xôi Yến', '35B Nguyễn Hữu Huân · xôi xéo', 35000, 'hanoiEats') },
      meal('Bún Chả Hương Liên', '24 Lê Văn Hưu · the Obama combo', 70000, 'hanoiFood'),
      meal('Phở 10 Lý Quốc Sư', '10 Lý Quốc Sư · open late', 70000, 'hanoiFood'),
    ],
    sleep: hanoiBed,
    tips: ['Mad Monkey Hanoi · dorm US$6.84', 'Weekend: Hoan Kiem streets go car-free Fri–Sun night'],
  },
  {
    n: 6, stop: 'ninhbinh', photo: 'ninhbinh', title: 'Ninh Binh day.', weather: 'north',
    slots: {
      am: open(['ninhbinh', 'halong', 'hanoi']),
      pm: open(['ninhbinh', 'halong', 'hanoi']),
      night: open(['hanoi'], { lead: 'Back in Hanoi ~19:00' }),
    },
    meals: [
      meal('Bánh Mì 25', '25 Hàng Cá · before pickup', 20000, 'hanoiFood'),
      meal('Tour buffet lunch', 'included in the day tour', null, 'ninhbinhTour'),
      meal('Bún Chả Đắc Kim', '1 Hàng Mành · Michelin-listed set', 70000, 'hanoiEats'),
    ],
    sleep: hanoiBed,
    tips: ['07:30 hostel pickup', 'DIY instead: limousine van to Ninh Binh, rent a bike, pay entries yourself'],
  },
  {
    n: 7, stop: 'halong', photo: 'halong', title: 'Ha Long Bay.', weather: 'north',
    slots: {
      am: open(['halong', 'ninhbinh', 'hanoi']),
      pm: open(['halong', 'ninhbinh', 'hanoi']),
      night: open(['hanoi'], { lead: 'Back in Hanoi ~20:30' }),
    },
    meals: [
      meal('Phở Gia Truyền Bát Đàn', '49 Bát Đàn · opens 06:00, queue, cash', 50000, 'hanoiFood'),
      meal('Seafood lunch on board', 'included in the cruise', null, 'halongDay'),
      meal('Xôi Yến', '35B Nguyễn Hữu Huân · open till 01:00', 35000, 'hanoiEats'),
    ],
    sleep: hanoiBed,
    tips: ['08:20 shuttle · 2.5 h to Tuan Chau · board at noon', 'Cruise prices swing with the weather forecast — book 2–3 days out'],
  },
  {
    n: 8, stop: 'hanoi', photo: 'train', title: 'Last lap. Home.', weather: 'north',
    slots: {
      am: open(['hanoi']),
      pm: fx('bus', 'Bus 86 from Long Bien by 15:30 · 45,000 ₫ · HAN by 16:30'),
      night: fx('plane', 'VietJet 19:10 → Delhi 22:50'),
    },
    meals: [
      meal('Café Giảng', '39 Nguyễn Hữu Huân · egg coffee + bánh mì next door', 35000, 'hanoiFood'),
      meal('Bánh Mì 25', '25 Hàng Cá · eat in, or pack for the airport', 20000, 'hanoiFood'),
      meal('At HAN or on board', 'VietJet sells hot meals · not included', null, null),
    ],
    sleep: stay('Your bed', 'Delhi, 22:50', null, null),
    tips: ['Check out by 12:00, leave bags at the hostel', 'Lotte observation deck · pricey, skip'],
  },
];

const TRANSITS = ['train', 'bus', 'fly'];
const pick = (v, transit) => (v && typeof v === 'object' && TRANSITS.some((t) => t in v) ? v[transit] : v);

export const sleepFor = (day, transit) => pick(day.sleep, transit);
export const mealsFor = (day, transit) => day.meals.map((m) => pick(m, transit));
export const whereFor = (day, transit) => pick(day.where, transit);

// One slot, resolved for a transit: { fixed, icon, text } or { stops, h, lead }.
export const slotFor = (day, key, transit) => {
  const s = pick(day.slots[key], transit);
  if (s.fixed) return { ...s, text: pick(s.text, transit) };
  return { stops: s.stops, h: pick(s.h, transit) ?? SLOT_HOURS[key], lead: pick(s.lead, transit) || '' };
};
