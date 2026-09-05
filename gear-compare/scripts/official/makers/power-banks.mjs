// Maker catalogues for power banks. Each entry: which listing brands it covers, where the catalogue lives, and
// how to recognise a power-bank product in it. Only official brand domains — no resellers.
const PB = /power\s*bank|powerbank|\bmah\b/i;
const NOT = /case|cover|pouch|cable\b|charger\b(?!.*power ?bank)|adapter|adaptor|stand|holder|dock|hub|earbuds|speaker|watch|neckband|headphone|trimmer|bundle|combo|pack of|kit\b/i;

export default [
  { brand: /^ambrane$/i, base: 'https://ambraneindia.com', kind: 'shopify', region: 'IN', isProduct: (p) => (PB.test(p.title + ' ' + p.type + ' ' + p.tags.join(' ')) || /power ?bank/i.test(p.type)) && !NOT.test(p.title) },
  { brand: /^portronics$/i, base: 'https://portronics.com', kind: 'shopify', region: 'IN', isProduct: (p) => /^power ?bank$/i.test(p.type) && !NOT.test(p.title) },
  { brand: /^(zebronics|zeb)$/i, base: 'https://zebronics.com', kind: 'shopify', region: 'IN', isProduct: (p) => /mah/i.test(p.type) || (PB.test(p.title) && !NOT.test(p.title)) },
  { brand: /^boat$/i, base: 'https://www.boat-lifestyle.com', kind: 'shopify', region: 'IN', isProduct: (p) => PB.test(p.title) && !NOT.test(p.title.replace(/\|.*$/, '')) },
  { brand: /^stuffcool$/i, base: 'https://stuffcool.com', kind: 'shopify', region: 'IN', isProduct: (p) => PB.test(p.title + ' ' + p.type) && !NOT.test(p.title) },
  { brand: /^ptron$/i, base: 'https://ptron.in', kind: 'shopify', region: 'IN', isProduct: (p) => PB.test(p.title + ' ' + p.type) && !NOT.test(p.title) },
  { brand: /^noise$/i, base: 'https://www.gonoise.com', kind: 'shopify', region: 'IN', isProduct: (p) => PB.test(p.title + ' ' + p.type) && !NOT.test(p.title) },
  { brand: /^agaro$/i, base: 'https://agarolifestyle.com', kind: 'shopify', region: 'IN', isProduct: (p) => PB.test(p.title + ' ' + p.type) && !NOT.test(p.title) },
  { brand: /^intex$/i, base: 'https://intex.in', kind: 'shopify', region: 'IN', isProduct: (p) => PB.test(p.title + ' ' + p.type) && !NOT.test(p.title) },
  { brand: /^hammer$/i, base: 'https://hammeronline.in', kind: 'shopify', region: 'IN', isProduct: (p) => PB.test(p.title + ' ' + p.type) && !NOT.test(p.title) },
  { brand: /^ubon$/i, base: 'https://ubon.in', kind: 'shopify', region: 'IN', isProduct: (p) => PB.test(p.title + ' ' + p.type) && !NOT.test(p.title) },
  { brand: /^lapcare$/i, base: 'https://www.lapcare.com', kind: 'shopify', region: 'IN', isProduct: (p) => PB.test(p.title + ' ' + p.type) && !NOT.test(p.title) },
  { brand: /^foxin$/i, base: 'https://www.foxin.in', kind: 'shopify', region: 'IN', isProduct: (p) => PB.test(p.title + ' ' + p.type) && !NOT.test(p.title) },
  { brand: /^toreto$/i, base: 'https://toreto.in', kind: 'shopify', region: 'IN', isProduct: (p) => PB.test(p.title + ' ' + p.type) && !NOT.test(p.title) },
  { brand: /^baseus$/i, base: 'https://www.baseus.com', kind: 'shopify', region: 'Global', isProduct: (p) => PB.test(p.title + ' ' + p.type) && !NOT.test(p.title) },
  { brand: /^ugreen$/i, base: 'https://www.ugreen.com', kind: 'shopify', region: 'Global', isProduct: (p) => PB.test(p.title + ' ' + p.type) && !NOT.test(p.title) },
  { brand: /^anker$/i, base: 'https://www.anker.com', kind: 'shopify', region: 'US', isProduct: (p) => PB.test(p.title + ' ' + p.type) && !NOT.test(p.title) },
];
