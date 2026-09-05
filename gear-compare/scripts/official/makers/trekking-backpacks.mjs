// Maker catalogues for trekking / hiking backpacks and rucksacks. Only official brand domains — no resellers.
// Wildcraft (JS app, empty sitemap), Skybags (VIP site, no feed) and Impulse stay at marketplace evidence.
// Title + product type decide what the product is (tags are too loose: a blanket tagged "trekking" is not a bag).
const BAG = /rucksack|backpack|hiking\s*bag|trekking\s*bag|daypack|day\s*bag|internal frame bag/i;
const TREK = /trek|hik|rucksack|camp|mountain|trail|outdoor|expedition|backpacking|\d{2,3}\s*l(?:tr|itre|iter)?s?\b/i;
// Accessories, combos, refurbished units and other bag types are not the trekking backpack itself; a trekking pack
// that merely *has* a laptop compartment or ships *with* a rain cover stays in.
const NOT = /^(?:rain\s*)?cover\b|rain\s*cover for (?:backpacks?|rucksacks?|bags?)|cover only|bladder|cleaning kit|combo|bundle|set of|pack of|\s\+\s|school|college|trolley|suitcase|duffle|duffel|sling|messenger|waist|fanny|pouch|wallet|tote|handbag|lunch|tiffin|kids?\b|toddler|cabin|luggage|strolley|refurbished|pre-?owned/i;
const LAPTOP_ONLY = /laptop\s*(?:backpack|bag)|office|commuter|roll\s*top|casual/i;
const shop = (p) => {
  const t = `${p.title.split('|')[0]} ${p.type}`;
  if (!BAG.test(t) || !TREK.test(t) || NOT.test(p.title)) return false;
  return !(LAPTOP_ONLY.test(p.title) && !/trek|hik|rucksack|camp/i.test(p.title));
};

export default [
  { brand: /^trawoc$/i, base: 'https://trawoc.com', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^tripole$/i, base: 'https://tripole.in', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^mufubu$/i, base: 'https://mufubu.com', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^f gear$/i, base: 'https://fgear.in', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^american tourister$/i, base: 'https://www.americantourister.in', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^safari$/i, base: 'https://safaribags.com', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^columbia$/i, base: 'https://columbiasportswear.co.in', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^boldfit$/i, base: 'https://boldfit.com', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^nivia$/i, base: 'https://www.niviasports.com', kind: 'shopify', region: 'IN', isProduct: shop },
];
