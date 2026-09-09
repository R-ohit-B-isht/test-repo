// Approximate pins for every on-route pick (lat, lng, to ~3 decimals — the
// landmark, not the ticket desk). Used for straight-line hops between two
// picks on the same day and for map pins. Off-route extras have no pin: they
// never share a day with anything.
export const GEO = {
  // Hoi An
  hoianOldTown: [15.877, 108.326], hoianTicket: [15.877, 108.327], hoianNightMarket: [15.876, 108.327],
  anBang: [15.911, 108.342], hoianBoat: [15.877, 108.328], bayMau: [15.881, 108.371], mySon: [15.764, 108.124],
  tailor: [15.878, 108.330], hoianMemories: [15.871, 108.339], hoianFoodTour: [15.877, 108.327],
  anHoiBars: [15.876, 108.325], vinNamHoian: [15.772, 108.427],
  // Da Nang
  marble: [16.004, 108.263], myKhe: [16.062, 108.247], dragonBridge: [16.061, 108.227], sonTra: [16.100, 108.278],
  banaHills: [15.996, 107.996], sonTraMarket: [16.064, 108.234], helio: [16.038, 108.224], sky36: [16.072, 108.224],
  anThuong: [16.052, 108.244], asiaPark: [16.038, 108.227],
  // Hue
  hueCitadel: [16.470, 107.579], thienMu: [16.453, 107.545], tuDuc: [16.433, 107.563], khaiDinh: [16.399, 107.590],
  hueWalk: [16.465, 107.590], perfumeRiver: [16.465, 107.591], dmzBar: [16.468, 107.592], hueWalkingStreet: [16.468, 107.594],
  hoThuyTien: [16.411, 107.557], dongBa: [16.473, 107.588],
  // Hanoi
  hoanKiem: [21.029, 105.852], oldQuarter: [21.034, 105.850], trainStreet: [21.032, 105.844], beerStreet: [21.035, 105.852],
  hanoiFoodWalk: [21.034, 105.851], minhJazz: [21.024, 105.856], hanoiNightMarket: [21.034, 105.851], waterPuppets: [21.031, 105.853],
  literature: [21.028, 105.836], eggCoffee: [21.033, 105.854], hoaLo: [21.025, 105.846], ethnology: [21.041, 105.799],
  longBien: [21.044, 105.858], dongXuan: [21.038, 105.849], trangTien: [21.026, 105.854], baoSon: [21.005, 105.716],
  // Ninh Binh
  ninhbinhTour: [20.256, 105.921], tamCoc: [20.215, 105.935], trangAn: [20.256, 105.921], muaCave: [20.229, 105.929], hoaLu: [20.283, 105.907],
  // Ha Long
  halongDay: [20.921, 106.997], sungSot: [20.859, 107.079], titop: [20.856, 107.088], kayak: [20.880, 107.070],
  halongOvernight: [20.921, 106.997], sunWorldHalong: [20.953, 107.047],
};

export const pinOf = (x) => GEO[x?.id] || null;

// Town centres, for the weather forecast and "where am I" questions.
export const STOP_GEO = {
  hanoi: [21.028, 105.854], ninhbinh: [20.254, 105.975], halong: [20.951, 107.078],
  hue: [16.463, 107.590], danang: [16.054, 108.202], hoian: [15.880, 108.338],
};

const R = 6371;
const rad = (d) => (d * Math.PI) / 180;
export function kmBetween(a, b) {
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Straight-line km × 1.3 for roads, at 22 km/h (city Grab incl. pickup), 5 min floor.
export const ROAD = 1.3;
export const KMH = 22;
export const hopMinutes = (km) => Math.max(5, Math.round((km * ROAD) / KMH * 60 / 5) * 5);

// Minutes between two picks, or null when either has no pin.
export function travelBetween(a, b) {
  const p = pinOf(a);
  const q = pinOf(b);
  if (!p || !q) return null;
  const km = kmBetween(p, q);
  return { km: Math.round(km * 10) / 10, min: hopMinutes(km) };
}
