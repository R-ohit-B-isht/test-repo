// Transport sources: flights, ships, train, permits. `seen` = when the page was read.
export const TRANSPORT_SOURCES = {
  gflightsDelCok: {
    name: 'Google Flights — DEL → COK, Tue 6 Oct 2026, one way',
    url: 'https://www.google.com/travel/flights?q=Flights%20from%20DEL%20to%20COK%20on%202026-10-06%20one%20way%20economy&curr=INR&hl=en&gl=IN',
    seen: '2026-09-07',
    note: 'Cheapest ₹10,716: IndiGo non-stop 05:55–09:05 and 17:10–20:20. Air India 15:25–18:40 ₹11,156. 8 Oct showed ₹10,659.',
  },
  gflightsCokDel: {
    name: 'Google Flights — COK → DEL, Thu 15 Oct 2026, one way',
    url: 'https://www.google.com/travel/flights?q=Flights%20from%20COK%20to%20DEL%20on%202026-10-15%20one%20way%20economy&curr=INR&hl=en&gl=IN',
    seen: '2026-09-07',
    note: 'Cheapest non-stop IndiGo ₹10,794; one-stop IndiGo 18:15–23:30 ₹10,746; Air India ₹11,137. Google flagged possible air-traffic disruption.',
  },
  gflightsCokAgx: {
    name: 'Google Flights — COK → AGX, Wed 7 Oct 2026, one way',
    url: 'https://www.google.com/travel/flights?q=Flights%20from%20COK%20to%20AGX%20on%202026-10-07%20one%20way%20economy&curr=INR&hl=en&gl=IN',
    seen: '2026-09-07',
    note: 'IndiGo non-stop ₹9,559. FLY91 listed with schedule only, “price unavailable”. DEL → AGX direct on 6 Oct returned no options.',
  },
  gflightsAgxCok: {
    name: 'Google Flights — AGX → COK, Wed 14 Oct 2026, one way',
    url: 'https://www.google.com/travel/flights?q=Flights%20from%20AGX%20to%20COK%20on%202026-10-14%20one%20way%20economy&curr=INR&hl=en&gl=IN',
    seen: '2026-09-07',
    note: 'IndiGo non-stop 11:45–13:05 ₹20,185; IndiGo one-stop ₹25,980; FLY91 09:40–11:10 “price unavailable”.',
  },
  fly91booking: {
    name: 'FLY91 booking flow — COK ⇄ AGX, Oct 2026',
    url: 'https://fly91.in/',
    seen: '2026-09-07',
    note: 'COK→AGX 7 Oct IC 3102 11:50–13:25 ₹10,000 + convenience fee, 3 seats at that fare; 8–11 Oct ₹8,001–8,502. AGX→COK 14 Oct IC 3101 09:50–11:10 ₹16,500 + fee, 1 seat; 15 Oct sold out.',
  },
  fly91tariff: {
    name: 'FLY91 official tariff sheet (FLY91/SRM/FF/2026/75, from 19 Aug 2026)',
    url: 'https://fly91.in/resources/tariff-sheet.pdf',
    seen: '2026-09-06',
    note: 'Cochin→Agatti base buckets ₹1,818 → ₹14,675 + ₹425 fuel + taxes: ₹3,000 (bucket 1) to ≈ ₹17,500 all-in. Low buckets were gone for 6–14 Oct when checked.',
  },
  fly91schedule: {
    name: 'FLY91 flight schedule (from 7 Jul 2026)',
    url: 'https://fly91.in/resources/flight-schedule.pdf',
    seen: '2026-09-06',
    note: 'COK→AGX IC 3102 / 3104; AGX→COK IC 3101 / 3103; days vary. Also North Goa ⇄ Agatti.',
  },
  irctcShip: {
    name: 'Sail to Lakshadweep — official IRCTC ship-ticket portal (live since 5 Dec 2025)',
    url: 'https://lakshadweep.irctc.co.in/',
    seen: '2026-09-07',
    note: 'Ports: Kochi, Beypore, Mangalore, Agatti, Kavaratti, Minicoy, Kadmat, Kalpeni, Andrott, Amini, Kiltan, Chetlat, Bitra, Bangaram. Replaces lakport.utl.gov.in (now “under decommissioning”).',
  },
  irctcAlerts: {
    name: 'Sail to Lakshadweep — alerts (booking windows)',
    url: 'https://lakshadweep.irctc.co.in/',
    seen: '2026-09-07',
    note: 'Bookings open ~6 days before sailing: MV Lakshadweep Sea (Kochi 14 Sep) opened 8 Sep 14:00; MV Lagoons (15 Sep) opened 8 Sep 15:00. October sailings were not yet published.',
  },
  shipfares: {
    name: 'TripTravelingGuide — mainland ⇄ island tourist fares (2025 administration order)',
    url: 'https://triptravelingguide.com/mangalore-to-lakshadweep-ship-ticket-price-2026/',
    seen: '2026-09-07',
    note: 'Kochi→Agatti: bunk ₹2,480, 2nd ₹5,930, 1st ₹9,240. Kochi→Kavaratti: bunk ₹2,100, 2nd ₹5,340, 1st ₹8,150. Bunk = shared AC hall; 2nd = 4-berth cabin; 1st = 2-berth. Older guides quote ₹2,200 “second class”: treat as the bunk tier.',
  },
  keralaexpress: {
    name: 'Kerala Express 12626 — fare chart, New Delhi → Ernakulam Town',
    url: 'https://indiarailinfo.com/train/farechart/fare-enquiry-kerala-express-12626/936/664/51',
    seen: '2026-09-06',
    note: 'Daily 20:10 from New Delhi; 2,811 km. Sleeper ₹885, AC 3-tier ₹2,080–₹2,335. Ernakulam on the evening of day 3. Fixed fares, no surge.',
  },
  epermit: {
    name: 'Lakshadweep ePermit portal',
    url: 'https://epermit.utl.gov.in/',
    seen: '2026-09-06',
    note: 'Max 6 applicants per form. Sponsorship and PCC no longer required for tourists. Apply ≥14 days before entry; list every island you touch.',
  },
  epermitfees: {
    name: 'ePermit fee schedule',
    url: 'https://epermit.utl.gov.in/user/document_download/fees/20',
    seen: '2026-09-06',
    note: '₹50 application fee per applicant; heritage fee ₹200 (18+) or ₹100 (12–18).',
  },
  samudram: {
    name: 'SPORTS Lakshadweep — Samudram cruise package (tariff from 1 Oct 2025)',
    url: 'http://www.samudram.utl.gov.in/sprt_Packages.aspx',
    seen: '2026-09-07',
    note: 'Five days on M.V. Kavaratti: Minicoy, Kavaratti, Kalpeni by day, nights aboard, meals included. Gold ₹23,000 + ₹10,500 tour + 5% GST = ₹35,175; Diamond ₹44,625; +10% in Dec. Sailing dates fixed by SPORTS.',
  },
  kochitransfer: {
    name: 'CIAL bus timings + Fort Kochi transfer fares',
    url: 'https://m.cial.aero/Pages/Bus-Timings',
    seen: '2026-09-06',
    note: 'KSRTC AC bus ₹50–₹100 (~1h35–2h); app cab ₹600–₹1,200.',
  },
  tripadvisor: {
    name: 'TripAdvisor forum — inter-island vessels',
    url: 'https://www.tripadvisor.in/ShowTopic-g297640-i9203-k11173730-Mode_of_transport_from_Agatti_Island_to_Kavaratti-Lakshadweep.html',
    seen: '2026-09-06',
    note: 'No inter-island boats 15 May – 15 Sep (monsoon); schedules change often. Kadmat, Amini, Kiltan, Chetlat, Bitra, Andrott need a ship port call or a separate vessel.',
  },
};
