// Booking order. `lead` = days before departure to have it done.
// `only` / `not` scope a step to strategies; omit for all.
export const CHECKLIST = [
  { id: 'evisa', icon: 'passport', title: 'Apply for the e-visa', hint: 'US$25 · official portal only · 3 working days', lead: 21, price: 'evisa' },
  { id: 'flyIn', icon: 'plane', title: 'Book Delhi → Da Nang, Fri 23 Oct', hint: 'AirAsia X via KUL, 23:20. Lands Sat 10:50. Cabin bag only.', lead: 45, price: 'delDad', not: ['roundtrip'] },
  { id: 'flyOut', icon: 'plane', title: 'Book Hanoi → Delhi, Sat 31 Oct', hint: 'VietJet non-stop 19:10. Add a checked bag only if you must.', lead: 45, price: 'hanDel', not: ['roundtrip'] },
  { id: 'flyRt', icon: 'plane', title: 'Book Delhi ↔ Hanoi return, 24–31 Oct', hint: 'IndiGo non-stop both ways. Then the Hanoi → Da Nang hop.', lead: 45, price: 'delHanReturn', only: ['roundtrip'] },
  { id: 'hopDown', icon: 'plane', title: 'Book Hanoi → Da Nang, Sat 24 Oct', hint: 'Vietravel 16:55 or VietJet 14:35. Cabin bag only.', lead: 30, price: 'hanDad', only: ['roundtrip'] },
  { id: 'train', icon: 'train', title: 'Book the SE20 sleeper, Tue 27 Oct', hint: 'dsvn.vn is official. Lower berth, even-numbered car.', lead: 14, price: 'train6', only: ['train', 'roundtrip'] },
  { id: 'bus', icon: 'bus', title: 'Book the Hue → Hanoi sleeper bus', hint: 'Vexere. Cabin bus if you are tall.', lead: 7, price: 'busHueHan', only: ['bus'] },
  { id: 'hop', icon: 'plane', title: 'Book Hue → Hanoi, Tue 27 Oct', hint: 'VietJet 15:55. Cabin bag only.', lead: 21, price: 'hueHan', only: ['fly'] },
  { id: 'dayTrain', icon: 'train', title: 'Book Da Nang → Hue SE2, Mon 26 Oct', hint: 'Soft seat, 12:46. Left side for the sea.', lead: 14, price: 'trainDadHue' },
  { id: 'centralBed', icon: 'bed', title: 'Hoi An + Hue beds', hint: '2 nights Hoi An (SacLo / Fuse), 1 night Hue (Imperial Hostel).', lead: 14 },
  { id: 'hanoiBed', icon: 'bed', title: 'Hanoi beds, Old Quarter', hint: 'Nexy or Mad Monkey. Free cancellation; 4 nights if you fly north.', lead: 14 },
  { id: 'tours', icon: 'boat', title: 'Ninh Binh + Ha Long tours', hint: 'Book at your hostel, often cheaper than online.', lead: 2 },
  { id: 'sim', icon: 'sparkle', title: 'eSIM + cash plan', hint: 'Viettel eSIM before you fly. Carry ₫ for entries.', lead: 2, price: 'sim' },
  { id: 'rain', icon: 'rain', title: 'Pack for central rain', hint: 'Light shell, dry bag, sandals. Check typhoon news before day 1.', lead: 1 },
];

export const stepsFor = (strategyId) =>
  CHECKLIST.filter((c) => (!c.only || c.only.includes(strategyId)) && (!c.not || !c.not.includes(strategyId)))
    .sort((a, b) => b.lead - a.lead);
