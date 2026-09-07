// Where every number came from. Keyed by PRICES[*].source / WEATHER[*].source.
// All fares are date-sensitive observations from Aug–Sep 2026, not live availability.

export const SOURCES = {
  kayakDelHan: {
    name: 'KAYAK · Delhi → Hanoi fares',
    url: 'https://www.kayak.co.in/flight-routes/New-Delhi-Indira-Gandhi-Intl-DEL/Hanoi-Noibai-HAN',
    note: 'Last 5 days: one-way from ₹13,957, return from ₹25,893. Typical one-way ₹12,128–17,904.',
  },
  indigoDelHan: {
    name: 'IndiGo · Delhi → Hanoi route page',
    url: 'https://www.goindigo.in/international-flights/delhi-to-hanoi-flights.html',
    note: 'Advertised from ₹12,997; airline says the range is ₹10,000–15,000 depending on booking time.',
  },
  tripDadDel: {
    name: 'Trip.com · Da Nang → Delhi fares',
    url: 'https://www.trip.com/flights/da-nang-to-delhi/airfares-dad-del/',
    note: 'One-way from US$126 (VietJet, connecting). Round trips from US$291 (Thai AirAsia).',
  },
  emtDelDad: {
    name: 'EaseMyTrip · Delhi → Da Nang fares',
    url: 'https://www.easemytrip.com/flights/cheap-flights-delhi-del-to-danang-dad/',
    note: 'Calendar lows ₹12,069–14,105; most days ₹16,104–19,373.',
  },
  airasiaDelBkk: {
    name: 'AirAsia MOVE · Delhi → Bangkok fares',
    url: 'https://www.airasia.com/flights/from-new-delhi-del-to-bangkok-suvarnabhumi-bkk/',
    note: 'Advertised from ₹8,815 (BKK) / ₹12,136 (DMK). Bangkok hop needs a self-transfer and a second bag fee.',
  },
  tripBkkHan: {
    name: 'Trip.com · Bangkok → Hanoi fares',
    url: 'https://us.trip.com/flights/bangkok-to-hanoi/airfares-bkk-han/',
    note: 'Thai AirAsia one-way from US$67–69, ~1 h 54 min. Cheapest month: November.',
  },
  kayakHanDad: {
    name: 'KAYAK · Hanoi → Da Nang fares',
    url: 'https://www.kayak.com/flight-routes/Hanoi-Noibai-HAN/Da-Nang-DAD',
    note: 'One-way from US$50, typical US$59–85. Base fares exclude checked bags.',
  },
  vnTrainHanHue: {
    name: 'Vietnamtrain · SE1 Hanoi → Hue basic fares',
    url: 'https://www.vietnamtrain.com/vr/train-from-ha-noi-to-hue-on-SE1',
    note: 'Dep 19:30, arr 08:48. 6-berth 803,000–997,000 ₫; 4-berth 1,004,000–1,154,000 ₫. Agents add a fee; dsvn.vn is official.',
  },
  vnTrainHueDad: {
    name: 'Vietnamtrain · SE trains Hue → Da Nang basic fares',
    url: 'https://www.vietnamtrain.com/vr/train-from-hue-to-da-nang-on-SE9',
    note: 'Soft seat AC 89,000 ₫; sleeper berth 110,000–151,000 ₫. SE1 runs Hue 08:56 → Da Nang 11:41 over the Hai Van pass.',
  },
  vexereBus: {
    name: 'Vexere · Hanoi → Hue sleeper buses',
    url: 'https://vexere.com/en-US/double-sleeper-bus-ticket-booking-from-ha-noi-to-hue-thua-thien-hue-124t26471.html',
    note: 'Sleeper and cabin buses 546,000–910,000 ₫ depending on operator and date; ~12–13 h overnight.',
  },
  bus86: {
    name: 'Hanoi Bus · route 86, Noi Bai → Old Quarter',
    url: 'https://hanoibus.com/route/86-noi-bai-airport-city-center',
    note: 'Flat 45,000 ₫, 06:40–22:15, ~45 min to the Old Quarter / railway station.',
  },
  danangHoian: {
    name: 'Hoi An Local · Da Nang ↔ Hoi An transport',
    url: 'https://hoianlocal.com/blog/da-nang-to-hoi-an/',
    note: 'Yellow Bus #1 30,000 ₫ (60–90 min). Airport shared shuttle US$5–10.',
  },
  grabPrices: {
    name: 'Day Trips Vietnam · Grab fares 2026',
    url: 'https://daytripsvietnam.com/guides/vietnam-grab-prices-2026/',
    note: 'GrabBike short hop 15,000–30,000 ₫. Da Nang → Hoi An GrabCar 450,000–600,000 ₫ per car.',
  },
  sinhHalong: {
    name: 'The Sinh Tourist · Ha Long Bay day tours',
    url: 'https://thesinhtour.com/en/halong-bay-day-trip-from-halong/',
    note: 'US$34–44 per person with lunch, cave and Titop island; Hanoi pickup versions run higher.',
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
  hoianTicket: {
    name: 'Hoi An Local · Old Town ticket guide',
    url: 'https://hoianlocal.com/blog/hoi-an-old-town-tickets-guide/',
    note: 'Foreign adults 120,000 ₫ for five heritage sites. Walking the streets is free.',
  },
  banaHills: {
    name: 'Sun World Ba Na Hills · 2026 price list',
    url: 'https://sunworld.vn/en/banahills/sunworld-news/price-list-tickets-services-sun-world-ba-na-hills-year-2026-19796',
    note: 'Non-local adults 1,000,000 ₫ incl. cable car and Golden Bridge.',
  },
  hostels: {
    name: 'Budget Your Trip · Hanoi hostel averages',
    url: 'https://www.budgetyourtrip.com/hostels/vietnam/hanoi-1581130',
    note: 'Average dorm bed ≈ US$9/night; Hostelworld lists Hoi An dorms US$5–16.',
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
