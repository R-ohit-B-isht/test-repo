import { inrFromVnd, inrFromUsd } from './trip.js';

// Everything you could do, one record each. The planner packs the switched-on
// ones into the day cards (plan.js); the rest sit under "Nearby" for that stop.
//   stop   where it is (STOPS id, or an off-route stop from EXTRA_STOPS)
//   slot   'am' | 'pm' | 'night' | 'any' (am or pm) | 'day' (needs am + pm)
//   h      hours it takes — a slot holds ~4 h (am) / 5 h (pm) / 3 h (night)
//   vnd|usd  listed adult price; `per: 'group'` when it is per boat / per car
//   food   spend that already sits in the food-per-day dial (drinks, coffee)
//   kind   'fun' (parks, boats, shows, beaches — counts as one of the 3–4 a day)
//          | 'see' (walks, temples, museums, markets — free-floating, never
//          takes a slot; shows as "also see" on the day it belongs to)
//   must   strongly recommended: pre-ticked, packed first, starred — one tap off
//   min    a 'day' pick that can shrink to one slot of `min` hours when no full
//          day is free; `shortNote` is the hint shown then
//   on     switched on when you first open the planner
//   includes  ids covered by this ticket (a day tour) — they show as "in tour"
//   eats   slot whose meal this pick is (a food tour is dinner) — the timeline folds
//          that meal into it instead of scheduling a separate one
//   closed   not open in Oct 2026, or not on our weekday (`closedTag` names it)
//            — shown, struck through, never packed
//   tag    'park' | 'night' — groups for presets and the Brain (theme parks, nightlife)
//   spans    consecutive days it occupies (overnight cruise)
//   src    SOURCES key for the price

const a = (id, stop, slot, h, name, extra = {}) => ({ id, stop, slot, h, name, icon: 'ticket', kind: 'fun', ...extra });
const see = (id, stop, slot, h, name, extra = {}) => a(id, stop, slot, h, name, { kind: 'see', ...extra });
const must = (id, stop, slot, h, name, extra = {}) => a(id, stop, slot, h, name, { must: true, on: true, ...extra });

