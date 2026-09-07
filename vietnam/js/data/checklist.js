// Booking order. `lead` = days before departure to have it done.
// `when` is only for strategies that include that leg; omit for all.
export const CHECKLIST = [
  { id: 'evisa', icon: 'passport', title: 'Apply for the e-visa', hint: 'US$25 · official portal only · 3 working days', lead: 21, price: 'evisa' },
  { id: 'flyIn', icon: 'plane', title: 'Book Delhi → Hanoi', hint: 'One-way. Tue/Wed departures run cheaper.', lead: 45, price: 'delHan', not: ['roundtrip'] },
  { id: 'flyOut', icon: 'plane', title: 'Book Da Nang → Delhi', hint: 'One-way, connecting. Check the layover length.', lead: 45, price: 'dadDel', not: ['roundtrip'] },
  { id: 'flyRt', icon: 'plane', title: 'Book Delhi ↔ Hanoi return', hint: 'Plus the Da Nang → Hanoi hop for day 8.', lead: 45, price: 'delHanReturn', only: ['roundtrip'] },
  { id: 'train', icon: 'train', title: 'Book the SE1 sleeper', hint: 'dsvn.vn is official. Lower berth, even-numbered car.', lead: 14, price: 'train6', only: ['train', 'roundtrip'] },
  { id: 'bus', icon: 'bus', title: 'Book the sleeper bus', hint: 'Vexere. Cabin bus if you are tall.', lead: 7, price: 'busHanHue', only: ['bus'] },
  { id: 'hop', icon: 'plane', title: 'Book Hanoi → Da Nang', hint: 'VietJet / Bamboo. Cabin bag only.', lead: 21, price: 'hanDad', only: ['fly'] },
  { id: 'hanoiBed', icon: 'bed', title: 'Hanoi beds, 3 nights', hint: 'Old Quarter, free cancellation.', lead: 14 },
  { id: 'centralBed', icon: 'bed', title: 'Hue + Hoi An beds', hint: '1 night Hue, 2 nights Hoi An homestay.', lead: 14 },
  { id: 'tours', icon: 'boat', title: 'Ninh Binh + Ha Long tours', hint: 'Book at your hostel, often cheaper than online.', lead: 2 },
  { id: 'sim', icon: 'sparkle', title: 'eSIM + cash plan', hint: 'Viettel eSIM before you fly. Carry ₫ for entries.', lead: 2, price: 'sim' },
  { id: 'rain', icon: 'rain', title: 'Pack for central rain', hint: 'Light shell, dry bag, sandals. Check typhoon news day 4.', lead: 1 },
];

export const stepsFor = (strategyId) =>
  CHECKLIST.filter((c) => (!c.only || c.only.includes(strategyId)) && (!c.not || !c.not.includes(strategyId)))
    .sort((a, b) => b.lead - a.lead);
