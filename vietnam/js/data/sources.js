// Where every number came from. Keyed by PRICES[*].source, MEALS/STAYS source, WEATHER[*].source.
// Flights: Google Flights searched on 7 Sep 2026 for the exact travel dates, one adult,
// taxes included, cabin bag only. Fares move daily; these are planning figures, not live seats.

const gf = (from, to, date, back) => `https://www.google.com/travel/flights?q=${encodeURIComponent(`flights from ${from} to ${to} on ${date}${back ? ` returning ${back}` : ' one way'}`)}`;

export const SOURCES = {
  gfDelDad: {
    name: 'Google Flights · DEL → DAD · Fri 23 Oct 2026',
    url: gf('DEL', 'DAD', '2026-10-23'),
    note: 'From ₹14,072: AirAsia X via Kuala Lumpur, dep 23:20, arr 10:50 next morning. Thu 22 ₹21,039 · Sat 24 ₹19,600.',
  },
  gfDelDadSat: {
    name: 'Google Flights · DEL → DAD · Sat 24 Oct 2026',
    url: gf('DEL', 'DAD', '2026-10-24'),
    note: 'From ₹19,600: Thai AirAsia X via Bangkok DMK, dep 20:55, lands Sunday 09:05 — a day lost.',
  },
  gfHanDel: {
    name: 'Google Flights · HAN → DEL · Sat 31 Oct 2026',
    url: gf('HAN', 'DEL', '2026-10-31'),
    note: 'From ₹16,535: VietJet non-stop 19:10 → 22:50. IndiGo non-stop ₹21,465. Fri 30 ₹21,465 · Sun 1 Nov ₹22,303.',
  },
  gfDelHan: {
    name: 'Google Flights · DEL → HAN · Sat 24 Oct 2026',
    url: gf('DEL', 'HAN', '2026-10-24'),
    note: 'From ₹18,112: IndiGo non-stop 04:45 → 10:50. Sun 25 drops to ₹14,274 (VietJet 00:05).',
  },
  gfDadDel: {
    name: 'Google Flights · DAD → DEL · Sat 31 Oct 2026',
    url: gf('DAD', 'DEL', '2026-10-31'),
    note: 'From ₹21,474: Thai AirAsia via DMK 12:40 → 19:50. Fri 30 jumps to ₹32,126.',
  },
  gfDelHanRt: {
    name: 'Google Flights · DEL ↔ HAN return · 24–31 Oct 2026',
    url: gf('DEL', 'HAN', '2026-10-24', '2026-10-31'),
    note: 'From ₹34,646 IndiGo non-stop both ways. Air India ₹43,998.',
  },
  gfDelDadRt: {
    name: 'Google Flights · DEL ↔ DAD return · 23–31 Oct 2026',
    url: gf('DEL', 'DAD', '2026-10-23', '2026-10-31'),
    note: 'From ₹35,641 AirAsia X via KUL both ways. Next option ₹61,498.',
  },
  gfHanDad: {
    name: 'Google Flights · HAN → DAD · Sat 24 Oct 2026',
    url: gf('HAN', 'DAD', '2026-10-24'),
    note: 'From ₹3,849 Vietravel 16:55 → 18:20; VietJet 14:35 ₹4,028. Cabin bag only; checked bag is extra.',
  },
  gfHueHan: {
    name: 'Google Flights · HUI → HAN · Tue 27 Oct 2026',
    url: gf('HUI', 'HAN', '2026-10-27'),
    note: 'From ₹3,245 VietJet non-stop, 07:45 / 15:55 / 20:50 departures. Cabin bag only.',
  },
  vnTrainHueHan: {
    name: 'Vietnamtrain · SE20 Hue → Hanoi basic fares',
    url: 'https://www.vietnamtrain.com/vr/train-from-hue-to-ha-noi-on-SE20',
    note: 'Dep 21:30, arr 11:55. 6-berth 490,000–605,000 ₫; 4-berth 640,000–715,000 ₫. Agents add a fee; dsvn.vn is official.',
  },
  vnTrainDadHue: {
    name: 'Vietnamtrain · SE2 Da Nang → Hue basic fares',
    url: 'https://www.vietnamtrain.com/vr/train-from-da-nang-to-hue-on-SE2',
    note: 'Dep 12:46, arr 15:23 over the Hai Van pass. Soft seat AC 99,000 ₫; berth 110,000–153,000 ₫.',
  },
  vexereBus: {
    name: 'Vexere · Hue → Hanoi sleeper buses',
    url: 'https://vexere.com/en-US/sleeper-bus-ticket-booking-from-hue-thua-thien-hue-to-ha-noi-2647t1241.html',
    note: '20 operators, 430,000–800,000 ₫, ~12 h overnight; most leave 17:00–19:30. Site average 875,000 ₫.',
  },
  hoianExpress: {
    name: 'Hoi An Express · airport shuttle',
    url: 'https://hoianexpress.com.vn/shuttle-bus/',
    note: 'Da Nang airport → Hoi An shared shuttle US$6, about 1 h.',
  },
  danangHoian: {
    name: 'Hoi An Local · Da Nang ↔ Hoi An transport',
    url: 'https://hoianlocal.com/blog/da-nang-to-hoi-an/',
    note: 'Yellow Bus #1 30,000 ₫ (60–90 min). Airport shared shuttle US$5–10.',
  },
  marbleMountains: {
    name: 'Vietnam With Me · Marble Mountains 2026',
    url: 'https://vietnamwithme.com/2026/08/09/marble-mountains-da-nang-guide/',
    note: 'Entry 40,000 ₫, lift 15,000 ₫ each way, Am Phu cave 20,000 ₫. Grab from Hoi An 250,000–300,000 ₫ per car.',
  },
  grabPrices: {
    name: 'Day Trips Vietnam · Grab fares 2026',
    url: 'https://daytripsvietnam.com/guides/vietnam-grab-prices-2026/',
    note: 'GrabBike short hop 15,000–30,000 ₫. Da Nang → Hoi An GrabCar 450,000–600,000 ₫ per car.',
  },
  bus86: {
    name: 'Hanoi Bus · route 86, Old Quarter → Noi Bai',
    url: 'https://hanoibus.com/route/86-noi-bai-airport-city-center',
    note: 'Flat 45,000 ₫, every 25–30 min, ~45 min from the railway station / Old Quarter.',
  },
  halongDay: {
    name: 'Vietnam Discoveries · Ha Long Bay day trip ex-Hanoi',
    url: 'https://vietnamdiscoveries.com/hanoi-halong-bay-day-trip-with-titop-island-cave-kayak/',
    note: 'From US$40 incl. Hanoi pickup, seafood lunch, Sung Sot cave, kayak at Luon cove, Titop climb. 08:20 → 20:30.',
  },
  ninhbinhTour: {
    name: 'Ninh Binh One Day Tours · Hoa Lu · Mua Cave · Tam Coc',
    url: 'https://ninhbinhonedaytours.com/tour/hoa-lu-mua-cave-tam-coc/',
    note: '1,000,000 ₫ by bus, 1,100,000–1,150,000 ₫ by limousine. Includes boat, bikes, lunch, entries.',
  },
  hueCitadel: {
    name: 'Central Vietnam Guide · Hue Imperial City',
    url: 'https://centralvietnamguide.com/hue-imperial-city/',
    note: 'Adults 200,000 ₫, cash. Emperor tombs are separate tickets.',
  },
  hueTombs: {
    name: 'Hue Top Tours · Hue entrance fees 2026',
    url: 'https://huetoptours.com/hue-entrance-fees/',
    note: 'Tu Duc tomb 150,000 ₫. Thien Mu pagoda free. Citadel + Tu Duc + Khai Dinh combo 420,000 ₫.',
  },
  hoianTicket: {
    name: 'Hoi An Local · Old Town ticket guide',
    url: 'https://hoianlocal.com/blog/hoi-an-old-town-tickets-guide/',
    note: 'Foreign adults 120,000 ₫ for five heritage sites. Walking the streets is free.',
  },
  hanoiSights: {
    name: 'Asia Travel Links · Temple of Literature · Ngoc Son',
    url: 'https://asiatravellinksdmc.com/travel-guide/temple-of-literature-hanoi-visitor-guide-history-tickets-quiet-hours',
    note: 'Temple of Literature 70,000 ₫, 08:00–17:00, cash. Ngoc Son temple 50,000 ₫ (vietnamtour.in).',
  },
  hostels: {
    name: 'Budget Your Trip · Hanoi hostel averages',
    url: 'https://www.budgetyourtrip.com/hostels/vietnam/hanoi-1581130',
    note: 'Average dorm bed ≈ US$9/night; Hostelworld lists Hoi An dorms US$5–16.',
  },
  hwHoian: {
    name: 'Hostelworld · Hoi An hostels',
    url: 'https://www.hostelworld.com/st/hostels/asia/vietnam/hoi-an/',
    note: 'Late-Oct dorms: SacLo Villa from US$7, Fuse Old Town US$9.28, Tribee Kinh (5 min to the Ancient Town, breakfast) similar.',
  },
  hwHue: {
    name: 'Hostelworld · Hue hostels',
    url: 'https://www.hostelworld.com/st/hostels/asia/vietnam/hue/',
    note: 'Dorms commonly US$4–6: Hue Imperial Hostel, Amy Hostel, 1995S Hostel all near the Le Loi / Pham Ngu Lao strip.',
  },
  hwHanoi: {
    name: 'Hostelworld · Hanoi hostels',
    url: 'https://www.hostelworld.com/st/hostels/asia/vietnam/hanoi/',
    note: 'Old Quarter dorms: Nexy Hostel from US$6, Mad Monkey US$6.84, Lake View Backpackers from US$2.',
  },
  hanoiFood: {
    name: 'VietnamSpot · Hanoi food 2026, with prices',
    url: 'https://vietnamspot.ru/en/blog/hanoi-food',
    note: 'Phở Gia Truyền Bát Đàn ~50,000 ₫ · Phở 10 Lý Quốc Sư 60,000–80,000 ₫ · Bún Chả Hương Liên ~70,000 ₫ · Café Giảng egg coffee 35,000 ₫ · Bánh Mì 25 from 20,000 ₫.',
  },
  hanoiEats: {
    name: 'TableJourney · Xôi Yến · verified Jun 2026',
    url: 'https://tablejourney.com/vietnam/hanoi/street-food/xoi-yen-street/',
    note: 'Xôi Yến, 35B Nguyễn Hữu Huân: bowls 20,000–50,000 ₫, open 05:00–01:00, cash. Bún Chả Đắc Kim, 1 Hàng Mành: set 70,000 ₫ (DanielFoodDiary, Dec 2025).',
  },
  hueHanh: {
    name: 'Vietnam Life · Quán Hạnh, Hue',
    url: 'https://vietnamlife.asia/quan-hanh-restaurant-hue/',
    note: '11–15 Phó Đức Chính. Set of five Hue dishes (bánh khoái, bánh bèo, nem lụi, bánh ướt, thịt nướng) 120,000 ₫. Open 09:00–21:00.',
  },
  hueFood: {
    name: 'Wikidulich · 20 Hue eateries, with prices',
    url: 'https://wikidulich.com/quan-an-ngon-o-hue.html',
    note: 'Bún bò Bà Tuyết 30,000–50,000 ₫ · bánh bèo Bà Đỏ 20,000–30,000 ₫ · cơm hến 10,000–15,000 ₫. Lạc Thiện bánh khoái 50,000–70,000 ₫ (Foody).',
  },
  danangFood: {
    name: 'Vietgohan · Da Nang food guide 2026',
    url: 'https://vietgohan.com/en/20260820-2/',
    note: 'Mì Quảng 40,000–60,000 ₫ (Mì Quảng 1A, Michelin-selected) · Bánh Xèo Bà Dưỡng 90,000 ₫ set · Be Man seafood 200,000–400,000 ₫.',
  },
  hoianFood: {
    name: 'Hoi An Itinerary · food guide with VND prices',
    url: 'https://hoianitinerary.com/hoian-food-guide',
    note: 'Cao lầu 35,000–55,000 ₫ · cơm gà 35,000–55,000 ₫ · white rose 35,000–55,000 ₫ · bánh mì 15,000–30,000 ₫ local, 40,000 ₫ at Phượng / Madam Khanh.',
  },
  hoianEats: {
    name: 'Vietnam Tourism · cao lầu guide · Hoi An Day Trip · Cơm Gà Bà Buội 2026',
    url: 'https://www.vietnamtourism.com/vi/cao-lau-cam-nang-toan-dien-ve-mon-an-bieu-tuong-nhat-cua-hoi',
    note: 'Cao Lầu Thanh, 26 Thái Phiên: 40,000 ₫, 06:30 until early afternoon. Cơm Gà Bà Buội, 22 Phan Chu Trinh: cơm gà xé 55,000 ₫, 06:30–21:30 (hoiandaytrip.com).',
  },
  foodBudget: {
    name: 'Tunex Travels · Vietnam daily budget 2026',
    url: 'https://www.tunextravels.com/vietnam-daily-budget-2026-real-costs-for-solo-travelers-couples/',
    note: 'Street food only US$6–10/day; mix of street food and local restaurants US$10–18.',
  },
  evisa: {
    name: 'Vietnam Immigration · e-visa portal',
    url: 'https://evisa.xuatnhapcanh.gov.vn/en_US/khai-thi-thuc-dien-tu/cap-thi-thuc-dien-tu',
    note: 'US$25 single entry, 3 working days. Indians need it; apply 2–3 weeks out.',
  },
  viettel: {
    name: 'Viettel · tourist eSIM plans',
    url: 'https://vietteltelecom.vn/tin-tuc/chi-tiet/viettel-esim-for-vietnam-daily-5gb-for-30-days-guide/16287392',
    note: '5G150T: 150,000 ₫ for 5 GB/day × 30 days. Physical SIM adds 10,000–20,000 ₫.',
  },
  fx: {
    name: 'xe.com mid-market rates',
    url: 'https://www.xe.com/currencyconverter/convert/?Amount=1&From=USD&To=INR',
    note: '1 USD ≈ ₹95.7 · ₹1 ≈ 276 ₫ (Sep 2026). Cards add 1–3%.',
  },
  hanoiclimate: {
    name: 'timeanddate · Hanoi October climate',
    url: 'https://www.timeanddate.com/weather/@1581129/climate',
    note: 'High 30 °C, low 23 °C, 158 mm rain, 72% humidity.',
  },
  typhoon: {
    name: 'Vietnam Knowledge · central-coast typhoon window',
    url: 'https://vietnamkb.com/seasonal/typhoon-avoidance-central-coast',
    note: 'Mid-Oct to mid-Nov is peak exposure. Da Nang 300–400 mm in October, 20+ wet days; Hoi An floods most years.',
  },
};
