// Day-by-day plan for the recommended strategy (fly in, sail out).
// spend[] references PRICES ids. Flags:
//   transport: counted under the route/strategy, not as ground spend
//   perRoom:   split across the room's occupants
//   perCar:    split across the whole party
//   optional:  only counted when that activity is switched on
//   qty:       multiplier
export const DAYS = [
  {
    n: 1, date: '2026-10-06', island: 'Delhi → Kochi',
    title: 'Fly south, sleep by the fishing nets',
    moves: 'DEL → COK afternoon flight (≈3h20) · KSRTC AC bus Aluva–Vyttila–Fort Kochi',
    plan: [
      'Take a midday or afternoon departure so you land in daylight and can use the bus instead of a cab.',
      'From the airport, the KSRTC low-floor AC bus runs to Fort Kochi via Vyttila (~1h35). The Kochi Metro from Aluva is the other cheap option.',
      'Check in at Zostel Fort Kochi. Walk to the Chinese fishing nets for sunset, then dinner on Princess Street.',
    ],
    sleep: 'Zostel Fort Kochi, 4-bed AC dorm',
    spend: [
      { key: 'delKochi', transport: true },
      { key: 'kochiBus' },
      { key: 'hostelKochi' },
      { key: 'meal', qty: 2 },
    ],
  },
  {
    n: 2, date: '2026-10-07', island: 'Kochi → Agatti',
    title: 'The 09:05 to the atoll',
    moves: 'Cab 05:30 to COK · Alliance Air 9I-505 COK 09:05 → AGX 10:20 · homestay pickup',
    plan: [
      'Pre-book a cab for 05:30 — the earliest KSRTC bus from Fort Kochi (07:05–08:00 depending on the day) reaches the airport around 08:40, too late for a 09:05 departure.',
      'Carry three printouts of the e-permit; it is checked before boarding and again on landing at Agatti.',
      'Homestay hosts meet the flight. Afternoon: first swim in the lagoon off the airstrip beach, then sunset on the western shore.',
    ],
    sleep: 'Agatti homestay (breakfast + dinner included)',
    spend: [
      { key: 'kochiCab', perCar: true },
      { key: 'kochiAgattiAir', transport: true },
      { key: 'homestayAgattiRoom', perRoom: true },
      { key: 'meal', qty: 1 },
    ],
  },
  {
    n: 3, date: '2026-10-08', island: 'Agatti',
    title: 'Lagoon day one: snorkel, paddle, sandbank',
    moves: 'On foot and by boat, all inside the Agatti lagoon',
    plan: [
      'Morning snorkelling boat over the reef on the lagoon side — turtles are common here.',
      'Afternoon kayak hire (30–60 min) once the wind drops.',
      'Low tide: walk out to the Kalpitti islet sandbank at the southern tip of the island.',
    ],
    sleep: 'Agatti homestay',
    spend: [
      { key: 'homestayAgattiRoom', perRoom: true },
      { key: 'snorkel', optional: 'snorkel' },
      { key: 'kayak', optional: 'kayak' },
      { key: 'meal', qty: 1 },
    ],
  },
  {
    n: 4, date: '2026-10-09', island: 'Bangaram · Thinnakara', nav: 'Bangaram',
    title: 'The resort islands, without the resort bill',
    moves: 'Shared day boat Agatti → Bangaram → Thinnakara → Agatti (~1 h each way)',
    plan: [
      'Bangaram has no budget stays (₹15,000+ a night). The hack: sleep in Agatti, take the shared day boat.',
      'Snorkel the Bangaram lagoon in the morning, then the Thinnakara sandbank walk — the water here is the clearest of the trip.',
      'Pack lunch from the homestay; there is nowhere cheap to eat on either island. Back by sunset.',
    ],
    sleep: 'Agatti homestay',
    spend: [
      { key: 'bangaramBoat', optional: 'bangaram' },
      { key: 'homestayAgattiRoom', perRoom: true },
      { key: 'meal', qty: 1 },
    ],
  },
  {
    n: 5, date: '2026-10-10', island: 'Agatti',
    title: 'Discover Scuba, then walk the whole island',
    moves: 'Dive school boat, morning · on foot, evening',
    plan: [
      'Discover Scuba (2 h, no certification needed) with the Agatti dive school. No flight tomorrow, so no surface-interval worries.',
      'Rest through the heat, then walk Agatti end to end (~7 km) at golden hour: coconut groves, tuna drying yards, the village.',
      'Confirm tomorrow\u2019s speed-vessel departure time with your host tonight — it changes with the tide.',
    ],
    sleep: 'Agatti homestay',
    spend: [
      { key: 'scuba', optional: 'scuba' },
      { key: 'homestayAgattiRoom', perRoom: true },
      { key: 'meal', qty: 1 },
    ],
  },
  {
    n: 6, date: '2026-10-11', island: 'Agatti → Kavaratti',
    title: 'Two hours across open water to the capital',
    moves: 'High-speed vessel Agatti → Kavaratti (~2 h; runs 15 Sep – 15 May only)',
    plan: [
      'The inter-island vessel is the cheapest hop in the archipelago. Sit on the shaded side; the crossing is choppy after 11:00.',
      'Check in at the Kavaratti homestay. Evening: the Ujra Mosque\u2019s carved driftwood ceiling and the Marine Aquarium.',
      'Kavaratti is the administrative capital — the only island with reliable ATMs. Withdraw cash for the rest of the trip.',
    ],
    sleep: 'Kavaratti homestay',
    spend: [
      { key: 'speedVessel', transport: true },
      { key: 'homestayKavarattiRoom', perRoom: true },
      { key: 'meal', qty: 2 },
    ],
  },
  {
    n: 7, date: '2026-10-12', island: 'Kavaratti',
    title: 'Glass over coral at the Water Sports Centre',
    moves: 'Government Water Sports Centre, Kavaratti lagoon',
    plan: [
      'The government-run centre is the cheapest place in Lakshadweep for water sports. Glass-bottom boat first thing, while the lagoon is glassy.',
      'Afternoon: kayak or simply float — the Kavaratti lagoon is the largest and calmest you will see.',
      'Buy the ship ticket if not already done: confirm the vessel, class and boarding time for tomorrow evening.',
    ],
    sleep: 'Kavaratti homestay',
    spend: [
      { key: 'glassBottom', optional: 'glassBottom' },
      { key: 'homestayKavarattiRoom', perRoom: true },
      { key: 'meal', qty: 2 },
    ],
  },
  {
    n: 8, date: '2026-10-13', island: 'Kavaratti → at sea', nav: 'Ship',
    title: 'Board the ship at dusk',
    moves: 'Passenger ship Kavaratti → Kochi, second class, overnight (~16–18 h)',
    plan: [
      'Slow morning: last swim, then check out. Homestays will hold bags until boarding.',
      'Second class is an AC push-back seat, like an overnight Volvo. Bring a shawl, motion-sickness tablets and snacks; the canteen is basic.',
      'Watch Kavaratti sink into the horizon from the aft deck. Sailing day is set by the schedule — this plan may shift ±1 day.',
    ],
    sleep: 'On board, second-class seat',
    spend: [
      { key: 'shipSecond', transport: true },
      { key: 'meal', qty: 2 },
    ],
  },
  {
    n: 9, date: '2026-10-14', island: 'At sea → Kochi', nav: 'Kochi',
    title: 'A day of blue, then Willingdon Island',
    moves: 'Ship docks at Willingdon Island by evening · bus/ferry to Fort Kochi',
    plan: [
      'Open sea all day. Flying fish off the bow, a chance of dolphins mid-morning.',
      'From Willingdon Island, take a bus to Thoppumpady and on to Fort Kochi, or a short ferry across the harbour.',
      'Back at Zostel. Kathakali at a Fort Kochi theatre if you have the energy; otherwise, seafood on the harbour front.',
    ],
    sleep: 'Zostel Fort Kochi, 4-bed AC dorm',
    spend: [
      { key: 'kochiBus' },
      { key: 'hostelKochi' },
      { key: 'meal', qty: 3 },
    ],
  },
  {
    n: 10, date: '2026-10-15', island: 'Kochi → Delhi',
    title: 'Mattancherry, then home',
    moves: 'KSRTC AC bus Fort Kochi → COK · COK → DEL afternoon flight',
    plan: [
      'Morning in Mattancherry: Dutch Palace murals, Jew Town, the Paradesi Synagogue, spice warehouses.',
      'The 10:50 or 11:35 KSRTC bus from Fort Kochi reaches the airport in about 1h35 — fine for an afternoon departure.',
      'Land in Delhi by night. Total: ten days, four islands, one overnight at sea.',
    ],
    sleep: 'Home',
    spend: [
      { key: 'kochiBus' },
      { key: 'kochiDel', transport: true },
      { key: 'meal', qty: 2 },
    ],
  },
];

