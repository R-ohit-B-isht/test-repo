// Maker catalogues for portable (USB / bottle) blenders. Most marketplace sellers in this category are unbranded
// importers with no website; the accountable makers below are the ones with a crawlable official catalogue.
const BL = /blender|juicer|smoothie|shaker|mixer/i;
const PORTABLE = /portable|usb|rechargeable|bottle|personal|mini|travel|on[-\s]the[-\s]go|cordless/i;
const NOT = /blade only|replacement|spare|adapter only|cover|stand only|hand blender|immersion|stick blender|beater|whisk|frother|grinder|mixer grinder|centrifugal|slow juicer|cold press|citrus|manual|combo(?!.*blender)|bundle|set of/i;
const shop = (p) => { const t = `${p.title} ${p.type} ${p.tags.join(' ')}`; return BL.test(t) && PORTABLE.test(t) && !NOT.test(p.title); };

export default [
  { brand: /^agaro$/i, base: 'https://agarolifestyle.com', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^wonderchef$/i, base: 'https://www.wonderchef.com', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^boldfit$/i, base: 'https://boldfit.com', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^milton$/i, base: 'https://www.milton.in', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^lifelong$/i, base: 'https://www.lifelongonline.com', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^crompton$/i, base: 'https://www.crompton.co.in', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^bajaj$/i, base: 'https://www.bajajelectricals.com', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^kent$/i, base: 'https://www.kent.co.in', kind: 'shopify', region: 'IN', isProduct: shop },
  { brand: /^philips$/i, base: 'https://www.philips.co.in', kind: 'philips', region: 'IN',
    isProduct: (s) => /blender/i.test(`${s.productTitle} ${s.subcategoryName || ''}`) && PORTABLE.test(`${s.productTitle} ${s.familyName || ''}`) },
];
