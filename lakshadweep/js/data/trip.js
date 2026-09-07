// Trip constants, booking checklist, design credits. Coordinates live in geo.js,
// places and activities in catalogue.js.

export const TRIP = {
  title: 'Lakshadweep',
  start: '2026-10-06',
  permitLeadDays: 14,
  quotedRoundTrip: 40000,
  observedWindow: '6–7 Sep 2026',
  origin: 'Delhi (DEL)',
};

// Booking steps. `before` = days before departure; `for` = strategy ids (omit for all).
export const CHECKLIST = [
  { id: 'train', before: 60, for: ['train-sail'], icon: 'train', text: 'Kerala Express 12626 New Delhi → Ernakulam on IRCTC. Booking opens 60 days out.', link: 'keralaexpress' },
  { id: 'samudram', before: 45, for: ['samudram'], icon: 'ship', text: 'Samudram cruise (Gold) through SPORTS. Dates are fixed by their sailing calendar.', link: 'samudram' },
  { id: 'ship', before: 21, for: ['train-sail', 'sail-both', 'fly-sail'], icon: 'ship', text: 'Watch lakshadweep.irctc.co.in: October sailings publish late and bookings open ~6 days before. Sailing dates set everything else.', link: 'irctcAlerts' },
  { id: 'stay', before: 19, for: ['train-sail', 'sail-both', 'fly-sail', 'fly-both'], icon: 'home', text: 'Homestays: Agatti (Al Fouz / Hira) + Kavaratti (Sithsyan). Ask for meals and the boat trips.', link: 'homestays' },
  { id: 'permit', before: 14, icon: 'permit', text: 'ePermit: list every island you touch. No sponsor, no PCC. ₹250 each.', link: 'epermit' },
  { id: 'agx', before: 12, for: ['fly-sail', 'fly-both'], icon: 'plane', text: 'Kochi ⇄ Agatti: IndiGo or FLY91. 8–11 Oct had ₹8,001 FLY91 fares; 15 Oct return was sold out.', link: 'fly91booking' },
  { id: 'del', before: 12, icon: 'plane', text: 'Delhi ⇄ Kochi: ₹10,716 out on 6 Oct, ₹10,794 back on 15 Oct when checked. Fares move daily.', link: 'gflightsDelCok' },
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
