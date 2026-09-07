// Eight days, middle → north. Each day: 2–3 things to do (`blocks`), three named
// meals, one budget bed, and a few optional `around` extras. Anything that differs
// by route transit ('train' | 'bus' | 'fly') is an object keyed by transit.
// `price` on a block is a PRICES key (or 'free'); `toggle` ties it to a budget switch.
// Meal / stay `vnd` and `usd` are the sourced list prices; `src` keys SOURCES.

const b = (when, icon, text, extra = {}) => ({ when, icon, text, ...extra });
const meal = (name, dish, vnd, src) => ({ name, dish, vnd, src });
const stay = (name, area, usd, src) => ({ name, area, usd, src });

const hoianBed = stay('SacLo Villa & Hostel', 'dorm · 10 min walk to the Ancient Town', 7, 'hwHoian');
const hueBed = stay('Hue Imperial Hostel', 'dorm · Pham Ngu Lao strip', 5, 'hwHue');
const hanoiBed = stay('Nexy Hostel', 'dorm · Old Quarter', 6, 'hwHanoi');

export const DAYS = [
  {
    n: 1, stop: 'hoian', photo: 'hoian', title: 'Land. Lanterns.', weather: 'central',
    blocks: [
      b('AM', 'plane', 'Land Da Nang 10:50 · shared shuttle to Hoi An'),
      b('PM', 'walk', 'Ancient Town on foot: riverside, Japanese Bridge, tailor streets', { price: 'free' }),
      b('Night', 'lantern', 'Nguyen Hoang night market · lanterns on the Thu Bon'),
    ],
    meals: [
      meal('On board or at KUL', 'AirAsia sells food on board · klia2 food court on the layover', null, null),
      meal('Central Market food court', 'cao lầu · white rose dumplings', 45000, 'hoianFood'),
      meal('Cơm Gà Bà Buội', '22 Phan Chu Trinh · cơm gà xé', 55000, 'hoianEats'),
    ],
    sleep: hoianBed,
    around: ['Fuse Old Town Hoi An · dorm US$9.28', 'Lantern boat on the river · haggle'],
    spend: [],
  },
  {
    n: 2, stop: 'hoian', photo: 'food', title: 'Hoi An, slowly.', weather: 'central',
    blocks: [
      b('AM', 'ticket', 'Old Town ticket: Tan Ky house, Fujian hall, Japanese Bridge', { price: 'hoianTicket', toggle: 'hoianTicket' }),
      b('PM', 'bike', 'Cycle 4 km to An Bang beach · swim if the sea is flat', { price: 'free' }),
      b('Night', 'lantern', 'Hoai river at dusk · full-moon-style lantern streets'),
    ],
    meals: [
      meal('Cao Lầu Thanh', '26 Thái Phiên · opens 06:30', 40000, 'hoianEats'),
      meal('Madam Khanh', 'the bánh mì queen · 115 Trần Cao Vân', 40000, 'hoianFood'),
      meal('Bánh Mì Phượng', '2B Phan Chu Trinh · sit-down or take-away', 40000, 'hoianFood'),
    ],
    sleep: hoianBed,
    around: ['Tra Que herb village by bike', 'Coconut-basket boats at Cam Thanh', 'Rain day: tailor fitting, café hopping'],
    spend: [{ key: 'hoianTicket', toggle: 'hoianTicket' }],
  },
  {
    n: 3, stop: 'danang', where: 'Da Nang → Hue', photo: 'haivan', title: 'Marble Mountains. Hai Van by rail.', weather: 'central',
    blocks: [
      b('AM', 'moto', 'Grab out at 07:00 · Marble Mountains: Huyen Khong cave, pagodas, Am Phu cave', { price: 'marble', toggle: 'marble' }),
      b('PM', 'train', 'SE2 12:46 → Hue 15:23 · left-side seats for the Hai Van coast'),
      b('Night', 'walk', 'Perfume River walk · Truong Tien bridge lights', { price: 'free' }),
    ],
    meals: [
      meal('Bánh Mì Phượng, to go', 'buy it before the 07:00 Grab', 40000, 'hoianFood'),
      meal('Mì Quảng 1A', '1A Hải Phòng · 5 min from Da Nang station', 50000, 'danangFood'),
      meal('Quán Hạnh', '11–15 Phó Đức Chính · set of five Hue dishes', 120000, 'hueHanh'),
    ],
    sleep: hueBed,
    around: ['Yellow bus #1 instead of Grab · 30,000 ₫, slower', 'Am Phu cave · +20,000 ₫ · lift 15,000 ₫ each way', 'Dong Ba market at dusk'],
    spend: [{ key: 'marble', toggle: 'marble' }],
  },
  {
    n: 4, stop: 'hue', where: { train: 'Hue → sleeper', bus: 'Hue → night bus', fly: 'Hue → Hanoi' }, photo: 'hue', title: 'Hue. Then north overnight.', weather: 'central',
    blocks: [
      b('AM', 'ticket', 'Imperial City: Ngo Mon gate, Thai Hoa palace, the ruined Forbidden Purple City', { price: 'hueCitadel', toggle: 'hueCitadel' }),
      b('PM', 'moto', 'Thien Mu pagoda (free) · Tu Duc tomb by GrabBike', { price: 'hueTomb', toggle: 'hueTomb' }),
      b('Night', 'train', { train: 'SE20 21:30 → Hanoi 11:55 · lower berth', bus: 'Sleeper bus ~18:00 · hostel pickup · ~12 h', fly: 'VietJet 15:55 → HAN 17:10 · Old Quarter by 19:00' }),
    ],
    meals: [
      meal('Bún Bò Huế Bà Tuyết', 'the city\u2019s own noodle soup', 40000, 'hueFood'),
      meal('Lạc Thiện', 'bánh khoái · the deaf family\u2019s place by the citadel', 60000, 'hueFood'),
      { train: meal('Bánh Bèo Bà Đỏ', 'steamed rice cakes · early, before the train', 25000, 'hueFood'), bus: meal('Bánh Bèo Bà Đỏ', 'steamed rice cakes · before pickup', 25000, 'hueFood'), fly: meal('Bún Chả Đắc Kim', '1 Hàng Mành, Hanoi · set', 70000, 'hanoiEats') },
    ],
    sleep: { train: stay('SE20 sleeper', 'lower berth, even-numbered car', null, 'vnTrainHueHan'), bus: stay('Sleeper bus bunk', 'cabin bus if you are tall', null, 'vexereBus'), fly: hanoiBed },
    around: ['Cơm hến at Dong Ba · 10,000–15,000 ₫', 'Khai Dinh tomb · 150,000 ₫ · skip if short on time', 'Fly route: be at HUI by 14:30'],
    spend: [{ key: 'hueCitadel', toggle: 'hueCitadel' }, { key: 'hueTomb', toggle: 'hueTomb' }],
  },
  {
    n: 5, stop: 'hanoi', photo: 'hanoi', title: 'Hanoi Old Quarter.', weather: 'north',
    blocks: [
      b('AM', 'walk', { train: 'Arrive 11:55 · drop bags · Hoan Kiem lake loop, Ngoc Son temple', bus: 'Arrive before dawn · nap · Hoan Kiem lake loop, Ngoc Son temple', fly: 'Slow morning · Hoan Kiem lake loop, Ngoc Son temple' }, { price: 'ngocSon' }),
      b('PM', 'walk', 'Old Quarter guild streets: Hang Ma, Hang Gai · Train Street café', { price: 'free' }),
      b('Night', 'moon', 'Ta Hien beer corner · plastic stools, bia hơi'),
    ],
    meals: [
      { train: meal('On the SE20', 'pack bánh bèo or bánh mì in Hue', null, null), bus: meal('Xôi Yến', '35B Nguyễn Hữu Huân · open from 05:00', 35000, 'hanoiEats'), fly: meal('Xôi Yến', '35B Nguyễn Hữu Huân · xôi xéo', 35000, 'hanoiEats') },
      meal('Bún Chả Hương Liên', '24 Lê Văn Hưu · the Obama combo', 70000, 'hanoiFood'),
      meal('Phở 10 Lý Quốc Sư', '10 Lý Quốc Sư · open late', 70000, 'hanoiFood'),
    ],
    sleep: hanoiBed,
    around: ['Long Bien bridge at sunset · free', 'Mad Monkey Hanoi · dorm US$6.84', 'Water puppets at Thang Long · book ahead'],
    spend: [],
  },
  {
    n: 6, stop: 'ninhbinh', photo: 'ninhbinh', title: 'Ninh Binh day.', weather: 'north',
    blocks: [
      b('AM', 'bus', '07:30 pickup · Hoa Lu ancient capital · Mua cave, 500 steps', { price: 'ninhbinh', toggle: 'ninhbinh' }),
      b('PM', 'boat', 'Tam Coc rowing boat through three caves · cycle the paddies'),
      b('Night', 'moon', 'Back in Hanoi ~19:00 · Ta Hien street'),
    ],
    meals: [
      meal('Bánh Mì 25', '25 Hàng Cá · before pickup', 20000, 'hanoiFood'),
      meal('Tour buffet lunch', 'included in the day tour', null, 'ninhbinhTour'),
      meal('Bún Chả Đắc Kim', '1 Hàng Mành · Michelin-listed set', 70000, 'hanoiEats'),
    ],
    sleep: hanoiBed,
    around: ['Limousine-van version · 1,100,000–1,150,000 ₫', 'Trang An boat instead of Tam Coc · same ticket tier', 'Bich Dong pagoda if the tour stops'],
    spend: [{ key: 'ninhbinh', toggle: 'ninhbinh' }],
  },
  {
    n: 7, stop: 'halong', photo: 'halong', title: 'Ha Long Bay.', weather: 'north',
    blocks: [
      b('AM', 'bus', '08:20 shuttle · 2.5 h to Tuan Chau · board at noon', { price: 'halong', toggle: 'halong' }),
      b('PM', 'boat', 'Sung Sot cave · kayak Luon cove · Titop Island climb'),
      b('Night', 'moon', 'Sunset on deck · back in Hanoi ~20:30'),
    ],
    meals: [
      meal('Phở Gia Truyền Bát Đàn', '49 Bát Đàn · opens 06:00, queue, cash', 50000, 'hanoiFood'),
      meal('Seafood lunch on board', 'included in the cruise', null, 'halongDay'),
      meal('Xôi Yến', '35B Nguyễn Hữu Huân · open till 01:00', 35000, 'hanoiEats'),
    ],
    sleep: hanoiBed,
    around: ['Two-day cruise instead · adds a night, drops Ninh Binh', 'Lan Ha Bay from Cat Ba · quieter, longer transfer'],
    spend: [{ key: 'halong', toggle: 'halong' }],
  },
  {
    n: 8, stop: 'hanoi', photo: 'train', title: 'Last lap. Home.', weather: 'north',
    blocks: [
      b('AM', 'ticket', 'Temple of Literature · 08:00 before the tour buses', { price: 'literature' }),
      b('PM', 'bus', 'Dong Xuan market run · bus 86 from Long Bien by 15:30'),
      b('Night', 'plane', 'VietJet 19:10 → Delhi 22:50'),
    ],
    meals: [
      meal('Café Giảng', '39 Nguyễn Hữu Huân · egg coffee + bánh mì next door', 35000, 'hanoiFood'),
      meal('Bánh Mì 25', '25 Hàng Cá · eat in, or pack for the airport', 20000, 'hanoiFood'),
      meal('At HAN or on board', 'VietJet sells hot meals · not included', null, null),
    ],
    sleep: stay('Your bed', 'Delhi, 22:50', null, null),
    around: ['Hoa Lo prison · 50,000 ₫ · if it rains', 'Lotte observation deck · pricey, skip', 'Fly route: same day, same flight'],
    spend: [],
  },
];

const pick = (v, transit) => (v && typeof v === 'object' && 'train' in v ? v[transit] : v);
export const sleepFor = (day, transit) => pick(day.sleep, transit);
export const blockText = (block, transit) => pick(block.text, transit);
export const mealsFor = (day, transit) => day.meals.map((m) => pick(m, transit));
export const whereFor = (day, transit) => pick(day.where, transit);
