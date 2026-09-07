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
    name: 'The Sinh Tour · Diamond Era day cruise 2026',
    url: 'https://thesinhtour.com/en/diamond-era-cruise-halong-1-day/',
    note: 'US$40 at Ha Long port, US$46 with the Old Quarter shuttle. Buffet lunch, Sung Sot cave, Titop island, kayak or bamboo boat at Luon cave. Indian set menu +US$2.',
  },
  halongOvernight: {
    name: 'Ava Travel · budget Ha Long overnight cruises 2026',
    url: 'https://avastravelagency.com/halong-bay-cruise-budget/',
    note: '2D1N from US$78 (Garden Bay), US$85 Apricot, US$92 Aphrodite, all-in with Hanoi transfer, meals, kayak, cave. Avoid the US$59 no-name deals.',
  },
  lanHa: {
    name: 'Good Morning Cat Ba · Lan Ha Bay day tour 2026',
    url: 'https://goodmorningcatba.com/day-trip-ha-long-lan-ha-bay/',
    note: 'US$32–35 group day tour from Cat Ba town; luxury boats 750,000 ₫ in low season (Oct–Mar). Needs a night on Cat Ba.',
  },
  sunWorldHalong: {
    name: 'Sun World Ha Long · bảng giá vé 2026',
    url: 'https://sunworldhalong.com/gia-ve/',
    note: 'Queen cable car 380,000 ₫ adult / 280,000 ₫ child, weekends 09:00–20:00, weekdays from 14:00. Dragon Park stopped operating 16 Aug 2026; water park 350,000 ₫.',
  },
  banaHills: {
    name: 'Sun World · Ba Na Hills ticket prices 2026',
    url: 'https://sunworld.vn/en/banahills/travel-guide/price-list-tickets-services-sun-world-ba-na-hills-year-2026-19796',
    note: 'Basic ticket (return cable car, Golden Bridge, Fantasy Park): non-residents 1,000,000 ₫ adult, 800,000 ₫ child 1–1.4 m. Buffet combo 1,050,000 ₫ nights.',
  },
  asiaPark: {
    name: 'Da Nang Downtown · giá vé & tiến độ 2026',
    url: 'https://danangsundowntown.vn/gia-ve-da-nang-downtown-huong-dan-chi-tiet-2026/',
    note: 'The old Asia Park closed on 3 Sep 2025 for a redevelopment; reopening in a new form is only "expected late 2026". No tickets on sale.',
  },
  vinNamHoian: {
    name: 'VinWonders Nam Hoi An · ticket prices',
    url: 'https://vinwonders.com/en/offers/vinwonders-nam-hoi-an-ticket-prices/',
    note: 'Adult 650,000 ₫, after 14:00 450,000 ₫; child / senior 490,000 ₫. 17 km south of Hoi An.',
  },
  vinVuYen: {
    name: 'VinWonders Vũ Yên (Hải Phòng) · giá vé 2026',
    url: 'https://vinwonders.com/vi/wonderpedia/news/gia-ve-vinwonders-vu-yen/',
    note: 'Single zone from 200,000 ₫ (water park) / 300,000 ₫ (zoo or rides), after 17:00 flat 250,000 ₫, combos 450,000–520,000 ₫.',
  },
  baoSon: {
    name: 'Bảo Sơn Paradise · giá vé hè 2026',
    url: 'https://baosonparadise.vn/gia-ve-he-2026-tai-cong-vien-thien-duong-bao-son',
    note: 'Summer full ticket 450,000 ₫ over 1.3 m, 350,000 ₫ for 1–1.3 m; April price list was 200,000 ₫. Closed Mondays. Re-check the October list.',
  },
  hoaLo: {
    name: 'Hoa Lo Prison Relic · tickets',
    url: 'https://hoalo.vn/EN/Home/Ve',
    note: 'Adult 50,000 ₫, students 25,000 ₫, open 08:00–17:00 daily. Night tours are separate and book out.',
  },
  waterPuppets: {
    name: 'Asia Travel Links · Hanoi water puppet guide 2026',
    url: 'https://asiatravellinksdmc.com/travel-guide/hanoi-water-puppet-show-guide-theaters-seats-tickets',
    note: 'Thang Long theatre, 57B Dinh Tien Hoang: several 50-min shows daily, tickets ~100,000–200,000 ₫ by seat (nhahatmuaroithanglong.vn to book).',
  },
  trainStreet: {
    name: 'Vietnam Unlock · Train Street 2026',
    url: 'https://vietnamunlock.com/hanoi-train-street/',
    note: 'Le Duan section free; Phung Hung cafés want one drink, 50,000–100,000 ₫. Access varies by section and day; trains ~15:00 and ~19:00.',
  },
  ethnology: {
    name: 'Origin Vietnam · Museum of Ethnology',
    url: 'https://www.originvietnam.com/destinations/vietnam-museum-of-ethnology/',
    note: 'Entry 40,000 ₫, English-speaking guide 100,000 ₫ per group; photo permit 50,000 ₫.',
  },
  trangTien: {
    name: 'Vinpearl · Tràng Tiền ice cream',
    url: 'https://vinpearl.com/en/trang-tien-ice-cream-hanoi',
    note: 'Cones 15,000 ₫, sticks 10,000–15,000 ₫ at 35 Tràng Tiền.',
  },
  tamCoc: {
    name: 'Ninh Binh Tourism Dept · Tam Coc – Bich Dong fees',
    url: 'https://dulichninhbinh.com.vn/en/item/1801',
    note: 'Adult boat + entrance 250,000 ₫ (350,000 ₫ with the electric car). Hoa Lu 20,000 ₫ adult on the same page.',
  },
  trangAn: {
    name: 'Viet Flame Tours · Trang An boat ticket 2026',
    url: 'https://vietflametours.com/trang-an-boat-tour-ticket-2026/',
    note: 'Adult 300,000 ₫ incl. boat (4–5 per boat), private boat 1,200,000 ₫, guide 300,000 ₫ a route.',
  },
  muaCave: {
    name: 'vietnam.vn · Mua Cave raises entrance fee from 1 Apr 2026',
    url: 'https://www.vietnam.vn/en/hang-mua-ninh-binh-tang-gia-ve-tu-1-4',
    note: 'From 100,000 ₫ to 150,000 ₫ per person, children under 1 m free.',
  },
  hoaLu: {
    name: 'Ninh Binh Booking · Hoa Lu ticket 2026',
    url: 'https://ninhbinhbooking.com/en/hoa-lu-ancient-capital/ticket-price',
    note: 'Adults 20,000 ₫, children 10,000 ₫.',
  },
  khaiDinh: {
    name: 'Hue Top Tours · Khai Dinh tomb fee 2026',
    url: 'https://huetoptours.com/khai-dinh-tomb-entrance-fee/',
    note: 'Adult 150,000 ₫, child 7–12 30,000 ₫. Citadel + two tombs combo 420,000 ₫ (hoiandaytrip.com).',
  },
  perfumeRiver: {
    name: 'Danang Motorbike Adventure · Perfume River dragon boat prices',
    url: 'https://danangmotorbikeadventure.com/price-list-of-dragon-boat-tickets-on-huong-river-hue/',
    note: 'Single dragon boat 300,000 ₫ first hour, 200,000 ₫ each hour after. Toa Kham → Thien Mu one way 250,000 ₫ per boat.',
  },
  hoThuyTien: {
    name: 'Hue Day Tour · Thuy Tien lake abandoned water park',
    url: 'https://huedaytour.com/guide/thuy-tien-lake-the-abandoned-water-park/',
    note: 'Technically closed; guards let you in for an informal 20,000–50,000 ₫ "parking" fee. Trip.com (Jun 2026) reports it clean and accessible.',
  },
  dragonBridge: {
    name: 'Hoi An IT · Dragon Bridge fire show',
    url: 'https://hoianit.com/dragon-bridge-da-nang/',
    note: 'Fire and water at 21:00 Fri–Sun, free; the bridge closes to traffic at 20:45. 27 km from Hoi An.',
  },
  sonTra: {
    name: 'Day Trips Vietnam · Son Tra peninsula 2026',
    url: 'https://daytripsvietnam.com/destinations/da-nang/day-trips/son-tra-peninsula-day-trip/',
    note: 'No entry fee. Motorbike 120,000–150,000 ₫ a day + 50,000–70,000 ₫ fuel; Grab to Linh Ung 80,000–120,000 ₫ one way. Steep ridge roads.',
  },
  mySon: {
    name: 'Hoi An Wonders · My Son entrance fee 2026',
    url: 'https://hoianwonders.vn/en/my-son-sanctuary-entrance-fee/',
    note: 'International adults 150,000 ₫, under 1.4 m free, audio guide 50,000 ₫. Sunrise minibus tours from Hoi An are the cheap way in.',
  },
  bayMau: {
    name: 'Danang to Hoi An · Bay Mau basket boat price 2026',
    url: 'https://danangtohoian.com/bay-mau-coconut-forest-basket-boat-price-2026-hoi-an-guide/',
    note: '100,000 ₫ per guest: 30,000 ₫ entrance + 70,000 ₫ boat. Avoid the roadside touts.',
  },
  tailor: {
    name: 'Tailor Suit Hoi An · 2026 price comparison',
    url: 'https://tailorsuithoian.com/tailor-price-comparison-in-hoi-an-2026-what-you-should-expect-to-pay',
    note: 'Suits US$120–200 at budget tailors, US$250–400 mid-range. Allow two fittings over two days.',
  },
  hoianBoat: {
    name: 'Your Vietnam Travel · Hoi An lantern boat 2026',
    url: 'https://www.yourvietnamtravel.com/hoi-an-lantern-boat-ride',
    note: 'Official tickets: 150,000 ₫ per boat for 1–3 people, 200,000 ₫ for 4–5. Night market on Nguyen Hoang is free to walk.',
  },
  hoianMemories: {
    name: 'Hoi An Memories Show · tickets',
    url: 'https://hoianmemoriesshow.com/',
    note: 'Eco 600,000 ₫, High 750,000 ₫, VIP 1,200,000 ₫; kids 1–1.4 m 300,000 ₫. Closed Tuesdays.',
  },
  fansipan: {
    name: 'Thaiest · Fansipan cable car price 2026',
    url: 'https://thaiest.com/vietnam/travel/fansipan-cable-car-ticket-price',
    note: 'Return cable car 850,000 ₫ adult; Muong Hoa monorail 200,000 ₫; summit funicular 170,000 ₫ up / 150,000 ₫ down.',
  },
  catCat: {
    name: 'Fly Sapa · Cat Cat village',
    url: 'https://www.flysapa.com/en/post/cat-cat-sapa',
    note: 'Entrance about 150,000 ₫ adult, open 07:00–17:30, 3 km walk from Sapa town.',
  },
  sapaBus: {
    name: '12Go · Hanoi → Sapa buses',
    url: 'https://12go.asia/en/bus/hanoi/sapa/',
    note: 'Sleepers US$6.84–7.22, VIP cabins US$12–19; 5.5–6.5 h. Night departures land you in Sapa at dawn.',
  },
  sapaTour: {
    name: 'Vietnam Discoveries · 2-day Sapa + Fansipan from Hanoi',
    url: 'https://vietnamdiscoveries.com/from-hanoi-2-day-sapa-fansipan-and-muong-hoa-valley-tour/',
    note: 'US$169 packaged: return bus, Fansipan cable car, 3-star night, guide, Muong Hoa valley walk. DIY is cheaper.',
  },
  phongNhaFees: {
    name: 'Phong Nha Taxi · attraction fees 2026',
    url: 'https://phongnhataxi.com/phong-nha-attractions-entrance-fee/',
    note: 'Paradise Cave 250,000 ₫ (buggy 20,000 ₫), Phong Nha Cave 150,000 ₫ + boat 700,000 ₫ per 12, Tien Son 80,000 ₫.',
  },
  darkCave: {
    name: 'Phong Nha Private Cars · Dark Cave guide 2026',
    url: 'https://phongnhaprivatecars.com/dark-cave-travel-guide/',
    note: 'Full adventure (zipline, mud bath, kayak) 450,000 ₫ adult; standard 250,000 ₫. 08:00–16:00.',
  },
  sonDoong: {
    name: 'Oxalis Adventure · Son Doong expedition',
    url: 'https://oxalisadventure.com/tour/son-doong-cave-expedition-4d3n/',
    note: 'US$3,000 per person, 4 days 3 nights, sole operator. 2027 departures already fully booked.',
  },
  phongNhaBus: {
    name: 'CheckMyBus · Hue → Phong Nha',
    url: 'https://www.checkmybus.com/hue/phong-nha',
    note: 'US$8–11, 3.5–4.5 h, afternoon departures from the Pham Ngu Lao strip.',
  },
  hpTrain: {
    name: 'Vexere · Hanoi → Hai Phong trains',
    url: 'https://vexere.com/vn/trains/from-ha-noi-to-ga-hai-phong-ngo-quyen-hai-phong.24.171653.en',
    note: 'Four trains a day, 2 h 25 min, from 128,000 ₫.',
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
