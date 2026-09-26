// Official storefronts for the Lakshadweep trip categories (probed 2026-09-26 via /products.json). Speedo India
// is a Shopify store with live INR prices, so its caps and goggles are listed directly as brand-store rows.
// Combos (goggles + cap + swimsuit) and accessory-only SKUs (goggle cases, nose clips) never enter a category.
const NEVER = /combo|bundle|\bset of\b|gift card|goggle\s*case|case\s*cover|nose\s*clip|ear\s*plug|strap\s*only|spare|replacement/i;

export const ROLE = {
  'swim-caps': (p) => /swim(?:ming)?\s*caps?\b|silicone?\s*caps?\b/i.test(p.title) || /\bcaps?\b/i.test(p.type),
  'swim-goggles': (p) => /goggles?\b/i.test(p.title) || /goggles?\b/i.test(p.type),
};

export const forRole = (id) => (p) => {
  if (NEVER.test(p.title) || NEVER.test(p.type)) return false;
  if (!ROLE[id](p)) return false;
  // A cap that also names goggles is a kit and belongs with the goggles; a goggle title never names a cap.
  if (id === 'swim-caps' && /goggles?\b/i.test(p.title)) return false;
  return true;
};

const IN = (brand, name, base) => ({ brand, name, base, kind: 'shopify', region: 'IN', always: true });

export const STORES = [IN(/^speedo$/i, 'Speedo', 'https://www.speedo.in')];

export const tripMakers = (id) => STORES.map((m) => ({ ...m, isProduct: forRole(id) }));
