// Day blocks. A strategy is an ordered list of block ids; dates are assigned
// from TRIP.start when the plan is built (see ../plan.js).
// spend[] references PRICES ids. Flags:
//   transport: counted under the route, not as ground spend
//   package:   an all-inclusive package (ship + cabin + meals)
//   perRoom:   split across a room's occupants (2 to a room)
//   optional:  only counted when that activity is switched on
//   qty:       multiplier
export const BLOCKS = {
  flyDelKochi: {
    icon: 'plane', place: 'Delhi → Kochi', nav: 'Kochi', photo: 'kochi',
    title: 'Fly south',
    plan: ['DEL → COK, ~3h20', 'KSRTC AC bus to Fort Kochi', 'Sunset at the fishing nets'],
    sleep: 'Zostel dorm, Fort Kochi', sleepIcon: 'bunk',
    spend: [{ key: 'delKochi', transport: true }, { key: 'kochiBus' }, { key: 'hostelKochi' }, { key: 'meal', qty: 2 }],
  },
  trainOut1: {
    icon: 'train', place: 'Delhi → rails', nav: 'Train',
    title: 'Kerala Express, 20:10',
    plan: ['Board at New Delhi', 'Dinner on the platform first', '2,811 km ahead'],
    sleep: 'Berth on 12626', sleepIcon: 'train',
    spend: [{ key: 'trainSleeper', transport: true }, { key: 'meal', qty: 1 }],
  },
  trainOut2: {
    icon: 'train', place: 'Through the Deccan', nav: 'Train',
    title: 'A whole day of India',
    plan: ['Bhopal by breakfast, Nagpur by lunch', 'Chai at every stop', 'Sleep second night aboard'],
    sleep: 'Berth on 12626', sleepIcon: 'train',
    spend: [{ key: 'meal', qty: 3 }],
  },
  trainOut3: {
    icon: 'train', place: 'Rails → Kochi', nav: 'Kochi', photo: 'kochi',
    title: 'Into Kerala by evening',
    plan: ['Ernakulam Town ~18:00', 'Bus to Fort Kochi', 'Harbour-front dinner'],
    sleep: 'Zostel dorm, Fort Kochi', sleepIcon: 'bunk',
    spend: [{ key: 'meal', qty: 2 }, { key: 'kochiBus' }, { key: 'hostelKochi' }],
  },
  flyKochiAgatti: {
    icon: 'plane', place: 'Kochi → Agatti', nav: 'Agatti', photo: 'agatti',
    title: 'Land on the atoll',
    plan: ['07:05 bus to the airport', 'FLY91 11:00 → 12:15, permit checked twice', 'First swim off the airstrip beach'],
    sleep: 'Agatti homestay', sleepIcon: 'home',
    spend: [{ key: 'kochiBus' }, { key: 'kochiAgattiAir', transport: true }, { key: 'homestayAgattiRoom', perRoom: true }, { key: 'meal', qty: 1 }],
  },
  sailKochiAgatti: {
    icon: 'ship', place: 'Kochi → at sea', nav: 'Ship', photo: 'ship',
    title: 'Board at Willingdon Island',
    plan: ['Bus to the wharf, permits checked', 'Ship sails afternoon; meals on board', 'Sunset from the aft deck'],
    sleep: 'On board, seat or berth', sleepIcon: 'ship',
    spend: [{ key: 'kochiBus' }, { key: 'shipSecond', transport: true }, { key: 'meal', qty: 1 }],
  },
  sailArriveAgatti: {
    icon: 'wave', place: 'At sea → Agatti', nav: 'Agatti', photo: 'agatti',
    title: 'Wake up in the lagoon',
    plan: ['Dolphins off the bow, with luck', 'Boat transfer to the jetty', 'Homestay host meets you'],
    sleep: 'Agatti homestay', sleepIcon: 'home',
    spend: [{ key: 'homestayAgattiRoom', perRoom: true }, { key: 'meal', qty: 1 }],
  },
  agattiLagoon: {
    icon: 'snorkel', place: 'Agatti', nav: 'Agatti', photo: 'lagoon',
    title: 'Lagoon day',
    plan: ['Reef snorkel, turtles likely', 'Kayak when the wind drops', 'Low tide: walk to Kalpitti sandbank'],
    sleep: 'Agatti homestay', sleepIcon: 'home',
    spend: [{ key: 'homestayAgattiRoom', perRoom: true }, { key: 'snorkel', optional: 'snorkel' }, { key: 'kayak', optional: 'kayak' }, { key: 'meal', qty: 1 }],
  },
  bangaram: {
    icon: 'boat', place: 'Bangaram · Thinnakara', nav: 'Bangaram', photo: 'bangaram',
    title: 'Resort islands, no resort bill',
    plan: ['Shared day boat, ~1 h each way', 'Clearest water of the trip', 'Pack lunch; nothing to buy there'],
    sleep: 'Agatti homestay', sleepIcon: 'home',
    spend: [{ key: 'bangaramBoat', optional: 'bangaram' }, { key: 'homestayAgattiRoom', perRoom: true }, { key: 'meal', qty: 1 }],
  },
  agattiScuba: {
    icon: 'dive', place: 'Agatti', nav: 'Agatti', photo: 'lagoon',
    title: 'Under, then across',
    plan: ['Discover Scuba, 2 h, no cert needed', 'Walk the island end to end at golden hour', 'Confirm tomorrow’s vessel time'],
    sleep: 'Agatti homestay', sleepIcon: 'home',
    spend: [{ key: 'scuba', optional: 'scuba' }, { key: 'homestayAgattiRoom', perRoom: true }, { key: 'meal', qty: 1 }],
  },
  toKavaratti: {
    icon: 'boat', place: 'Agatti → Kavaratti', nav: 'Kavaratti', photo: 'boat',
    title: 'Two hours of open water',
    plan: ['High-speed vessel, sit shaded side', 'Ujra Mosque driftwood ceiling', 'Only island with ATMs, take cash'],
    sleep: 'Kavaratti homestay', sleepIcon: 'home',
    spend: [{ key: 'speedVessel', transport: true }, { key: 'homestayKavarattiRoom', perRoom: true }, { key: 'meal', qty: 2 }],
  },
  kavaratti: {
    icon: 'glass', place: 'Kavaratti', nav: 'Kavaratti', photo: 'kavaratti',
    title: 'The big calm lagoon',
    plan: ['Govt Water Sports Centre: cheapest in the islands', 'Glass-bottom boat while it is glassy', 'Float. That is the plan.'],
    sleep: 'Kavaratti homestay', sleepIcon: 'home',
    spend: [{ key: 'glassBottom', optional: 'glassBottom' }, { key: 'homestayKavarattiRoom', perRoom: true }, { key: 'meal', qty: 2 }],
  },
  sailKavarattiKochi: {
    icon: 'ship', place: 'Kavaratti → at sea', nav: 'Ship', photo: 'ship',
    title: 'Board at dusk',
    plan: ['Last swim, bags held by the homestay', 'Ship ~16–18 h; meals included', 'Shawl + seasickness tablets'],
    sleep: 'On board, seat or berth', sleepIcon: 'ship',
    spend: [{ key: 'shipSecond', transport: true }, { key: 'meal', qty: 1 }],
  },
  atSeaKochi: {
    icon: 'wave', place: 'At sea → Kochi', nav: 'Kochi', photo: 'kochi',
    title: 'A day of blue',
    plan: ['Open sea until evening', 'Dock at Willingdon Island, bus to Fort Kochi', 'Harbour-front seafood'],
    sleep: 'Zostel dorm, Fort Kochi', sleepIcon: 'bunk',
    spend: [{ key: 'kochiBus' }, { key: 'hostelKochi' }, { key: 'meal', qty: 2 }],
  },
  vesselBackAgatti: {
    icon: 'boat', place: 'Kavaratti → Agatti', nav: 'Agatti', photo: 'boat',
    title: 'Back across the channel',
    plan: ['Morning vessel to Agatti', 'Spare afternoon in the lagoon', 'Early night for the 09:20 flight'],
    sleep: 'Agatti homestay', sleepIcon: 'home',
    spend: [{ key: 'speedVessel', transport: true }, { key: 'homestayAgattiRoom', perRoom: true }, { key: 'meal', qty: 2 }],
  },
  flyAgattiKochi: {
    icon: 'plane', place: 'Agatti → Kochi', nav: 'Kochi', photo: 'agatti',
    title: 'Atoll from the window seat',
    plan: ['FLY91 09:20 → 10:35', 'Bus to Fort Kochi', 'Mattancherry: palace, synagogue, spice streets'],
    sleep: 'Zostel dorm, Fort Kochi', sleepIcon: 'bunk',
    spend: [{ key: 'agattiKochiAir', transport: true }, { key: 'kochiBus' }, { key: 'hostelKochi' }, { key: 'meal', qty: 3 }],
  },
  flyKochiDel: {
    icon: 'plane', place: 'Kochi → Delhi', nav: 'Delhi',
    title: 'Home by night',
    plan: ['Morning in Mattancherry', '10:50 bus to the airport', 'COK → DEL afternoon flight'],
    sleep: 'Home', sleepIcon: 'moon',
    spend: [{ key: 'kochiBus' }, { key: 'kochiDel', transport: true }, { key: 'meal', qty: 2 }],
  },
  samudramBoard: {
    icon: 'ship', place: 'Kochi → at sea', nav: 'Ship', photo: 'ship',
    title: 'Board M.V. Kavaratti',
    plan: ['SPORTS check-in at the wharf', 'Cabin, meals and every transfer are in the package', 'Sail at dusk'],
    sleep: 'Cabin on board', sleepIcon: 'ship',
    spend: [{ key: 'kochiBus' }, { key: 'samudramGold', package: true }, { key: 'meal', qty: 1 }],
  },
  samudramMinicoy: {
    icon: 'snorkel', place: 'Minicoy', nav: 'Minicoy',
    title: 'Southernmost atoll',
    plan: ['Lighthouse, lagoon, race boats', 'Back on board by evening', 'Sail north overnight'],
    sleep: 'Cabin on board', sleepIcon: 'ship',
    spend: [],
  },
  samudramKavaratti: {
    icon: 'glass', place: 'Kavaratti', nav: 'Kavaratti', photo: 'kavaratti',
    title: 'Capital for a day',
    plan: ['Glass-bottom boat, lagoon swim', 'Marine aquarium, Ujra Mosque', 'Sail overnight'],
    sleep: 'Cabin on board', sleepIcon: 'ship',
    spend: [],
  },
  samudramKalpeni: {
    icon: 'wave', place: 'Kalpeni', nav: 'Kalpeni',
    title: 'Three islets, one lagoon',
    plan: ['Kayak and snorkel the shallow lagoon', 'Storm bank of coral debris', 'Last night at sea'],
    sleep: 'Cabin on board', sleepIcon: 'ship',
    spend: [],
  },
  samudramReturn: {
    icon: 'ship', place: 'At sea → Kochi', nav: 'Kochi', photo: 'kochi',
    title: 'Back to Willingdon Island',
    plan: ['Dock by morning', 'Bus to Fort Kochi', 'Free afternoon in the old town'],
    sleep: 'Zostel dorm, Fort Kochi', sleepIcon: 'bunk',
    spend: [{ key: 'kochiBus' }, { key: 'hostelKochi' }, { key: 'meal', qty: 2 }],
  },
};
