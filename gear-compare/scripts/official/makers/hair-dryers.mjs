// Maker catalogues for hair dryers. Only official brand domains — no resellers. Havells (406 for non-browser
// clients), Syska and VGR publish no crawlable catalogue, so their listings stay at marketplace evidence.
const HD = /hair\s*dryer|blow\s*dryer|\bdryer\b/i;
const NOT = /straightener(?!.*dryer)|curler(?!.*dryer)|diffuser only|nozzle only|stand|holder|brush(?!.*dryer)|combo|bundle|pack of|kit\b(?!.*dryer)|spare|filter only/i;
const shop = (p) => HD.test(`${p.title} ${p.type} ${p.tags.join(' ')}`) && !NOT.test(p.title);

export default [
  { brand: /^philips$/i, base: 'https://www.philips.co.in', kind: 'philips', region: 'IN',
    isProduct: (s) => /dryer/i.test(`${s.productTitle} ${s.subcategoryName || ''} ${s.familyName || ''}`) },
  { brand: /^vega( professional)?$/i, base: 'https://www.vega.co.in', kind: 'sitemap', region: 'IN', sitemap: 'https://www.vega.co.in/sitemap.xml',
    urlFilter: /vega\.co\.in\/[a-z0-9-]*dryer[a-z0-9-]*\.html$/i, titleFilter: HD, isProduct: (p) => !NOT.test(p.title) },
  { brand: /^nova$/i, base: 'https://www.novaindia.co.in', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^ikonic( professional| me)?$/i, base: 'https://ikonicworld.com', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^agaro$/i, base: 'https://agarolifestyle.com', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^winston$/i, base: 'https://winstonindia.com', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^crompton$/i, base: 'https://www.crompton.co.in', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^bajaj$/i, base: 'https://www.bajajelectricals.com', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^kent$/i, base: 'https://www.kent.co.in', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^lifelong$/i, base: 'https://www.lifelongonline.com', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^bombay shaving company$/i, base: 'https://www.bombayshavingcompany.com', kind: 'shopify', region: 'IN', isProduct: shop },
];
