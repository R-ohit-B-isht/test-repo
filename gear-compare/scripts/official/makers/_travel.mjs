// Official storefronts that publish travel organisers (probed 2026-09-24 via /products.json). One list shared by
// the six organiser sites; each site passes its own role filter. Indian stores are listed directly as brand-store
// rows (region IN, live INR price); Eagle Creek / BAGSMART are US/global storefronts used for spec matching only.
const NOT = /gift card|e-gift|combo|bundle|\bset of (?:2|3) (?:trolleys|suitcases|bags)|luggage set|trolley|suitcase|backpack|duffel|duffle|rucksack|tote\b|handbag|sling|wallet insert|replacement|spare|sticker|keychain|key chain|luggage tag|luggage strap|luggage cover|luggage belt|neck pillow|eye mask|umbrella|bottle|mug|notebook|diary|planner|phone case|airpods|laptop sleeve|laptop bag|messenger|briefcase|lunch/i;
// Never an organiser for this planner, whatever the title's head noun: B2B bulk SKUs, rigid home storage.
const NEVER = /custom branded|\bbulk\b|corporate|\bmoq\b|acrylic|drawer|storage box|jewell?ery box|desk organi[sz]er|wardrobe|hanger|gift card/i;

export const ROLE = {
  'packing-cubes': /packing\s*cube|compression\s*(?:cube|bag|pouch)|packing\s*organi[sz]er|garment\s*(?:folder|organi[sz]er)|cloth(?:es|ing)?\s*(?:organi[sz]er|pouch|bag)|shirt\s*organi[sz]er|organi[sz]er\s*packs?\b|luggage\s*organi[sz]er|travel\s*organi[sz]er\s*(?:set|bags?|pouch)/i,
  'shoe-bags': /shoe\s*(?:bag|pouch|organi[sz]er|cover|sack|case)|footwear\s*(?:bag|pouch|organi[sz]er)|slipper\s*(?:bag|pouch)/i,
  'toiletry-bags': /toiletry|toiletries|wash\s*bag|dopp|vanity\s*(?:bag|pouch|case|kit)|cosmetic\s*(?:bag|pouch|case|organi[sz]er)|makeup\s*(?:bag|pouch|organi[sz]er|case)|make-up\s*(?:bag|pouch)|hanging\s*organi[sz]er|travel\s*kit\s*(?:bag|pouch|organi[sz]er)|skincare\s*(?:bag|pouch|organi[sz]er)/i,
  'tech-pouches': /tech\s*(?:kit|pouch|organi[sz]er|case|bag)|cable\s*(?:organi[sz]er|pouch|bag|case)|gadget\s*(?:organi[sz]er|pouch|bag|case)|electronics?\s*(?:organi[sz]er|pouch|bag|case)|accessor(?:y|ies)\s*(?:organi[sz]er|pouch|kit|case)|charger\s*(?:organi[sz]er|pouch|case)/i,
  'laundry-bags': /laundry\s*(?:bag|pouch|sack)|underwear\s*(?:bag|pouch|organi[sz]er)|lingerie\s*(?:bag|pouch|organi[sz]er)|innerwear\s*(?:bag|pouch|organi[sz]er)|bra\s*(?:bag|organi[sz]er)/i,
  'travel-wallets': /passport\s*(?:holder|cover|wallet|case|sleeve|organi[sz]er|pouch)|travel\s*wallet|document\s*(?:holder|organi[sz]er|wallet|pouch|bag|case)|family\s*passport|neck\s*(?:pouch|wallet)|money\s*belt|travel\s*(?:pouch|organi[sz]er)\s*(?:for\s*)?(?:passport|documents)/i,
};

// A product whose title also names another role ("Packing Cubes with Shoe Bag") stays in the role of its head
// noun; multi-role sets (cubes + laundry + shoe) are listed under packing cubes, where the piece count is scored.
export const forRole = (id) => (p) => {
  const t = `${p.title} ${p.type}`;
  if (NEVER.test(p.title)) return false;
  if (NOT.test(p.title) && !ROLE[id].test(p.title)) return false;
  if (!ROLE[id].test(t)) return false;
  if (id !== 'packing-cubes' && ROLE['packing-cubes'].test(p.title) && /set|pcs|pieces|pack of/i.test(p.title)) return false;
  return true;
};

const IN = (brand, name, base) => ({ brand, name, base, kind: 'shopify', region: 'IN', always: true });

export const STORES = [
  IN(/^mokobara$/i, 'Mokobara', 'https://mokobara.com'),
  IN(/^nasher ?miles$/i, 'Nasher Miles', 'https://nashermiles.com'),
  IN(/^tripole$/i, 'Tripole', 'https://tripole.in'),
  IN(/^zouk$/i, 'Zouk', 'https://zouk.co.in'),
  IN(/^wild ?horn$/i, 'Wildhorn', 'https://wildhorn.in'),
  IN(/^(?:the )?house ?of ?quirk$/i, 'House of Quirk', 'https://houseofquirk.com'),
  IN(/^storite$/i, 'Storite', 'https://storite.in'),
  IN(/^hammonds flycatcher$/i, 'Hammonds Flycatcher', 'https://hammondsflycatcher.com'),
  IN(/^arctic ?fox$/i, 'Arctic Fox', 'https://arcticfox.com'),
  IN(/^assembly$/i, 'Assembly', 'https://assemblytravel.com'),
  IN(/^mufubu$/i, 'Mufubu', 'https://mufubu.com'),
  IN(/^american tourister$/i, 'American Tourister', 'https://www.americantourister.in'),
  IN(/^nappa ?dori$/i, 'Nappa Dori', 'https://www.nappadori.com'),
  IN(/^chumbak$/i, 'Chumbak', 'https://www.chumbak.com'),
  IN(/^teakwood(?: leathers)?$/i, 'Teakwood Leathers', 'https://teakwoodleathers.com'),
  IN(/^f ?gear$/i, 'F Gear', 'https://www.fgear.in'),
  IN(/^hokipo$/i, 'Hokipo', 'https://hokipo.in'),
  IN(/^lavie(?: sport)?$/i, 'Lavie', 'https://www.lavieworld.com'),
  { brand: /^eagle creek$/i, name: 'Eagle Creek', base: 'https://eaglecreek.com', kind: 'shopify', region: 'US' },
  { brand: /^bagsmart$/i, name: 'Bagsmart', base: 'https://www.bagsmart.com', kind: 'shopify', region: 'US' },
];

export const travelMakers = (id) => STORES.map((m) => ({ ...m, isProduct: forRole(id) }));
