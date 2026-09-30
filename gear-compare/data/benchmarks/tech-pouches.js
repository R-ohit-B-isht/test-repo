// Tech / accessory pouches — reference ceiling. Facts read off peakdesign.com (product page JSON-LD + specs) on `checked`.
export default {
  category: 'tech-pouches',
  brand: 'Peak Design',
  name: 'Tech Pouch (2 L)',
  variant: 'Regular (2 L) — a 1 L Small variant is also sold',
  why: 'An accessory organiser whose maker states capacity, external and internal dimensions and weight for both sizes on its own page (2 L, 24 × 15 × 10 cm, 288 g; Small 1 L, 24 × 11.5 × 9 cm external / 23 × 10.5 × 8 cm internal, 195 g), built from 400D recycled weatherproof Versa Shell with a PFAS-free C0 DWR finish and a #8 UltraZip, and covered by a lifetime guarantee. Pack Hacker ranks it first in its best-tech-pouch guide and scores it 8.0/10 in review.',
  checked: '2026-09-24',
  caution: 'No Peak Design listing exists on Flipkart / Amazon.in in this dataset (Peak Design sells from a US storefront), so no in-list rank is shown. Internal dimensions are published only for the Small; the 2 L figure is the maker’s external size.',
  maker: {
    label: 'Peak Design — official product page (US)',
    url: 'https://www.peakdesign.com/products/tech-pouch',
    title: 'Tech Pouch',
    region: 'US',
  },
  image: {
    url: 'https://cdn.shopify.com/s/files/1/2986/1172/files/tech-pouch-black-1.jpg?v=1762275799',
    source: 'peakdesign.com product gallery (Tech Pouch, Black)',
  },
  facts: [
    { k: 'Capacity', v: '2 L (Small: 1 L)' },
    { k: 'Dimensions', v: '24 × 15 × 10 cm external (Small: 24 × 11.5 × 9 cm external, 23 × 10.5 × 8 cm internal)' },
    { k: 'Weight', v: '288 g (Small: 195 g)' },
    { k: 'Material', v: '400D 100 % recycled weatherproof Versa Shell; PFAS-free C0 DWR; high-visibility nylon/poly interior' },
    { k: 'Zipper', v: '#8 UltraZip' },
    { k: 'Warranty', v: 'Lifetime guarantee' },
    { k: 'Price', v: 'US$49.95 (Small) / US$59.95' },
  ],
  evidence: [
    { label: 'Best Tech Pouch guide — Peak Design Tech Pouch ranked #1', publisher: 'Pack Hacker', url: 'https://www.packhacker.com/blog/general/best-tech-pouch/' },
    { label: 'Peak Design Tech Pouch review — 8.0/10', publisher: 'Pack Hacker', url: 'https://www.packhacker.com/travel-gear/peak-design/tech-pouch' },
    { label: 'The Best Bag Organizers — Incase Nylon Accessory Organizer / Osprey Ultralight Roll Organizer picks (context for the category)', publisher: 'Wirecutter (The New York Times)', url: 'https://www.nytimes.com/wirecutter/reviews/best-bag-organizers' },
    { label: 'Peak Design Lifetime Warranty — guaranteed for life', publisher: 'Peak Design', url: 'https://www.peakdesign.com/pages/warranty' },
  ],
  match: { brand: '^peak\\s*design$', model: 'tech\\s*pouch', note: 'Peak Design Tech Pouch was not found on Flipkart / Amazon.in in this dataset.' },
};
