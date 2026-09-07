import { inrFromUsd, inrFromVnd } from './trip.js';

// Every price: rupees per person unless `perGroup`, plus how sure we are.
//   kind: 'observed' = a fare we saw on the page · 'base' = advertised starting
//   fare before bags/seats · 'listed' = a published fixed price · 'estimate' = a
//   range from a guide, with the midpoint used.
const p = (amount, source, kind, range, extra = {}) => ({ amount, source, kind, range, ...extra });

export const PRICES = {
  // International flights, one way each
  delHan: p(13957, 'kayakDelHan', 'observed', '₹12,128–17,904 typical'),
  delHanReturn: p(25893, 'kayakDelHan', 'observed', 'return, from ₹25,893'),
  dadDel: p(inrFromUsd(126), 'tripDadDel', 'base', 'US$126 VietJet, connecting'),
  delDad: p(13104, 'emtDelDad', 'observed', '₹12,069–14,105 low days'),
  delBkk: p(8815, 'airasiaDelBkk', 'base', 'from ₹8,815, bag extra'),
  bkkHan: p(inrFromUsd(67), 'tripBkkHan', 'base', 'US$67–69 Thai AirAsia'),

  // Domestic hops
  hanDad: p(inrFromUsd(50), 'kayakHanDad', 'base', 'US$50–85, no checked bag'),
  dadHan: p(inrFromUsd(50), 'kayakHanDad', 'base', 'US$50–85, no checked bag'),
  train6: p(inrFromVnd(803000), 'vnTrainHanHue', 'listed', '803,000–997,000 ₫ 6-berth'),
  train4: p(inrFromVnd(1004000), 'vnTrainHanHue', 'listed', '1,004,000–1,154,000 ₫ 4-berth'),
  busHanHue: p(inrFromVnd(675000), 'vexereBus', 'estimate', '546,000–910,000 ₫ sleeper'),
  trainHueDad: p(inrFromVnd(89000), 'vnTrainHueDad', 'listed', '89,000 ₫ soft seat AC'),
  bus86: p(inrFromVnd(45000), 'bus86', 'listed', 'flat 45,000 ₫'),
  yellowBus: p(inrFromVnd(30000), 'danangHoian', 'listed', 'flat 30,000 ₫'),
  grabToAirport: p(inrFromVnd(525000), 'grabPrices', 'estimate', '450,000–600,000 ₫ per car', { perGroup: true }),

  // Days out
  halong: p(inrFromUsd(42), 'sinhHalong', 'listed', 'US$34–44 day cruise'),
  ninhbinh: p(inrFromVnd(1000000), 'ninhbinhTour', 'listed', '1,000,000 ₫ bus tour'),
  hueCitadel: p(inrFromVnd(200000), 'hueCitadel', 'listed', '200,000 ₫ adult'),
  hoianTicket: p(inrFromVnd(120000), 'hoianTicket', 'listed', '120,000 ₫ five sites'),
  banaHills: p(inrFromVnd(1000000), 'banaHills', 'listed', '1,000,000 ₫ adult'),

  // Daily rates — sliders start here, you decide the comfort
  bed: p(inrFromUsd(9), 'hostels', 'estimate', 'dorm US$5–16/night'),
  food: p(inrFromUsd(10.5), 'foodBudget', 'estimate', 'US$6–10 street · US$10–18 mixed'),
  local: p(inrFromVnd(80000), 'grabPrices', 'estimate', '2–3 GrabBike hops a day'),

  // Fixed admin
  evisa: p(inrFromUsd(25), 'evisa', 'listed', 'US$25 single entry'),
  sim: p(inrFromVnd(165000), 'viettel', 'listed', '150,000 ₫ plan + SIM card'),
};

export const KIND_LABEL = {
  observed: 'seen',
  base: 'from',
  listed: 'listed',
  estimate: 'est.',
};
