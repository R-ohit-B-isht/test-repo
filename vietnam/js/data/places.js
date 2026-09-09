// Where the named eat / sleep / transit places are, for the street map.
// Coordinates looked up on OpenStreetMap (Nominatim, 9 Sep 2026) for the
// exact address in days.js; the hostel came from its listing page. A meal
// with no entry here is eaten on board or inside an activity and has no pin
// of its own — the map never guesses a spot.

export const EAT_GEO = {
  'Central Market food court': [15.8768, 108.3313],
  'Cơm Gà Bà Buội': [15.8785, 108.3304],
  'Cao Lầu Thanh': [15.8817, 108.3286],
  'Madam Khanh': [15.8806, 108.3279],
  'Bánh Mì Phượng': [15.8785, 108.3320],
  'Mì Quảng 1A': [16.0724, 108.2191],
  'Quán Hạnh': [16.4663, 107.5951],
  'Bún Bò Huế Bà Tuyết': [16.4714, 107.5971],
  'Lạc Thiện': [16.4687, 107.5851],
  'Bánh Bèo Bà Đỏ': [16.4823, 107.5893],
  'Xôi Yến': [21.0338, 105.8545],
  'Bún Chả Hương Liên': [21.0181, 105.8539],
  'Phở 10 Lý Quốc Sư': [21.0305, 105.8488],
  'Bánh Mì 25': [21.0362, 105.8487],
  'Bún Chả Đắc Kim': [21.0320, 105.8482],
  'Phở Gia Truyền Bát Đàn': [21.0336, 105.8464],
  'Café Giảng': [21.0336, 105.8546],
};

export const STAY_GEO = {
  'SacLo Villa & Hostel': [15.8819, 108.3416],
  'Hue Imperial Hostel': [16.4696, 107.5947],
  'Nexy Hostel': [21.0326, 105.8501],
};

// Stations and airports the fixed legs leave from / arrive at.
export const HUBS = [
  { id: 'dad', stop: 'danang', name: 'Da Nang airport (DAD)', icon: 'plane', lat: 16.0439, lng: 108.1994 },
  { id: 'danangStation', stop: 'danang', name: 'Da Nang railway station', icon: 'train', lat: 16.0716, lng: 108.2093 },
  { id: 'hueStation', stop: 'hue', name: 'Hue railway station', icon: 'train', lat: 16.4564, lng: 107.5781 },
  { id: 'hanoiStation', stop: 'hanoi', name: 'Hanoi railway station', icon: 'train', lat: 21.0242, lng: 105.8411 },
  { id: 'han', stop: 'hanoi', name: 'Noi Bai airport (HAN)', icon: 'plane', lat: 21.2212, lng: 105.8072 },
];

// A meal named "X, to go" is the same place as "X".
export const eatKey = (name) => name.replace(/,\s*to go$/i, '');