export const ACTIVITIES = [
  // ── Hoi An ────────────────────────────────────────────────────────────────
  see('hoianOldTown', 'hoian', 'any', 3, 'Ancient Town on foot', { note: 'riverside · Japanese Bridge · tailor streets', free: true, on: true, icon: 'walk', src: 'hoianTicket' }),
  see('hoianTicket', 'hoian', 'am', 3, 'Old Town heritage ticket', { note: 'Tan Ky house · Fujian hall · 5 sites', vnd: 120000, src: 'hoianTicket' }),
  see('hoianNightMarket', 'hoian', 'night', 2, 'Night lantern market', { note: 'Nguyen Hoang street · lanterns on the Thu Bon', free: true, on: true, icon: 'lantern', src: 'hoianBoat' }),
  a('anBang', 'hoian', 'pm', 3, 'Cycle to An Bang beach', { note: '4 km · swim if the sea is flat', free: true, icon: 'bike' }),
  a('hoianBoat', 'hoian', 'night', 1, 'Lantern boat on the Hoai', { note: 'yellow ticket, 1–3 people per boat', vnd: 150000, per: 'group', on: true, range: '150,000 ₫ (1–3) · 200,000 ₫ (4–5) per boat', icon: 'boat', src: 'hoianBoat' }),
  a('bayMau', 'hoian', 'pm', 2, 'Bay Mau coconut-basket boat', { note: 'Cam Thanh · entrance + spinning basket boat', vnd: 100000, icon: 'boat', src: 'bayMau' }),
  see('mySon', 'hoian', 'am', 5, 'My Son Sanctuary', { note: 'Cham ruins · 40 km · sunrise tours return by noon', vnd: 150000, range: '150,000 ₫ entry · transport extra', src: 'mySon' }),
  a('tailor', 'hoian', 'any', 2, 'Custom tailor fitting', { note: 'measure day 1, collect day 2', usd: 120, range: 'suits US$120–200 (budget) · US$250–400 (mid)', icon: 'sparkle', src: 'tailor' }),
  a('hoianMemories', 'hoian', 'night', 1.5, 'Hoi An Memories show', { note: 'outdoor stage on the river · closed Tue', vnd: 600000, at: '20:00', range: 'Eco 600,000 ₫ · High 750,000 ₫', icon: 'sparkle', src: 'hoianMemories' }),
  a('hoianFoodTour', 'hoian', 'night', 3, 'Hoi An evening food tour', { note: '17:00–21:00 · 10+ tastings, this is dinner · folk games · lantern boat included', usd: 39, at: '17:00', eats: 'night', includes: ['hoianBoat'], tag: 'night', icon: 'bowl', src: 'hoianFoodTour' }),
  a('anHoiBars', 'hoian', 'night', 2, 'An Hoi bar strip · Tiger Tiger', { note: '35 Nguyen Phuc Chu · happy hour 19:30–22:00 · DJs till late', vnd: 120000, food: true, range: 'drinks only · beers ~40,000–60,000 ₫ · shisha free for 3+', tag: 'night', icon: 'beer', src: 'tigerTiger' }),
  must('vinNamHoian', 'hoian', 'day', 8, 'VinWonders Nam Hoi An', { note: 'theme park + river safari · 17 km', vnd: 650000, range: '650,000 ₫ · 450,000 ₫ after 14:00', min: 4, shortNote: 'after-14:00 ticket · 450,000 ₫', tag: 'park', src: 'vinNamHoian' }),

  // ── Da Nang ───────────────────────────────────────────────────────────────
  see('marble', 'danang', 'am', 3, 'Marble Mountains', { note: 'Huyen Khong cave · pagodas · Am Phu cave', vnd: 40000, range: '40,000 ₫ · lift 15,000 ₫ each way · Am Phu +20,000 ₫', src: 'marbleMountains' }),
  a('myKhe', 'danang', 'any', 2, 'My Khe beach', { note: 'long sand, surf schools', free: true, on: true, icon: 'sun' }),
  a('dragonBridge', 'danang', 'night', 2, 'Dragon Bridge fire show', { note: 'Fri–Sun 21:00 · Sun 25 Oct fits · Grab from Hoi An', free: true, on: true, at: '20:30', icon: 'sparkle', src: 'dragonBridge' }),
  a('sonTra', 'danang', 'any', 4, 'Son Tra peninsula by motorbike', { note: 'Linh Ung pagoda · monkeys · rent a bike', vnd: 150000, range: 'no entry fee · motorbike 150,000 ₫/day + fuel', icon: 'moto', src: 'sonTra' }),
  must('banaHills', 'danang', 'day', 9, 'Sun World Ba Na Hills', { note: 'Golden Bridge · cable car · French village', vnd: 1000000, at: '07:30', range: '1,000,000 ₫ non-resident adult', tag: 'park', src: 'banaHills' }),
  a('sonTraMarket', 'danang', 'night', 1, 'Son Tra night market', { note: 'Mai Hac De · foot of the Dragon Bridge · till 23:45 · pairs with the fire show', vnd: 100000, food: true, range: 'free entry · seafood plates 50,000–150,000 ₫', tag: 'night', icon: 'bowl', src: 'sonTraMarket' }),
  a('helio', 'danang', 'night', 2, 'Helio night market', { note: '2 Thang 9 street · 17:30–22:30 daily · beer garden + live stage', vnd: 100000, food: true, range: 'free entry · food stalls 30,000–100,000 ₫', tag: 'night', icon: 'lantern', src: 'helio' }),
  a('sky36', 'danang', 'night', 2, 'Sky36 rooftop · Novotel', { note: '36 Bach Dang · 36th floor · DJ from 21:00 · dress up', vnd: 250000, food: true, range: 'one drink ~200,000–300,000 ₫ · cover varies by night · check venue', tag: 'night', icon: 'music', src: 'sky36' }),
  a('anThuong', 'danang', 'night', 2, 'An Thuong bar street', { note: 'behind My Khe beach · craft beer, live music, cheap eats', vnd: 100000, food: true, range: 'drinks only · beers 40,000–80,000 ₫', tag: 'night', icon: 'beer', src: 'anThuong' }),
  a('asiaPark', 'danang', 'night', 3, 'Da Nang Downtown (Asia Park)', { closed: 'closed since Sep 2025 · reopens late 2026', tag: 'park', src: 'asiaPark' }),

  // ── Hue ───────────────────────────────────────────────────────────────────
  see('hueCitadel', 'hue', 'am', 3, 'Imperial City', { note: 'Ngo Mon gate · Thai Hoa palace · Forbidden Purple City', vnd: 200000, src: 'hueCitadel' }),
  see('thienMu', 'hue', 'pm', 1.5, 'Thien Mu pagoda', { note: 'seven storeys over the river', free: true, on: true, icon: 'walk' }),
  see('tuDuc', 'hue', 'pm', 2, 'Tu Duc tomb', { note: 'lakes and pavilions · GrabBike', vnd: 150000, src: 'hueTombs' }),
  see('khaiDinh', 'hue', 'pm', 2, 'Khai Dinh tomb', { note: 'concrete, mosaics, 127 steps', vnd: 150000, src: 'khaiDinh' }),
  see('hueWalk', 'hue', 'night', 1.5, 'Perfume River walk', { note: 'Truong Tien bridge lights', free: true, on: true, icon: 'walk' }),
  a('perfumeRiver', 'hue', 'night', 1, 'Dragon boat on the Perfume River', { note: 'per boat · split it', vnd: 300000, per: 'group', on: true, range: '300,000 ₫ first hour per boat', icon: 'boat', src: 'perfumeRiver' }),
  a('dmzBar', 'hue', 'night', 2, 'DMZ Bar · Le Loi', { note: '60 Le Loi · Hue’s first bar, 1994 · acoustic / DJ nights · till 24:00', vnd: 120000, food: true, range: 'drinks + snacks · pizzas 189,000 ₫', tag: 'night', icon: 'beer', src: 'dmzBar' }),
  see('hueWalkingStreet', 'hue', 'night', 2, 'Hue night walking street', { note: 'Pham Ngu Lao · Chu Van An · Vo Thi Sau', free: true, closed: 'Fri–Sun only · our Hue night is Tue 27 Oct', closedTag: 'wrong day', tag: 'night', icon: 'lantern', src: 'hueWalkingStreet' }),
  a('hoThuyTien', 'hue', 'any', 2.5, 'Ho Thuy Tien abandoned water park', { note: 'the dragon · 8 km south · informal fee', vnd: 30000, on: true, range: '20,000–50,000 ₫ to the guards', icon: 'moto', src: 'hoThuyTien' }),
  see('dongBa', 'hue', 'any', 1, 'Dong Ba market', { note: 'cơm hến 10,000–15,000 ₫', free: true, icon: 'bowl', src: 'hueFood' }),

  // ── Hanoi ─────────────────────────────────────────────────────────────────
  see('hoanKiem', 'hanoi', 'any', 1.5, 'Hoan Kiem lake & Ngoc Son temple', { note: 'the red bridge · turtle tower', vnd: 50000, icon: 'walk', src: 'hanoiSights' }),
  see('oldQuarter', 'hanoi', 'any', 2, 'Old Quarter guild streets', { note: 'Hang Ma · Hang Gai · Long Bien bridge', free: true, on: true, icon: 'walk' }),
  see('trainStreet', 'hanoi', 'pm', 1, 'Train Street café', { note: 'Le Duan is free · Phung Hung wants a drink', vnd: 75000, food: true, on: true, range: 'one drink 50,000–100,000 ₫', icon: 'train', src: 'trainStreet' }),
  a('beerStreet', 'hanoi', 'night', 2, 'Beer Street · Ta Hien', { note: 'plastic stools · bia hơi 10,000–20,000 ₫ a glass · go 18:00–21:00', vnd: 60000, food: true, on: true, range: 'three glasses + snacks · cocktails 80,000–120,000 ₫', tag: 'night', icon: 'beer', src: 'taHien' }),
  a('hanoiFoodWalk', 'hanoi', 'night', 3, 'Old Quarter street-food walk', { note: '18:00 from O Quan Chuong gate · 8 dishes + egg coffee + bia hơi · this is dinner', usd: 28, at: '18:00', eats: 'night', tag: 'night', icon: 'bowl', src: 'hanoiFoodWalk' }),
  a('minhJazz', 'hanoi', 'night', 2.25, 'Binh Minh Jazz Club', { note: '1A Trang Tien, behind the Opera House · live sets 21:00–23:15 nightly', vnd: 150000, at: '21:00', range: 'cover 100,000–150,000 ₫ weekends · beer from 80,000 ₫', tag: 'night', icon: 'music', src: 'minhJazz' }),
  see('hanoiNightMarket', 'hanoi', 'night', 1.5, 'Weekend night market · Hang Dao', { note: 'Fri–Sun 18:00–24:00 · Hang Dao → Dong Xuan · fits Fri 30 after Ha Long', free: true, tag: 'night', icon: 'lantern', src: 'hanoiNightMarket' }),
  a('waterPuppets', 'hanoi', 'night', 1, 'Thang Long water puppets', { note: '57B Dinh Tien Hoang · 50 min · book ahead', vnd: 150000, on: true, at: '20:00', range: '100,000–200,000 ₫ by seat', icon: 'sparkle', src: 'waterPuppets' }),
  see('literature', 'hanoi', 'am', 1.5, 'Temple of Literature', { note: '08:00 before the tour buses', vnd: 70000, src: 'hanoiSights' }),
  see('eggCoffee', 'hanoi', 'any', 0.5, 'Egg coffee at Café Giảng', { note: '39 Nguyễn Hữu Huân', vnd: 35000, food: true, on: true, icon: 'bowl', src: 'hanoiFood' }),
  see('hoaLo', 'hanoi', 'any', 1.5, 'Hoa Lo prison', { note: '08:00–17:00 · the "Hanoi Hilton"', vnd: 50000, src: 'hoaLo' }),
  see('ethnology', 'hanoi', 'any', 2, 'Museum of Ethnology', { note: 'stilt houses in the garden · 8 km west', vnd: 40000, src: 'ethnology' }),
  see('longBien', 'hanoi', 'pm', 1, 'Long Bien bridge at sunset', { note: 'walk the rail bridge, 1902', free: true, icon: 'walk' }),
  see('dongXuan', 'hanoi', 'any', 1, 'Dong Xuan market', { note: 'wholesale chaos · snacks round the back', free: true, icon: 'bowl' }),
  see('trangTien', 'hanoi', 'any', 0.5, 'Tràng Tiền ice cream', { note: '35 Tràng Tiền · since 1958', vnd: 15000, food: true, icon: 'bowl', src: 'trangTien' }),
  a('baoSon', 'hanoi', 'day', 7, 'Bảo Sơn Paradise Park', { note: 'zoo + rides + water park · 12 km · closed Mon', vnd: 450000, range: 'summer 450,000 ₫ · off-season 200,000 ₫', tag: 'park', src: 'baoSon' }),

  // ── Ninh Binh (day trip from Hanoi) ──────────────────────────────────────
  a('ninhbinhTour', 'ninhbinh', 'day', 11, 'Ninh Binh day tour', { note: 'Hoa Lu · Mua cave · Tam Coc boat · bikes · lunch', vnd: 1000000, on: true, at: '07:30', includes: ['hoaLu', 'muaCave', 'tamCoc'], icon: 'bus', range: '1,000,000 ₫ bus · 1,100,000–1,150,000 ₫ limousine', src: 'ninhbinhTour' }),
  a('tamCoc', 'ninhbinh', 'pm', 2, 'Tam Coc rowing boat', { note: 'three caves · feet-rowers', vnd: 250000, icon: 'boat', src: 'tamCoc' }),
  a('trangAn', 'ninhbinh', 'any', 3, 'Trang An boat', { note: 'longer, quieter than Tam Coc · UNESCO', vnd: 300000, icon: 'boat', src: 'trangAn' }),
  see('muaCave', 'ninhbinh', 'any', 1.5, 'Mua cave peak', { note: '500 steps · the dragon view', vnd: 150000, icon: 'walk', src: 'muaCave' }),
  see('hoaLu', 'ninhbinh', 'any', 1, 'Hoa Lu ancient capital', { note: 'two temples, 10th century', vnd: 20000, src: 'hoaLu' }),

  // ── Ha Long (day trip from Hanoi) ────────────────────────────────────────
  must('halongDay', 'halong', 'day', 12, 'Ha Long Bay day cruise', { note: 'Old Quarter shuttle 08:20 · seafood lunch · back ~20:30', usd: 46, at: '08:20', includes: ['sungSot', 'titop', 'kayak'], icon: 'boat', range: 'US$40 at the pier · US$46 with Hanoi shuttle', src: 'halongDay' }),
  see('sungSot', 'halong', 'any', 1.5, 'Sung Sot (Surprise) cave', { note: 'the biggest cave in the bay', icon: 'walk', src: 'halongDay' }),
  a('titop', 'halong', 'any', 1.5, 'Ti Top island', { note: '400 steps · panorama · swim', icon: 'sun', src: 'halongDay' }),
  a('kayak', 'halong', 'any', 1, 'Kayak at Luon cave', { note: 'through the arch into the lagoon', icon: 'boat', src: 'halongDay' }),
  a('halongOvernight', 'halong', 'day', 12, 'Overnight Ha Long cruise', { note: '2 days 1 night · takes the place of Ninh Binh + the day cruise', next: 'Sunrise on the bay · Hanoi ~16:00', usd: 78, at: '08:20', spans: 2, includes: ['sungSot', 'titop', 'kayak'], icon: 'moon', range: 'US$78 Garden Bay · US$85–92 better boats', src: 'halongOvernight' }),
  a('sunWorldHalong', 'halong', 'pm', 2, 'Sun World Ha Long · Queen cable car', { note: 'Ba Deo hill + Sun Wheel · Dragon Park closed', vnd: 380000, tag: 'park', range: '380,000 ₫ adult · Dragon Park shut since 16 Aug 2026', src: 'sunWorldHalong' }),

  // ── Off the 8-day route (EXTRA_STOPS) — shown for planning, never packed ──
  a('fansipan', 'sapa', 'am', 4, 'Fansipan cable car', { note: 'Indochina roof · 850,000 ₫ return', vnd: 850000, range: '850,000 ₫ · monorail 200,000 ₫ · funicular 170,000 / 150,000 ₫', src: 'fansipan' }),
  see('catCat', 'sapa', 'pm', 3, 'Cat Cat village', { note: 'Hmong village walk · 07:00–17:30', vnd: 150000, icon: 'walk', src: 'catCat' }),
  see('sapaChurch', 'sapa', 'any', 0.5, 'Sapa stone church', { note: '1895 · town square', free: true, icon: 'walk', src: 'sapaTour' }),
  see('ricePaddies', 'sapa', 'any', 4, 'Muong Hoa terraced paddies', { note: 'late Oct = just harvested · guide optional', free: true, icon: 'walk', src: 'sapaTour' }),
  see('sapaMarket', 'sapa', 'am', 2, 'Minority markets', { note: 'Sapa daily · Bac Ha on Sundays', free: true, icon: 'bowl', src: 'sapaTour' }),
  see('paradiseCave', 'phongnha', 'am', 3, 'Paradise Cave', { note: '1 km boardwalk · buggy 20,000 ₫', vnd: 250000, src: 'phongNhaFees' }),
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

// The catalog plus anything the plan brain added (`state.custom`, `est: true`,
// rupee estimates rather than sourced list prices).
export const catalogOf = (state) => (state.custom?.length ? [...ACTIVITIES, ...state.custom] : ACTIVITIES);
export const lookup = (state, id) => BY_ID[id] || state.custom?.find((x) => x.id === id);

export const isExtra = (x) => EXTRA_STOPS.some((s) => s.id === x.stop);
export const isFun = (x) => x.kind !== 'see';

// Rupees per person for one activity, or null when there is nothing to pay
// (free, or covered by a switched-on tour). `travellers` splits per-group prices.
export const activityInr = (x, travellers = 1) => {
  if (x.free || (!x.vnd && !x.usd && !x.inr)) return null;
  const amt = x.inr || (x.vnd ? inrFromVnd(x.vnd) : inrFromUsd(x.usd));
  return x.per === 'group' ? Math.ceil(amt / travellers) : amt;
};

export const DEFAULT_PICKS = Object.fromEntries(ACTIVITIES.filter((x) => x.on).map((x) => [x.id, true]));
