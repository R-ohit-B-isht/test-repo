// Official storefronts for the Lakshadweep trip categories. Speedo India (Shopify, probed 2026-09-26), Decathlon
// India (server-rendered product pages with a published spec table, own review block and 2-year warranty, probed
// 2026-09-27), and the Indian footwear makers Paragon / Relaxo / Campus plus Nivia (all Shopify) list live INR
// prices, so their products are listed directly as brand-store rows. Combos and accessory-only SKUs (goggle cases,
// nose clips, anti-fog spray, replacement straps) never enter a category; the site's own include gate still runs.
const NEVER = /combo|bundle|\bset of\b|gift card|goggle\s*case|goggles\s*case|case\s*cover|nose\s*clip|ear\s*plug|strap\s*only|spare|replacement|re-?activator|anti-fog\s*spray/i;

export const ROLE = {
  'swim-caps': (p) => /swim(?:ming)?\s*caps?\b|silicone?\s*(?:swim(?:ming)?\s*)?caps?\b/i.test(p.title) || (/\bcaps?\b/i.test(p.type) && /swim/i.test(`${p.title} ${p.type} ${(p.tags || []).join(' ')}`)),
  'swim-goggles': (p) => /goggles?\b/i.test(p.title) || /goggles?\b/i.test(p.type),
  'water-shoes': (p) => /aqua\s*-?\s*shoes?|water\s*shoes?|aquashoes?|reef\s*(?:shoes?|boot)|beach\s*shoes?/i.test(p.title),
  headlamps: (p) => /head\s*-?\s*(?:torch|lamp|light)/i.test(p.title) || /head\s*-?\s*(?:torch|lamp)/i.test(p.type),
  'flip-flops': (p) => /flip\s*-?\s*flops?|slippers?\b|sliders?\b|\bslides?\b|thongs?\b|chappals?/i.test(`${p.title} ${p.type}`) && !/sandals?\s*(?:&|and)\s*floaters?/i.test(p.type),
};

export const forRole = (id) => (p) => {
  if (NEVER.test(p.title) || NEVER.test(p.type)) return false;
  if (!ROLE[id](p)) return false;
  // A cap that also names goggles is a kit and belongs with the goggles; a goggle title never names a cap.
  if (id === 'swim-caps' && /goggles?\b/i.test(p.title)) return false;
  return true;
};

const IN = (brand, name, base, extra = {}) => ({ brand, name, base, kind: 'shopify', region: 'IN', always: true, ...extra });

// One Decathlon crawl per role: the product sitemap is filtered by the URL slug, then the role gate runs on the title.
const DECATHLON = {
  'water-shoes': /aquashoes|water-shoes|aqua-shoes/i,
  headlamps: /head-torch|headlamp|head-lamp|headtorch|head-light/i,
  'swim-caps': /swim(?:ming)?-cap/i,
  'swim-goggles': /swim(?:ming)?-goggles/i,
  'flip-flops': /flip-?flops?|slippers?|slides|tonga|slap-1/i,
};
const decathlon = (id) => ({
  brand: /^(?:decathlon|nabaiji|subea|simond|quechua|forclaz|olaian|tribord|itiwit|kalenji|domyos|kipsta|btwin|rockrider|artengo|newfeel|tarmak|oxelo|caperlan|solognac|wedze|geologic|van rysel|inesis|kuikma|perfly|corength|aptonia|fouganza|orao|outshock|copaya|allsix)$/i,
  name: 'Decathlon',
  base: 'https://www.decathlon.in',
  kind: 'decathlon',
  region: 'IN',
  always: true,
  urlFilter: DECATHLON[id],
  maxUrls: 200,
});

export const STORES = {
  'swim-caps': [IN(/^speedo$/i, 'Speedo', 'https://www.speedo.in'), IN(/^nivia$/i, 'Nivia', 'https://www.niviasports.com')],
  'swim-goggles': [IN(/^speedo$/i, 'Speedo', 'https://www.speedo.in'), IN(/^nivia$/i, 'Nivia', 'https://www.niviasports.com')],
  'water-shoes': [],
  headlamps: [],
  'flip-flops': [
    IN(/^(?:paragon|paralite|eeken|solea|blot|stimulus|vertex|meriva|escoute|slickers|p-?toes)$/i, 'Paragon', 'https://paragonfootwear.com', { maxPages: 8 }),
    IN(/^(?:relaxo|sparx|flite|bahamas|boston|mary\s*jane|kidsfun|schoolmate)$/i, 'Relaxo', 'https://relaxofootwear.com', { maxPages: 12 }),
    IN(/^campus$/i, 'Campus', 'https://www.campusshoes.com', { maxPages: 12 }),
    IN(/^nivia$/i, 'Nivia', 'https://www.niviasports.com'),
  ],
};

export const tripMakers = (id) => [...(STORES[id] || []), decathlon(id)].map((m) => ({ ...m, isProduct: forRole(id) }));
