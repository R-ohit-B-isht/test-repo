// Trip constants, optional activities, booking checklist, design credits.

export const TRIP = {
  title: 'Lakshadweep',
  start: '2026-10-06',
  permitLeadDays: 14,
  quotedRoundTrip: 40000,
  observedWindow: 'Aug–Sep 2026',
  origin: 'Delhi (DEL)',
};

// Real coordinates, used to draw the map to scale. `side` = which side the label sits on.
export const PLACES = {
  Delhi: { lat: 28.56, lon: 77.1, code: 'DEL', side: 'w' },
  Kochi: { lat: 10.15, lon: 76.4, code: 'COK', side: 'e' },
  Agatti: { lat: 10.82, lon: 72.18, code: 'AGX', side: 'w' },
  Bangaram: { lat: 10.94, lon: 72.28, side: 'e' },
  Kavaratti: { lat: 10.57, lon: 72.64, side: 'e' },
  Minicoy: { lat: 8.28, lon: 73.05, side: 'e' },
  Kalpeni: { lat: 10.08, lon: 73.63, side: 'e' },
};

// Paid extras. All off by default: the headline number is the essential trip.
export const ACTIVITIES = [
  { id: 'snorkel', label: 'Snorkel boat', key: 'snorkel', icon: 'snorkel', where: 'Agatti' },
  { id: 'kayak', label: 'Kayak', key: 'kayak', icon: 'kayak', where: 'Agatti' },
  { id: 'bangaram', label: 'Bangaram day boat', key: 'bangaramBoat', icon: 'boat', where: 'Bangaram + Thinnakara' },
  { id: 'scuba', label: 'Discover Scuba', key: 'scuba', icon: 'dive', where: 'Agatti' },
  { id: 'glassBottom', label: 'Glass-bottom boat', key: 'glassBottom', icon: 'glass', where: 'Kavaratti' },
];

// Booking steps. `before` = days before departure; `for` = strategy ids (omit for all).
export const CHECKLIST = [
  { id: 'train', before: 60, for: ['train-sail'], icon: 'train', text: 'Kerala Express 12626 New Delhi → Ernakulam on IRCTC. Booking opens 60 days out.', link: 'keralaexpress' },
  { id: 'samudram', before: 45, for: ['samudram'], icon: 'ship', text: 'Samudram cruise (Gold) through SPORTS. Dates are fixed by their sailing calendar.', link: 'samudram' },
  { id: 'ship', before: 21, for: ['train-sail', 'sail-both', 'fly-sail'], icon: 'ship', text: 'Ship tickets at lakport.utl.gov.in. Sailing dates set everything else.', link: 'shipbooking' },
  { id: 'stay', before: 19, for: ['train-sail', 'sail-both', 'fly-sail', 'fly-both'], icon: 'home', text: 'Homestays: Agatti + Kavaratti nights. Ask for breakfast + dinner included.', link: 'homestays' },
  { id: 'permit', before: 14, icon: 'permit', text: 'ePermit: list every island you touch. No sponsor, no PCC. ₹250 each.', link: 'epermit' },
  { id: 'agx', before: 12, for: ['fly-sail', 'fly-both'], icon: 'plane', text: 'FLY91 Kochi ⇄ Agatti. Low fare buckets go first.', link: 'fly91tariff' },
  { id: 'del', before: 12, icon: 'plane', text: 'Delhi ⇄ Kochi flights. Tue/Thu are cheapest; skip the 2 Oct long weekend.', link: 'happyfares' },
  { id: 'zostel', before: 5, icon: 'bunk', text: 'Zostel Fort Kochi dorm beds for the Kochi nights.', link: 'zostel' },
  { id: 'pack', before: 1, icon: 'bag', text: 'Pack: permit printouts ×3, cash (ATMs only in Kavaratti), reef-safe sunscreen, seasickness tablets, shawl.' },
];

export const DESIGN_CREDITS = [
  {
    name: 'Tierra Ignota (Relajaelcoco), Awwwards “Editorial scroll experience”',
    url: 'https://www.awwwards.com/inspiration/an-experience-closer-to-flipping-through-a-travel-journal-than-browsing-a-typical-tourism-site-tierra-ignota',
    taken: 'Sand paper (#f2f0e9) on ink (#191919), 0.5px hairline rules, monospace body, italic serif display, uppercase 0.2em labels, cubic-bezier(.645,.045,.355,1) transitions.',
  },
  {
    name: 'Citymapper / Skyscanner / Wise via Screenroom reference research',
    url: 'https://web-production-f3e51.up.railway.app/',
    taken: 'Route as a node strip with mode icons (Citymapper), price-comparison cards with the cheapest marked (Skyscanner), one oversized savings number framed against the anchor price (Wise).',
  },
  {
    name: 'Emil Kowalski, motion rules',
    url: 'https://github.com/emilkowalski/skills',
    taken: 'Entrances from opacity + translate with cubic-bezier(.23,1,.32,1), press feedback scale(.97) at 160ms, 30–80ms list stagger, everything under 300ms.',
  },
  {
    name: 'Dobidop/easyItinerary (MIT) & alfredang/travelexplorer',
    url: 'https://github.com/Dobidop/easyItinerary',
    taken: 'Vanilla, no-build architecture: data modules as source of truth, per-concern JS modules, localStorage persistence.',
  },
];
