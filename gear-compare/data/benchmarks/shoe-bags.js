// Shoe bags — reference ceiling. Facts read off peakdesign.com (product page JSON-LD + specs) on `checked`.
export default {
  category: 'shoe-bags',
  brand: 'Peak Design',
  name: 'Shoe Pouch',
  why: 'A 9-litre shoe bag whose maker publishes max size (32 × 17 × 17 cm), packed size (7.6 × 12.7 × 1.7 cm) and weight (48 g) on its own page, in 100 % recycled, self-healing 70D Versa Heal nylon/poly with a #5 UltraZip — and covers it with a no-rhetoric lifetime guarantee. Pack Hacker’s hands-on review scores it 8.3/10.',
  checked: '2026-09-24',
  caution: 'No Peak Design shoe pouch listing exists on Flipkart / Amazon.in in this dataset (Peak Design sells from a US storefront), so no in-list rank is shown. 9 L is the maker’s stated capacity for one pair of shoes; the maker page does not state a shoe-size limit, and bulky boots may exceed the 32 × 17 × 17 cm max.',
  maker: {
    label: 'Peak Design — official product page (US)',
    url: 'https://www.peakdesign.com/products/shoe-pouch',
    title: 'Shoe Pouch',
    region: 'US',
  },
  image: {
    url: 'https://cdn.shopify.com/s/files/1/2986/1172/files/Shoe-Pouch-Eclipse-0685.jpg?v=1753477534',
    source: 'peakdesign.com product gallery (Eclipse)',
  },
  facts: [
    { k: 'Capacity', v: '9 L (one pair of shoes)' },
    { k: 'Max dimensions', v: '32 × 17 × 17 cm' },
    { k: 'Packed dimensions', v: '7.6 × 12.7 × 1.7 cm (folds into its own pocket)' },
    { k: 'Weight', v: '48 g' },
    { k: 'Material', v: '100 % recycled, self-healing 70D Versa Heal nylon/poly; Bluesign®-certified, solution-dyed' },
    { k: 'Zipper', v: '#5 UltraZip' },
    { k: 'Warranty', v: 'Lifetime guarantee' },
  ],
  evidence: [
    { label: 'Peak Design Shoe Pouch review — 8.3/10', publisher: 'Pack Hacker', url: 'https://www.packhacker.com/travel-gear/peak-design/shoe-pouch' },
    { label: 'Peak Design Lifetime Warranty — guaranteed for life', publisher: 'Peak Design', url: 'https://www.peakdesign.com/pages/warranty' },
  ],
  match: { brand: '^peak\\s*design$', model: 'shoe\\s*pouch', note: 'Peak Design Shoe Pouch was not found on Flipkart / Amazon.in in this dataset.' },
};
