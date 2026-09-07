// Trip constants, optional activities, booking checklist, design credits.

export const TRIP = {
  title: 'Lakshadweep',
  subtitle: 'Ten days in the lagoon, from Delhi, on the cheap.',
  start: '2026-10-06',
  end: '2026-10-15',
  permitDeadline: '2026-09-23',
  quotedRoundTrip: 40000,
  observedWindow: 'Aug–Sep 2026',
  islands: ['Agatti', 'Bangaram', 'Thinnakara', 'Kavaratti'],
  origin: 'Delhi (DEL)',
};

export const ACTIVITIES = [
  { id: 'scuba', label: 'Discover Scuba (Agatti)', key: 'scuba', on: true },
  { id: 'bangaram', label: 'Bangaram + Thinnakara day boat', key: 'bangaramBoat', on: true },
  { id: 'snorkel', label: 'Snorkelling boat trip', key: 'snorkel', on: true },
  { id: 'kayak', label: 'Kayaking', key: 'kayak', on: true },
  { id: 'glassBottom', label: 'Glass-bottom boat (Kavaratti)', key: 'glassBottom', on: true },
];

export const CHECKLIST = [
  { id: 'ship', due: '2026-09-15', text: 'Fix the return sailing (Kavaratti → Kochi, ~13 Oct) at lakport.utl.gov.in. Everything else is booked around this date.', link: 'shipbooking' },
  { id: 'stay', due: '2026-09-17', text: 'Reserve homestays: Agatti 4 nights (7–11 Oct), Kavaratti 2 nights (11–13 Oct). Confirm breakfast + dinner are included.' },
  { id: 'permit', due: '2026-09-23', text: 'Apply for the e-permit — at least 14 days before entry. List Agatti, Bangaram, Thinnakara and Kavaratti. No sponsor, no PCC.', link: 'epermit' },
  { id: 'agx', due: '2026-09-30', text: 'Permit in hand: book Alliance Air 9I-505 Kochi → Agatti for 7 Oct.', link: 'ixigo' },
  { id: 'del', due: '2026-09-30', text: 'Book Delhi ⇄ Kochi for Tue 6 Oct and Thu 15 Oct. Tuesdays and Thursdays are the cheap days; avoid the 2 Oct long weekend.', link: 'happyfares' },
  { id: 'zostel', due: '2026-10-01', text: 'Book Zostel Fort Kochi for the nights of 6 Oct and 14 Oct.', link: 'zostel' },
  { id: 'cab', due: '2026-10-05', text: 'Pre-book the 05:30 cab from Fort Kochi to the airport for 7 Oct.' },
  { id: 'pack', due: '2026-10-05', text: 'Pack: three permit printouts, cash (ATMs only in Kavaratti), reef-safe sunscreen, motion-sickness tablets, a shawl for the ship.' },
];

export const DESIGN_CREDITS = [
  {
    name: 'Tierra Ignota (Relajaelcoco) — Awwwards “Editorial scroll experience”',
    url: 'https://www.awwwards.com/inspiration/an-experience-closer-to-flipping-through-a-travel-journal-than-browsing-a-typical-tourism-site-tierra-ignota',
    taken: 'Sand paper (#f2f0e9) on ink (#191919), 0.5px hairline ledger rules, monospace body at 0.9375rem/1.5rem, italic serif display at 10vw, uppercase 0.2em labels, cubic-bezier(.645,.045,.355,1) transitions, 6rem section margins, expedition cards with date + price ledger.',
  },
  {
    name: 'Emil Kowalski — motion rules',
    url: 'https://github.com/emilkowalski/skills',
    taken: 'Entrances from opacity + translate with cubic-bezier(.23,1,.32,1), press feedback scale(.97) at 160ms, 30–80ms list stagger, everything under 300ms.',
  },
  {
    name: 'Dobidop/easyItinerary (MIT) & alfredang/travelexplorer',
    url: 'https://github.com/Dobidop/easyItinerary',
    taken: 'Vanilla, no-build architecture: one data module as source of truth, per-concern JS modules, budget breakdown driven by user input, localStorage persistence.',
  },
];
