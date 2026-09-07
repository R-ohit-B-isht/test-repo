import { inrFromVnd, inrFromUsd } from './trip.js';

// Everything you could do, one record each. The planner packs the switched-on
// ones into the day cards (plan.js); the rest sit under "Nearby" for that stop.
//   stop   where it is (STOPS id, or an off-route stop from EXTRA_STOPS)
//   slot   'am' | 'pm' | 'night' | 'any' (am or pm) | 'day' (needs am + pm)
//   h      hours it takes — a slot holds ~4 h (am) / 5 h (pm) / 3 h (night)
//   vnd|usd  listed adult price; `per: 'group'` when it is per boat / per car
//   food   spend that already sits in the food-per-day dial (drinks, coffee)
//   on     switched on when you first open the planner
//   includes  ids covered by this ticket (a day tour) — they show as "in tour"
//   closed   not open in Oct 2026 — shown, struck through, never packed
//   spans    consecutive days it occupies (overnight cruise)
//   src    SOURCES key for the price

const a = (id, stop, slot, h, name, extra = {}) => ({ id, stop, slot, h, name, icon: 'ticket', ...extra });

export const ACTIVITIES = [
  // ── Hoi An ────────────────────────────────────────────────────────────────
  a('hoianOldTown', 'hoian', 'any', 3, 'Ancient Town on foot', { note: 'riverside · Japanese Bridge · tailor streets', free: true, on: true, icon: 'walk', src: 'hoianTicket' }),
  a('hoianTicket', 'hoian', 'am', 3, 'Old Town heritage ticket', { note: 'Tan Ky house · Fujian hall · 5 sites', vnd: 120000, on: true, src: 'hoianTicket' }),
  a('hoianNightMarket', 'hoian', 'night', 2, 'Night lantern market', { note: 'Nguyen Hoang street · lanterns on the Thu Bon', free: true, on: true, icon: 'lantern', src: 'hoianBoat' }),
  a('anBang', 'hoian', 'pm', 3, 'Cycle to An Bang beach', { note: '4 km · swim if the sea is flat', free: true, on: true, icon: 'bike' }),
  a('hoianBoat', 'hoian', 'night', 1, 'Lantern boat on the Hoai', { note: 'yellow ticket, 1–3 people per boat', vnd: 150000, per: 'group', on: true, range: '150,000 ₫ (1–3) · 200,000 ₫ (4–5) per boat', icon: 'boat', src: 'hoianBoat' }),
  a('bayMau', 'hoian', 'pm', 2, 'Bay Mau coconut-basket boat', { note: 'Cam Thanh · entrance + boat', vnd: 100000, icon: 'boat', src: 'bayMau' }),
  a('mySon', 'hoian', 'am', 5, 'My Son Sanctuary', { note: 'Cham ruins · 40 km · sunrise tours return by noon', vnd: 150000, range: '150,000 ₫ entry · transport extra', src: 'mySon' }),
  a('tailor', 'hoian', 'any', 2, 'Custom tailor fitting', { note: 'measure day 1, collect day 2', usd: 120, range: 'suits US$120–200 (budget) · US$250–400 (mid)', icon: 'sparkle', src: 'tailor' }),
  a('hoianMemories', 'hoian', 'night', 1.5, 'Hoi An Memories show', { note: 'outdoor stage on the river · closed Tue', vnd: 600000, range: 'Eco 600,000 ₫ · High 750,000 ₫', icon: 'sparkle', src: 'hoianMemories' }),
  a('vinNamHoian', 'hoian', 'day', 8, 'VinWonders Nam Hoi An', { note: 'theme park + river safari · 17 km', vnd: 650000, range: '650,000 ₫ · 450,000 ₫ after 14:00', tag: 'park', src: 'vinNamHoian' }),

  // ── Da Nang ───────────────────────────────────────────────────────────────
  a('marble', 'danang', 'am', 3, 'Marble Mountains', { note: 'Huyen Khong cave · pagodas · Am Phu cave', vnd: 40000, on: true, range: '40,000 ₫ · lift 15,000 ₫ each way · Am Phu +20,000 ₫', src: 'marbleMountains' }),
  a('myKhe', 'danang', 'any', 2, 'My Khe beach', { note: 'long sand, surf schools', free: true, icon: 'sun' }),
  a('dragonBridge', 'danang', 'night', 2, 'Dragon Bridge fire show', { note: 'Fri–Sun 21:00 · Sun 25 Oct fits · Grab from Hoi An', free: true, icon: 'sparkle', src: 'dragonBridge' }),
  a('sonTra', 'danang', 'any', 4, 'Son Tra peninsula', { note: 'Linh Ung pagoda · monkeys · rent a bike', vnd: 150000, range: 'no entry fee · motorbike 150,000 ₫/day + fuel', icon: 'moto', src: 'sonTra' }),
  a('banaHills', 'danang', 'day', 9, 'Sun World Ba Na Hills', { note: 'Golden Bridge · cable car · French village', vnd: 1000000, range: '1,000,000 ₫ non-resident adult', tag: 'park', src: 'banaHills' }),
  a('asiaPark', 'danang', 'night', 3, 'Da Nang Downtown (Asia Park)', { closed: 'closed since Sep 2025 · reopens late 2026', tag: 'park', src: 'asiaPark' }),

  // ── Hue ───────────────────────────────────────────────────────────────────
  a('hueCitadel', 'hue', 'am', 3, 'Imperial City', { note: 'Ngo Mon gate · Thai Hoa palace · Forbidden Purple City', vnd: 200000, on: true, src: 'hueCitadel' }),
  a('thienMu', 'hue', 'pm', 1.5, 'Thien Mu pagoda', { note: 'seven storeys over the river', free: true, on: true, icon: 'walk' }),
  a('tuDuc', 'hue', 'pm', 2, 'Tu Duc tomb', { note: 'lakes and pavilions · GrabBike', vnd: 150000, src: 'hueTombs' }),
  a('khaiDinh', 'hue', 'pm', 2, 'Khai Dinh tomb', { note: 'concrete, mosaics, 127 steps', vnd: 150000, src: 'khaiDinh' }),
  a('hueWalk', 'hue', 'night', 1.5, 'Perfume River walk', { note: 'Truong Tien bridge lights', free: true, on: true, icon: 'walk' }),
  a('perfumeRiver', 'hue', 'night', 1, 'Dragon boat on the Perfume River', { note: 'per boat · split it', vnd: 300000, per: 'group', range: '300,000 ₫ first hour per boat', icon: 'boat', src: 'perfumeRiver' }),
  a('hoThuyTien', 'hue', 'any', 2.5, 'Ho Thuy Tien abandoned water park', { note: 'the dragon · 8 km south · informal fee', vnd: 30000, range: '20,000–50,000 ₫ to the guards', icon: 'moto', src: 'hoThuyTien' }),
  a('dongBa', 'hue', 'any', 1, 'Dong Ba market', { note: 'cơm hến 10,000–15,000 ₫', free: true, icon: 'bowl', src: 'hueFood' }),

  // ── Hanoi ─────────────────────────────────────────────────────────────────
  a('hoanKiem', 'hanoi', 'any', 1.5, 'Hoan Kiem lake & Ngoc Son temple', { note: 'the red bridge · turtle tower', vnd: 50000, on: true, icon: 'walk', src: 'hanoiSights' }),
  a('oldQuarter', 'hanoi', 'any', 2, 'Old Quarter guild streets', { note: 'Hang Ma · Hang Gai · Long Bien bridge', free: true, on: true, icon: 'walk' }),
  a('trainStreet', 'hanoi', 'pm', 1, 'Train Street café', { note: 'Le Duan is free · Phung Hung wants a drink', vnd: 75000, food: true, on: true, range: 'one drink 50,000–100,000 ₫', icon: 'train', src: 'trainStreet' }),
  a('beerStreet', 'hanoi', 'night', 2, 'Beer Street · Ta Hien', { note: 'plastic stools, bia hơi', vnd: 60000, food: true, on: true, icon: 'moon', src: 'hanoiFood' }),
  a('waterPuppets', 'hanoi', 'night', 1, 'Thang Long water puppets', { note: '57B Dinh Tien Hoang · 50 min · book ahead', vnd: 150000, on: true, range: '100,000–200,000 ₫ by seat', icon: 'sparkle', src: 'waterPuppets' }),
  a('literature', 'hanoi', 'am', 1.5, 'Temple of Literature', { note: '08:00 before the tour buses', vnd: 70000, on: true, src: 'hanoiSights' }),
  a('eggCoffee', 'hanoi', 'any', 0.5, 'Egg coffee at Café Giảng', { note: '39 Nguyễn Hữu Huân', vnd: 35000, food: true, on: true, icon: 'bowl', src: 'hanoiFood' }),
  a('hoaLo', 'hanoi', 'any', 1.5, 'Hoa Lo prison', { note: '08:00–17:00 · the "Hanoi Hilton"', vnd: 50000, src: 'hoaLo' }),
  a('ethnology', 'hanoi', 'any', 2, 'Museum of Ethnology', { note: 'stilt houses in the garden · 8 km west', vnd: 40000, src: 'ethnology' }),
  a('longBien', 'hanoi', 'pm', 1, 'Long Bien bridge at sunset', { note: 'walk the rail bridge, 1902', free: true, icon: 'walk' }),
  a('dongXuan', 'hanoi', 'any', 1, 'Dong Xuan market', { note: 'wholesale chaos · snacks round the back', free: true, icon: 'bowl' }),
  a('trangTien', 'hanoi', 'any', 0.5, 'Tràng Tiền ice cream', { note: '35 Tràng Tiền · since 1958', vnd: 15000, food: true, icon: 'bowl', src: 'trangTien' }),
  a('baoSon', 'hanoi', 'day', 7, 'Bảo Sơn Paradise Park', { note: 'zoo + rides + water park · 12 km · closed Mon', vnd: 450000, range: 'summer 450,000 ₫ · off-season 200,000 ₫', tag: 'park', src: 'baoSon' }),

  // ── Ninh Binh (day trip from Hanoi) ──────────────────────────────────────
  a('ninhbinhTour', 'ninhbinh', 'day', 11, 'Ninh Binh day tour', { note: 'Hoa Lu · Mua cave · Tam Coc boat · bikes · lunch', vnd: 1000000, on: true, includes: ['hoaLu', 'muaCave', 'tamCoc'], icon: 'bus', range: '1,000,000 ₫ bus · 1,100,000–1,150,000 ₫ limousine', src: 'ninhbinhTour' }),
  a('tamCoc', 'ninhbinh', 'pm', 2, 'Tam Coc rowing boat', { note: 'three caves · feet-rowers', vnd: 250000, icon: 'boat', src: 'tamCoc' }),
  a('trangAn', 'ninhbinh', 'any', 3, 'Trang An boat', { note: 'longer, quieter than Tam Coc · UNESCO', vnd: 300000, icon: 'boat', src: 'trangAn' }),
  a('muaCave', 'ninhbinh', 'any', 1.5, 'Mua cave peak', { note: '500 steps · the dragon view', vnd: 150000, icon: 'walk', src: 'muaCave' }),
  a('hoaLu', 'ninhbinh', 'any', 1, 'Hoa Lu ancient capital', { note: 'two temples, 10th century', vnd: 20000, src: 'hoaLu' }),

  // ── Ha Long (day trip from Hanoi) ────────────────────────────────────────
  a('halongDay', 'halong', 'day', 12, 'Ha Long Bay day cruise', { note: 'Old Quarter shuttle 08:20 · seafood lunch · back ~20:30', usd: 46, on: true, includes: ['sungSot', 'titop', 'kayak'], icon: 'boat', range: 'US$40 at the pier · US$46 with Hanoi shuttle', src: 'halongDay' }),
  a('sungSot', 'halong', 'any', 1.5, 'Sung Sot (Surprise) cave', { note: 'the biggest cave in the bay', icon: 'walk', src: 'halongDay' }),
  a('titop', 'halong', 'any', 1.5, 'Ti Top island', { note: '400 steps · panorama · swim', icon: 'sun', src: 'halongDay' }),
  a('kayak', 'halong', 'any', 1, 'Kayak at Luon cave', { note: 'through the arch into the lagoon', icon: 'boat', src: 'halongDay' }),
  a('halongOvernight', 'halong', 'day', 12, 'Overnight Ha Long cruise', { note: '2 days 1 night · takes the place of Ninh Binh + the day cruise', next: 'Sunrise on the bay · Hanoi ~16:00', usd: 78, spans: 2, includes: ['sungSot', 'titop', 'kayak'], icon: 'moon', range: 'US$78 Garden Bay · US$85–92 better boats', src: 'halongOvernight' }),
  a('sunWorldHalong', 'halong', 'pm', 2, 'Sun World Ha Long · Queen cable car', { note: 'Ba Deo hill + Sun Wheel · Dragon Park closed', vnd: 380000, tag: 'park', range: '380,000 ₫ adult · Dragon Park shut since 16 Aug 2026', src: 'sunWorldHalong' }),

  // ── Off the 8-day route (EXTRA_STOPS) — shown for planning, never packed ──
  a('fansipan', 'sapa', 'am', 4, 'Fansipan cable car', { note: 'Indochina roof · 850,000 ₫ return', vnd: 850000, range: '850,000 ₫ · monorail 200,000 ₫ · funicular 170,000 / 150,000 ₫', src: 'fansipan' }),
  a('catCat', 'sapa', 'pm', 3, 'Cat Cat village', { note: 'Hmong village walk · 07:00–17:30', vnd: 150000, icon: 'walk', src: 'catCat' }),
  a('sapaChurch', 'sapa', 'any', 0.5, 'Sapa stone church', { note: '1895 · town square', free: true, icon: 'walk', src: 'sapaTour' }),
  a('ricePaddies', 'sapa', 'any', 4, 'Muong Hoa terraced paddies', { note: 'late Oct = just harvested · guide optional', free: true, icon: 'walk', src: 'sapaTour' }),
  a('sapaMarket', 'sapa', 'am', 2, 'Minority markets', { note: 'Sapa daily · Bac Ha on Sundays', free: true, icon: 'bowl', src: 'sapaTour' }),
  a('paradiseCave', 'phongnha', 'am', 3, 'Paradise Cave', { note: '1 km boardwalk · buggy 20,000 ₫', vnd: 250000, src: 'phongNhaFees' }),
  a('phongNhaCave', 'phongnha', 'pm', 2.5, 'Phong Nha cave by boat', { note: 'boat 700,000 ₫ per 12 · share it', vnd: 150000, range: '150,000 ₫ + boat 700,000 ₫ per 12', icon: 'boat', src: 'phongNhaFees' }),
  a('darkCave', 'phongnha', 'pm', 3, 'Dark Cave zipline + mud bath', { note: 'full adventure ticket · 08:00–16:00', vnd: 450000, range: '450,000 ₫ adventure · 250,000 ₫ without the cave', icon: 'sparkle', src: 'darkCave' }),
  a('sonDoong', 'phongnha', 'day', 9, 'Hang Son Doong expedition', { closed: 'US$3,000 · 4 days · sold out through 2027', src: 'sonDoong' }),
  a('lanHa', 'catba', 'day', 8, 'Lan Ha Bay from Cat Ba', { note: 'quieter bay · kayak · Viet Hai village', usd: 32, range: 'US$32–35 group tour · 750,000 ₫ luxury boat', icon: 'boat', src: 'lanHa' }),
  a('vinVuYen', 'haiphong', 'day', 8, 'VinWonders Vũ Yên', { note: 'water park · zoo · rides · 2.5 h by train', vnd: 450000, range: '200,000 ₫ one zone · 450,000–520,000 ₫ combo', tag: 'park', src: 'vinVuYen' }),
];

