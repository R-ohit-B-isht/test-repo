// Pink tumblers — reference ceiling. Facts read off simplemodern.com (product page + public products/*.js) on `checked`.
export default {
  category: 'pink-tumblers',
  brand: 'Simple Modern',
  name: 'Simple Modern Classic Tumbler with Straw Lid — 24 oz, Blush',
  why: 'A pink tumbler whose maker states the things that matter on its own page — double-wall vacuum insulation with published hold times (hot 12+ h, cold 24+ h), 18/8 stainless steel, BPA-free, leak-resistant straw lid, cupholder fit, 12.49 oz weight and a limited lifetime warranty — and which Wirecutter names its top tumbler pick after testing. The exact colour on the maker page is Blush (colour family: pink).',
  checked: '2026-09-05',
  caution: 'Simple Modern is not sold on Flipkart / Amazon.in in this dataset; no in-list rank is shown.',
  maker: {
    label: 'Simple Modern — official product page (US), Blush 24 oz variant',
    url: 'https://www.simplemodern.com/products/classic-tumbler-156',
    title: 'Simple Modern | Classic 24-Oz. Tumbler with Straw & Lid',
    region: 'US',
  },
  image: {
    url: 'https://cdn.shopify.com/s/files/1/1100/3842/files/CLS-SF-24-BR-M.jpg?v=1779482561',
    source: 'simplemodern.com featured product image for SKU CLS-S-24-BR-M (Shopify CDN, normalised to HTTPS)',
  },
  facts: [
    { k: 'SKU', v: 'CLS-S-24-BR-M (Classic Tumbler, 24 oz, Blush)' },
    { k: 'Capacity', v: '24 oz (710 ml)' },
    { k: 'Insulation', v: 'Double-wall vacuum; hot 12+ hours, cold 24+ hours' },
    { k: 'Material', v: 'Premium 18/8 stainless steel; BPA-free' },
    { k: 'Lid', v: 'Leak-resistant straw lid' },
    { k: 'Fit', v: 'Cupholder friendly' },
    { k: 'Weight', v: '12.49 oz' },
    { k: 'Warranty', v: 'Limited lifetime' },
  ],
  evidence: [
    { label: 'The Best Tumbler — Our pick: Simple Modern Classic Tumbler with Straw Lid (24 oz)', publisher: 'Wirecutter (The New York Times)', url: 'https://www.nytimes.com/wirecutter/reviews/best-tumbler/' },
    { label: 'Public product record for SKU CLS-S-24-BR-M (structured maker data used above)', publisher: 'simplemodern.com (Shopify product JSON)', url: 'https://www.simplemodern.com/products/classic-tumbler-156.js' },
  ],
  match: { brand: '^simple modern$', model: 'classic', note: 'Not sold on Flipkart / Amazon.in in this dataset.' },
};
