// Where each number came from. Keyed by PRICES[*].source.

export const SOURCES = {
  happyfares: {
    name: 'HappyFares / Air India Express / momondo — Delhi→Kochi fares',
    url: 'https://www.happyfares.in/flights/delhi-kochi-cheap-airtickets',
    note: 'Lowest non-stop fares by month: Sep ₹8,646, Oct ₹10,667. AIX shows ₹8,958 (8 Sep) and ₹10,662 (18 Oct); momondo found ₹9,554 for 28 Sep.',
  },
  fly91tariff: {
    name: 'FLY91 official tariff sheet (FLY91/SRM/FF/2026/75, effective 19 Aug 2026)',
    url: 'https://fly91.in/resources/tariff-sheet.pdf',
    note: 'Cochin→Agatti base fare buckets ₹1,818 → ₹14,675 + ₹425 fuel surcharge; ex-Cochin PHF ₹86 + UDF ₹319 + ASF ₹236 + 5% GST. Bucket 1 ≈ ₹3,000 all-in; bucket 3 ≈ ₹3,500. Two flights most days (IC 3102 11:00, IC 3104 13:55).',
  },
  fly91schedule: {
    name: 'FLY91 flight schedule (from 7 Jul 2026)',
    url: 'https://fly91.in/resources/flight-schedule.pdf',
    note: 'COK→AGX IC 3102 ~11:00 and IC 3104 ~13:55; AGX→COK IC 3101 ~09:20 and IC 3103 ~12:35; days vary. Also North Goa ⇄ Agatti.',
  },
  easemytrip: {
    name: 'EaseMyTrip / ixigo — Kochi→Agatti (Alliance Air, IndiGo)',
    url: 'https://www.ixigo.com/cheap-flights/kochi-agatti-island-cok-agx',
    note: 'Alliance Air 9I-505 ₹5,500–₹6,100; IndiGo 09:50 departure. Kept as the fallback if FLY91 low buckets are gone.',
  },
  shipfares: {
    name: 'TripTravelingGuide + indianislands.com — ship fares by class',
    url: 'https://triptravelingguide.com/kochi-to-lakshadweep-ship-ticket-price/',
    note: 'Tourist/second class ₹1,750–₹2,500 (MV Amindivi, Minicoy, Kavaratti, Arabian Sea, Corals, Lagoons); first class ₹3,000–₹6,000. Fares include meals, boat transfer and taxes.',
  },
  shipbooking: {
    name: 'Lakshadweep Port Dept — ship ticket booking',
    url: 'https://lakport.utl.gov.in/',
    note: 'Official ticketing. Sailings are not daily; schedules are published a few weeks ahead and change with sea state.',
  },
  keralaexpress: {
    name: 'Kerala Express 12626 — fare chart, New Delhi → Ernakulam Town',
    url: 'https://indiarailinfo.com/train/farechart/fare-enquiry-kerala-express-12626/936/664/51',
    note: 'Daily 20:10 from New Delhi; 2,811 km. Sleeper ₹885, AC 3-tier ₹2,080–₹2,335, AC 2-tier ₹3,085–₹3,495. Ernakulam reached on the evening of day 3.',
  },
  epermit: {
    name: 'Lakshadweep ePermit portal',
    url: 'https://epermit.utl.gov.in/',
    note: 'Max 6 applicants per form. Sponsorship and PCC no longer required for tourists. Apply ≥14 days before entry.',
  },
  epermitfees: {
    name: 'ePermit fee schedule',
    url: 'https://epermit.utl.gov.in/user/document_download/fees/20',
    note: '₹50 application fee per applicant; heritage fee ₹200 (18+) or ₹100 (12–18).',
  },
  hindu: {
    name: 'The Hindu — permit rules eased (29 Apr 2026)',
    url: 'https://www.thehindu.com/news/national/kerala/lakshadweep-administration-eases-tourist-entry-permit-rules/article70920950.ece',
    note: 'List every island you visit or transit; transit at Agatti/Kavaratti.',
  },
  samudram: {
    name: 'SPORTS Lakshadweep — Samudram cruise package tariff (from 1 Oct 2025)',
    url: 'http://www.samudram.utl.gov.in/sprt_Packages.aspx',
    note: 'Gold: ₹23,000 transport + ₹10,500 tour + 5% GST = ₹35,175/adult. Diamond ₹44,625. 5 days: Kochi → Minicoy → Kavaratti → Kalpeni → Kochi, nights on board, meals included. No govt resort at Agatti.',
  },
  dreamtrip: {
    name: 'DreamTripGuide — Lakshadweep on a budget (Jan 2026)',
    url: 'https://dreamtripguide.com/how-to-visit-lakshadweep-on-a-budget-in-2026-permit-ferry-guide/',
    note: 'Homestay ₹2,500–₹4,000/room, meals ₹150–₹250, Bangaram day boat ₹2,000–₹3,000, Kavaratti vessel ~₹1,000.',
  },
  homestays: {
    name: 'lakshadweep-hotels.com — Agatti homestay listings, Oct 2026',
    url: 'https://lakshadweep-hotels.com/stay/al-fouz-home-stay-agatti/',
    note: 'Al Fouz and Hira Residency list ₹4,000/room/night (2 guests); Homely Comforts ₹5,000. Use the slider if you cannot negotiate lower.',
  },
  watersports: {
    name: 'Kartikey Travels / TravelWiseGuide — 2026 water-sports price lists',
    url: 'https://travelwiseguide.com/lakshadweep-water-sports-guide/',
    note: 'Discover Scuba ₹3,500 (Agatti), snorkel ₹800–₹1,500, kayak ₹500–₹1,000, glass-bottom ₹1,000–₹2,000.',
  },
  zostel: {
    name: 'Zostel Kochi (Fort Kochi) rates',
    url: 'https://www.transpireholidays.com/zostel-fort-kochi/',
    note: '4-bed AC dorm ₹699, 6-bed ₹649, private ₹2,999.',
  },
  kochitransfer: {
    name: 'CIAL bus timings + Fort Kochi transfer fares',
    url: 'https://m.cial.aero/Pages/Bus-Timings',
    note: 'KSRTC AC bus ₹50–₹100 (~1h35–2h); app cab ₹600–₹1,200.',
  },
  tripadvisor: {
    name: 'TripAdvisor forum — inter-island vessels',
    url: 'https://www.tripadvisor.in/ShowTopic-g297640-i9203-k11173730-Mode_of_transport_from_Agatti_Island_to_Kavaratti-Lakshadweep.html',
    note: 'No inter-island boats 15 May – 15 Sep (monsoon); schedules change often.',
  },
};