// Places the 8 days cannot reach. `days` = extra days you would need; `how` = the way in.
export const EXTRA_STOPS = [
  { id: 'sapa', name: 'Sapa', days: 2, how: 'Night bus Hanoi ↔ Sapa · 6 h · US$7–19 each way', src: 'sapaBus' },
  { id: 'phongnha', name: 'Phong Nha', days: 2, how: 'Bus Hue → Phong Nha · 4 h · US$8–11, then on north', src: 'phongNhaBus' },
  { id: 'catba', name: 'Cat Ba island', days: 1, how: 'Bus + ferry Hanoi → Cat Ba · sleep a night on the island', src: 'lanHa' },
  { id: 'haiphong', name: 'Hải Phòng', days: 1, how: 'Train Hanoi → Hai Phong · 2.5 h · from 128,000 ₫', src: 'hpTrain' },
];

export const BY_ID = Object.fromEntries(ACTIVITIES.map((x) => [x.id, x]));
export const isExtra = (x) => EXTRA_STOPS.some((s) => s.id === x.stop);

// Rupees per person for one activity, or null when there is nothing to pay
// (free, or covered by a switched-on tour). `travellers` splits per-group prices.
export const activityInr = (x, travellers = 1) => {
  if (x.free || (!x.vnd && !x.usd)) return null;
  const amt = x.vnd ? inrFromVnd(x.vnd) : inrFromUsd(x.usd);
  return x.per === 'group' ? Math.ceil(amt / travellers) : amt;
};

export const DEFAULT_PICKS = Object.fromEntries(ACTIVITIES.filter((x) => x.on).map((x) => [x.id, true]));
