// Maker catalogues for induction cooktops. Only official brand domains — no resellers. Pigeon, Prestige, Usha
// and Havells sit behind bot walls / non-crawlable storefronts, so their listings stay at marketplace evidence.
const IC = /induction\s*(?:cook(?:top|er)|stove|chulha|hob)\b/i;
const NOT = /cookware|kadhai|kadai|tawa|griddle|gift\s*set|induction\s*base|\bpan\b|\bpot\b|pressure cooker|utensil|cook\s*set|bottom|fan only|coil only|pcb|spare|stand only|glass only|combo(?!.*induction)|bundle|casserole|handi|fry|dosa|idli|set of/i;
const shop = (p) => IC.test(p.title) && !NOT.test(p.title);

export default [
  { brand: /^philips$/i, base: 'https://www.philips.co.in', kind: 'philips', region: 'IN',
    isProduct: (s) => /induction/i.test(`${s.productTitle} ${s.subcategoryName || ''} ${s.familyName || ''}`) },
  { brand: /^bajaj$/i, base: 'https://www.bajajelectricals.com', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^crompton$/i, base: 'https://www.crompton.co.in', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^milton$/i, base: 'https://www.milton.in', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^kent$/i, base: 'https://www.kent.co.in', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^wonderchef$/i, base: 'https://www.wonderchef.com', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^agaro$/i, base: 'https://agarolifestyle.com', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^lifelong$/i, base: 'https://www.lifelongonline.com', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^v-?guard$/i, base: 'https://www.vguard.in', kind: 'sitemap', region: 'IN', sitemap: 'https://www.vguard.in/sitemap.xml',
    urlFilter: /vguard\.in\/product-details\/.*induction/i, titleFilter: IC, isProduct: (p) => !NOT.test(p.title) },
];
