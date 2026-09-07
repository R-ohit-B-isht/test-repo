// Where each number came from. Keyed by PRICES[*].source.

export const SOURCES = {
  happyfares: {
    name: 'HappyFares — Delhi→Kochi fare tracker',
    url: 'https://www.happyfares.in/flights/delhi-kochi-cheap-airtickets',
    note: 'Lowest non-stop fares by month: Sep ₹8,646, Oct ₹10,667, Nov ₹11,023; typical ₹12,689.',
  },
  easemytrip: {
    name: 'EaseMyTrip — Kochi→Agatti (Alliance Air 9I-505)',
    url: 'https://www.easemytrip.com/flights/kochi-cok-to-agatti-island-agx/',
    note: '₹6,100 fare shown for 12 Aug 2026; ixigo lists ₹5,500 lows on the same route.',
  },
  ixigo: {
    name: 'ixigo — Kochi→Agatti fares',
    url: 'https://www.ixigo.com/cheap-flights/kochi-agatti-island-cok-agx',
    note: '2 non-stop flights daily (Alliance Air 09:05, IndiGo 09:50); lows ₹5,401–₹6,100.',
  },
  shipfares: {
    name: 'TripTravelingGuide — Kochi→Lakshadweep ship fares by class',
    url: 'https://triptravelingguide.com/kochi-to-lakshadweep-ship-ticket-price/',
    note: 'MV Kavaratti / MV Arabian Sea / MV Lakshadweep second class ₹2,200; first class ₹3,500–₹6,000.',
  },
  shipbooking: {
    name: 'Lakshadweep Port Dept — ship ticket booking',
    url: 'https://lakport.utl.gov.in/',
    note: 'Official ticketing. Sailings are not daily; schedules change with season and sea state.',
  },
  epermit: {
    name: 'Lakshadweep ePermit portal',
    url: 'https://epermit.utl.gov.in/',
    note: 'Max 6 applicants per form. Sponsorship and PCC no longer required for tourists.',
  },
  hindu: {
    name: 'The Hindu — permit rules eased (29 Apr 2026)',
    url: 'https://www.thehindu.com/news/national/kerala/lakshadweep-administration-eases-tourist-entry-permit-rules/article70920950.ece',
    note: 'Apply ≥14 days before travel; list every island you visit or transit; transit at Agatti/Kavaratti.',
  },
  dreamtrip: {
    name: 'DreamTripGuide — Lakshadweep on a budget (Jan 2026)',
    url: 'https://dreamtripguide.com/how-to-visit-lakshadweep-on-a-budget-in-2026-permit-ferry-guide/',
    note: 'Homestay ₹2,500–₹4,000/room, meals ₹150–₹250, Bangaram day boat ₹2,000–₹3,000, Kavaratti vessel ~₹1,000.',
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
    note: 'KSRTC AC bus ₹50–₹100 (~1h35–2h); app cab ₹600–₹1,000; departures from Fort Kochi 08:00, 08:40, 09:45, 10:50, 11:35 … 18:50.',
  },
  tripadvisor: {
    name: 'TripAdvisor forum — inter-island vessels',
    url: 'https://www.tripadvisor.in/ShowTopic-g297640-i9203-k11173730-Mode_of_transport_from_Agatti_Island_to_Kavaratti-Lakshadweep.html',
    note: 'No inter-island boats 15 May – 15 Sep (monsoon); schedules change often.',
  },
};

