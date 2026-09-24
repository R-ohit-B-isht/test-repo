// Toiletry bags — reference ceiling. Facts read off peakdesign.com (product page JSON-LD + specs) on `checked`.
export default {
  category: 'toiletry-bags',
  brand: 'Peak Design',
  name: 'Wash Pouch (2.5 L)',
  variant: 'Regular (2.5 L) — a 1 L Small variant is also sold',
  why: 'A hanging toiletry kit whose maker states capacity, dimensions and weight for both sizes on its own page (2.5 L, 26 × 15 × 11.5 cm, 248 g; Small 1 L, 26 × 10 × 13 cm, 176 g), built from recycled weatherproof 200D nylon Versa Shell with TPU-coated mesh, foam-structured walls and a #8 UltraZip, and covered by a lifetime guarantee. Wirecutter names it the best toiletry bag for the most situations; Pack Hacker’s review scores it 7.8/10.',
  checked: '2026-09-24',
  caution: 'No Peak Design listing exists on Flipkart / Amazon.in in this dataset (Peak Design sells from a US storefront), so no in-list rank is shown. “Weatherproof” is the maker’s own term for the shell fabric; the page does not claim the pouch is leak-proof or submersible.',
  maker: {
    label: 'Peak Design — official product page (US)',
    url: 'https://www.peakdesign.com/products/wash-pouch',
    title: 'Wash Pouch',
    region: 'US',
  },
  image: {
    url: 'https://cdn.shopify.com/s/files/1/2986/1172/files/wash-pouch-black-1_b95cebfb-7a3a-43e1-97e2-22cc4343c7c0.jpg?v=1762275806',
    source: 'peakdesign.com product gallery (Wash Pouch, Black)',
  },
  facts: [
    { k: 'Capacity', v: '2.5 L (Small: 1 L)' },
    { k: 'Dimensions', v: '26 × 15 × 11.5 cm (Small: 26 × 10 × 13 cm)' },
    { k: 'Weight', v: '248 g (Small: 176 g)' },
    { k: 'Material', v: 'Recycled weatherproof 200D nylon Versa Shell; TPU-coated mesh; high-visibility nylon/poly interior; foam structure' },
    { k: 'Zipper', v: '#8 UltraZip' },
    { k: 'Warranty', v: 'Lifetime guarantee' },
    { k: 'Price', v: 'US$59.95 (Small: US$49.95)' },
  ],
  evidence: [
    { label: 'The Best Toiletry Bags — Peak Design Wash Pouch, best toiletry bag for the most situations', publisher: 'Wirecutter (The New York Times)', url: 'https://www.nytimes.com/wirecutter/reviews/best-toiletry-bags' },
    { label: 'Peak Design Wash Pouch review — 7.8/10', publisher: 'Pack Hacker', url: 'https://www.packhacker.com/travel-gear/peak-design/wash-pouch' },
    { label: 'Peak Design Lifetime Warranty — guaranteed for life', publisher: 'Peak Design', url: 'https://www.peakdesign.com/pages/warranty' },
  ],
  match: { brand: '^peak\\s*design$', model: 'wash\\s*pouch', note: 'Peak Design Wash Pouch was not found on Flipkart / Amazon.in in this dataset.' },
};
