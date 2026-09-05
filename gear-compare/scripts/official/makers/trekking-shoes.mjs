// Maker catalogues for trekking / hiking shoes. Only official brand domains — no resellers. Wildcraft's site is a
// JS app with an empty sitemap and Adidas / HRX / Woodland publish no crawlable spec catalogue, so those stay at
// marketplace evidence until a browser-driven crawl is added.
const SHOE = /shoe|boot|sneaker|footwear/i;
const TREK = /trek|hik|outdoor|mountain|trail|boot/i;
const NOT = /socks?|insole|lace|shoe\s*(?:bag|rack|cover|polish|cleaner)|slipper|sandal|flip\s*flop|floater|clog|slide|gaiter|crampon|cleat|heel|ballerina|loafer|formal|oxford|derby|moccasin|espadrille|wedge|flat\b|pump/i;
const shop = (p) => { const t = `${p.title} ${p.type} ${p.tags.join(' ')}`; return SHOE.test(t) && TREK.test(t) && !NOT.test(p.title); };

export default [
  { brand: /^red tape$/i, base: 'https://redtape.com', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^bacca bucci$/i, base: 'https://baccabucci.com', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^columbia$/i, base: 'https://columbiasportswear.co.in', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^campus$/i, base: 'https://www.campusshoes.com', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^boldfit$/i, base: 'https://boldfit.com', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^woodland$/i, base: 'https://www.woodlandworldwide.com', kind: 'sitemap', region: 'IN', sitemap: 'https://www.woodlandworldwide.com/sitemap.xml',
    childFilter: /products-\d+\.xml/, urlFilter: /woodlandworldwide\.com\/product\/[a-z0-9-]*(?:trek|hik|boot|outdoor|trail)[a-z0-9-]*$/i, titleFilter: SHOE, maxUrls: 600,
    isProduct: (p) => TREK.test(p.title) && !NOT.test(p.title) },
];
