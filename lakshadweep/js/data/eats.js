// Named places to eat. `incl` = already paid by a ticket or package (no meal
// charge); otherwise one `meal` unit is budgeted. Prices are listing leads.
export const EATS = {
  kayees: { name: 'Kayees Rahmathulla Cafe', sub: 'Mattancherry · biryani ₹150', source: 'kayees' },
  fortKochi: { name: 'Fort Kochi “hotel”', sub: 'Fish curry meals ₹150–250', source: 'dreamtrip' },
  harbour: { name: 'Harbour-front stalls', sub: 'Fort Kochi · grilled fish', source: 'dreamtrip' },
  airport: { name: 'Airport / on the way', sub: 'Budget ₹200', source: 'dreamtrip' },
  delhi: { name: 'Delhi, before the flight', sub: 'Budget ₹200', source: 'dreamtrip' },
  pantry: { name: 'Train pantry / platform', sub: 'Thali ₹100–200', source: 'dreamtrip' },
  shipCanteen: { name: 'Ship canteen', sub: 'Budgeted ₹200; some fares include meals', source: 'shipfares' },
  homestay: { name: 'Homestay kitchen', sub: 'Ask the host · ₹150–250', source: 'dreamtrip' },
  cucumber: { name: 'Cucumber City', sub: 'Agatti · 16:00–23:00 · ₹200–400', source: 'agattiEats' },
  fryKing: { name: 'Fry King', sub: 'Agatti, Kalladi Rd · ₹200–400', source: 'agattiEats' },
  packed: { name: 'Packed lunch', sub: 'From the homestay; nothing to buy on Bangaram', source: 'dreamtrip' },
  kavarattiHotel: { name: 'Jetty-road “hotels”', sub: 'Kavaratti · ask the homestay', source: 'dreamtrip' },
  samudram: { name: 'On board M.V. Kavaratti', sub: 'All meals in the package', incl: 'package', source: 'samudram' },
  samudramShore: { name: 'Packed by the ship', sub: 'Shore-day meals in the package', incl: 'package', source: 'samudram' },
};
