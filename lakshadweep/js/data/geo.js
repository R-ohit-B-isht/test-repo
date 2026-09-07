// Coordinates used to draw the map to scale. `side` = which side the label sits
// on. Island points are approximate atoll centres (see source wikiLakshadweep).
export const PLACES = {
  Delhi: { lat: 28.56, lon: 77.1, code: 'DEL', side: 'w' },
  Kochi: { lat: 10.15, lon: 76.4, code: 'COK', side: 'e' },
  Agatti: { lat: 10.82, lon: 72.18, code: 'AGX', side: 'w' },
  Bangaram: { lat: 10.94, lon: 72.28, side: 'e' },
  Thinnakara: { lat: 10.95, lon: 72.34, side: 'e' },
  Kalpitti: { lat: 10.78, lon: 72.16, side: 'w' },
  Kavaratti: { lat: 10.57, lon: 72.64, side: 'e' },
  Pitti: { lat: 10.78, lon: 72.63, side: 'e' },
  Suheli: { lat: 10.08, lon: 72.3, side: 'w' },
  Amini: { lat: 11.12, lon: 72.73, side: 'e' },
  Kadmat: { lat: 11.22, lon: 72.78, side: 'e' },
  Kiltan: { lat: 11.48, lon: 73.0, side: 'e' },
  Chetlat: { lat: 11.69, lon: 72.71, side: 'e' },
  Bitra: { lat: 11.6, lon: 72.18, side: 'w' },
  Andrott: { lat: 10.82, lon: 73.68, side: 'e' },
  Kalpeni: { lat: 10.08, lon: 73.63, side: 'e' },
  Cheriyam: { lat: 10.13, lon: 73.66, side: 'e' },
  Tilakkam: { lat: 10.1, lon: 73.61, side: 'w' },
  Minicoy: { lat: 8.28, lon: 73.05, side: 'e' },
};

// Islands drawn inside the Agatti lens (within ~25 km of Agatti).
export const AGATTI_CLUSTER = new Set(['Agatti', 'Bangaram', 'Thinnakara', 'Kalpitti']);
