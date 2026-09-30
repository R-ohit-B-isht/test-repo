// Packing cubes — reference ceiling. Facts read off eaglecreek.com (product page + public product API) on `checked`.
export default {
  category: 'packing-cubes',
  brand: 'Eagle Creek',
  name: 'Pack-It® Reveal Packing Cube Set (XS / S / M)',
  why: 'A three-piece set whose maker prints external dimensions, calculated capacity and weight for every cube on its own page — 19 × 11 × 6 cm / 1 L / 45 g, 25 × 18 × 8 cm / 3 L / 71 g, 36 × 25 × 8 cm / 7 L / 113 g — in 100 % recycled 300D polyester with a poly-mesh lid, made without intentional PFAS, and backs it with a lifetime No Matter What® warranty. Wirecutter’s long-running test names it the best packing cubes for most travellers and Pack Hacker ranks it first in its packing-cube guide.',
  checked: '2026-09-24',
  caution: 'No Eagle Creek listing exists on Flipkart / Amazon.in in this dataset (Eagle Creek sells from a US storefront), so no in-list rank is shown. Capacities are the maker’s calculated volumes from external dimensions, exactly how this site estimates every listing. The Pack-It Isolate and Pack-It Dry lines are different products.',
  maker: {
    label: 'Eagle Creek — official product page (US)',
    url: 'https://eaglecreek.com/products/pack-it-reveal-cube-set-xssm',
    title: 'Pack-It® Reveal Packing Cube Set',
    region: 'US',
  },
  image: {
    url: 'https://cdn.shopify.com/s/files/1/0554/0115/2649/files/EC050406_820_a.jpg?v=1747769419',
    source: 'eaglecreek.com product gallery (set, Black)',
  },
  facts: [
    { k: 'Set', v: '3 cubes — XS, S, M' },
    { k: 'Dimensions', v: 'XS 7.5 × 4.5 × 2.5 in (19 × 11 × 6 cm); S 10 × 7 × 3 in (25 × 18 × 8 cm); M 14 × 10 × 3 in (36 × 25 × 8 cm)' },
    { k: 'Capacity', v: 'XS 1 L · S 3 L · M 7 L (maker-calculated from dimensions)' },
    { k: 'Weight', v: 'XS 1.6 oz (45 g) · S 2.5 oz (71 g) · M 4 oz (113 g)' },
    { k: 'Material', v: '100 % recycled 300D polyester, poly mesh lid; water-resistant fabric; made without intentional PFAS' },
    { k: 'Warranty', v: 'No Matter What® lifetime warranty (life of the product, original owner)' },
    { k: 'Price', v: 'US$59 (set)' },
  ],
  evidence: [
    { label: 'The Best Packing Cubes — Eagle Creek Pack-It Reveal Cube Set, best packing cubes for most travelers', publisher: 'Wirecutter (The New York Times)', url: 'https://www.nytimes.com/wirecutter/reviews/best-packing-cubes' },
    { label: 'Best Packing Cubes guide — Eagle Creek Pack-It Reveal Packing Cubes ranked #1', publisher: 'Pack Hacker', url: 'https://www.packhacker.com/guide/best-packing-cubes/' },
    { label: 'Eagle Creek Pack-It Reveal Cubes review — 7.1/10 (measured 1 / 2 / 4 oz)', publisher: 'Pack Hacker', url: 'https://www.packhacker.com/travel-gear/eagle-creek/pack-it-reveal-packing-cubes/' },
    { label: 'No Matter What® Warranty — covers defects for the life of the product', publisher: 'Eagle Creek', url: 'https://eaglecreek.com/pages/warranty' },
  ],
  match: { brand: '^eagle\\s*creek$', model: 'pack[\\s-]*it.*reveal', note: 'Eagle Creek Pack-It Reveal cubes were not found on Flipkart / Amazon.in in this dataset; Pack-It Isolate / Dry cubes are not counted.' },
};
