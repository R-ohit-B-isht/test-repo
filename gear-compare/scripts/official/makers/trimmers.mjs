// Maker catalogues for trimmers / clippers / groomers. Only official brand domains — no resellers.
const TR = /trimmer|clipper|groom(?:er|ing kit)|shaver|multigroom|bodygroom|oneblade/i;
// Spare parts and consumables ("Clip Only", "USB Cord ( Cord Only )", replaceable blades) are not the trimmer.
const NOT = /\bonly\b|replacement (?:head|blade|comb)|replaceable blade|spare part|pouch|cover|stand only|charger only|cable|combo(?!.*trimmer)|bundle|gift set(?!.*trimmer)|epilator|razor(?!.*trimmer)|cartridge|foam|gel|oil|wax|balm|serum|shampoo|cream/i;
const shop = (p) => TR.test(`${p.title} ${p.type} ${p.tags.join(' ')}`) && !NOT.test(p.title);

export default [
  { brand: /^philips$/i, base: 'https://www.philips.co.in', kind: 'philips', region: 'IN',
    isProduct: (s) => TR.test(`${s.productTitle} ${s.subcategoryName || ''} ${s.familyName || ''}`) && !/replaceable blade|replacement|blade pack|accessor/i.test(s.productTitle) },
  { brand: /^vega( professional)?$/i, base: 'https://www.vega.co.in', kind: 'sitemap', region: 'IN', sitemap: 'https://www.vega.co.in/sitemap.xml',
    urlFilter: /vega\.co\.in\/[a-z0-9-]*(?:trimmer|shaver|groom|clipper)[a-z0-9-]*\.html$/i, titleFilter: TR, isProduct: (p) => !NOT.test(p.title) && !/cuticle|cutical|nail/i.test(p.title) },
  { brand: /^nova$/i, base: 'https://www.novaindia.co.in', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^bombay shaving company$/i, base: 'https://www.bombayshavingcompany.com', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^beardo$/i, base: 'https://beardo.in', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^menhood$/i, base: 'https://menhood.in', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^zlade$/i, base: 'https://zlade.in', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^agaro$/i, base: 'https://agarolifestyle.com', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^ikonic( professional| me)?$/i, base: 'https://ikonicworld.com', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^winston$/i, base: 'https://winstonindia.com', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^lifelong$/i, base: 'https://www.lifelongonline.com', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^crompton$/i, base: 'https://www.crompton.co.in', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^bajaj$/i, base: 'https://www.bajajelectricals.com', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^kent$/i, base: 'https://www.kent.co.in', kind: 'shopify', region: 'IN', isProduct: shop },
];
