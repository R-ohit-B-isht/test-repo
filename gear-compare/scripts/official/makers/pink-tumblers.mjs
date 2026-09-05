// Maker catalogues for insulated tumblers. Only official brand domains — no resellers. Stanley's Indian
// distributor has no catalogue, so the global stanley1913.com page is used and labelled region US.
const TUMBLER = /tumbler|sipper|quencher|travel\s*mug|insulated\s*(?:cup|mug|bottle)|flask/i;
const NOT = /lid only|straw(?:s)? only|replacement|spare|handle only|sleeve|boot|cover|cleaning|brush|combo|bundle|set of|pack of|gift set|lunch|tiffin|casserole|jar|jug|kettle|pitcher|tea\s*pot|cooker|cookware|kids?\b|sippy/i;
const shop = (p) => TUMBLER.test(`${p.title} ${p.type} ${p.tags.join(' ')}`) && !NOT.test(p.title);

export default [
  { brand: /^stanley$/i, base: 'https://www.stanley1913.com', kind: 'shopify', region: 'US', isProduct: shop },
  { brand: /^milton$/i, base: 'https://www.milton.in', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^boldfit$/i, base: 'https://boldfit.com', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^wonderchef$/i, base: 'https://www.wonderchef.com', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^lifelong$/i, base: 'https://www.lifelongonline.com', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^agaro$/i, base: 'https://agarolifestyle.com', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^kent$/i, base: 'https://www.kent.co.in', kind: 'shopify', region: 'IN', isProduct: shop },
];
