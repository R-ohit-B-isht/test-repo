// Eight days. Blocks are short on purpose — icon + a few words.
// `sleep` can vary by strategy transit ('train' | 'bus' | 'fly'); `spend` lists
// PRICES keys charged that day; `toggle` marks the activity switch it depends on.

const b = (when, icon, text) => ({ when, icon, text });

export const DAYS = [
  {
    n: 1, stop: 'hanoi', photo: 'hanoi', title: 'Land. Old Quarter.', weather: 'north',
    blocks: [b('AM', 'plane', 'Land HAN · bus 86 in'), b('PM', 'walk', 'Hoan Kiem loop · Ngoc Son'), b('Night', 'bowl', 'Bún chả · egg coffee')],
    sleep: 'Hostel, Old Quarter',
    spend: [],
  },
  {
    n: 2, stop: 'ninhbinh', photo: 'ninhbinh', title: 'Ninh Binh day.', weather: 'north',
    blocks: [b('AM', 'bus', 'Hoa Lu · bike the paddies'), b('PM', 'boat', 'Tam Coc rowboat · Mua cave 500 steps'), b('Night', 'moon', 'Back in Hanoi · Bia Hoi corner')],
    sleep: 'Hostel, Old Quarter',
    spend: [{ key: 'ninhbinh', toggle: 'ninhbinh' }],
  },
  {
    n: 3, stop: 'halong', photo: 'halong', title: 'Ha Long Bay.', weather: 'north',
    blocks: [b('AM', 'bus', 'Shuttle · 2.5 h to the bay'), b('PM', 'boat', 'Karst cruise · cave · Titop lookout'), b('Night', 'moon', 'Back in Hanoi')],
    sleep: 'Hostel, Old Quarter',
    spend: [{ key: 'halong', toggle: 'halong' }],
  },
  {
    n: 4, stop: 'hanoi', photo: 'train', title: 'Hanoi slow. Then south.', weather: 'north',
    blocks: [b('AM', 'walk', 'Train Street · Temple of Literature'), b('PM', 'bowl', 'Phở · last coffee · pack'), b('Night', 'train', { train: 'SE1 19:30 · sleeper south', bus: 'Sleeper bus · 12–13 h south', fly: 'Evening flight · HAN → DAD' })],
    sleep: { train: 'Sleeper berth', bus: 'Sleeper bus bunk', fly: 'Hostel, Da Nang' },
    spend: [],
  },
  {
    n: 5, stop: 'hue', photo: 'hue', title: 'Hue, the old capital.', weather: 'central',
    blocks: [b('AM', 'ticket', { train: 'Arrive 08:48 · Imperial City', bus: 'Arrive early · Imperial City', fly: 'Train up from Da Nang · Imperial City' }), b('PM', 'moto', 'Thien Mu pagoda · river'), b('Night', 'bowl', 'Bún bò Huế · Dong Ba market')],
    sleep: 'Guesthouse, Hue',
    spend: [{ key: 'hueCitadel', toggle: 'hueCitadel' }],
  },
  {
    n: 6, stop: 'danang', photo: 'haivan', title: 'Hai Van by rail.', weather: 'central',
    blocks: [b('AM', 'train', 'SE1 08:56 → 11:41 · sea side seats'), b('PM', 'bus', 'My Khe beach · yellow bus to Hoi An'), b('Night', 'lantern', 'Lanterns on the Thu Bon')],
    sleep: 'Homestay, Hoi An',
    spend: [],
  },
  {
    n: 7, stop: 'hoian', photo: 'hoian', title: 'Hoi An all day.', weather: 'central',
    blocks: [b('AM', 'bike', 'Cycle to An Bang beach'), b('PM', 'ticket', 'Old Town ticket · Japanese bridge'), b('Night', 'lantern', 'Night market · river boats')],
    sleep: 'Homestay, Hoi An',
    spend: [{ key: 'hoianTicket', toggle: 'hoianTicket' }],
  },
  {
    n: 8, stop: 'danang', photo: 'danang', title: 'Home.', weather: 'central',
    blocks: [b('AM', 'sun', 'Beach or Ba Na Hills (optional)'), b('PM', 'car', 'GrabCar to DAD'), b('Night', 'plane', 'Fly to Delhi')],
    sleep: 'Your bed',
    spend: [{ key: 'banaHills', toggle: 'banaHills' }],
  },
];

const pick = (v, transit) => (typeof v === 'string' ? v : v[transit]);
export const sleepFor = (day, transit) => pick(day.sleep, transit);
export const blockText = (block, transit) => pick(block.text, transit);
