// Laundry bags — reference ceiling. Facts read off matadorequipment.com (product page tech specs) on `checked`.
export default {
  category: 'laundry-bags',
  brand: 'Matador',
  name: 'Packable Laundry Bag (30 L)',
  why: 'A 30-litre laundry bag whose maker prints volume, weight and dimensions on its own page — 30 L, 4.4 oz (125 g), 21 × 14 × 9 in (53 × 36 × 23 cm) — in 50D PFAS-free nylon with a coated, waterproof fabric that keeps dirty clothes separated, top and front zip access, a stuff-it pocket and dual hanging clips, backed by a stated 1-year warranty with free repair or replacement. Pack Hacker’s review scores it 7.7/10.',
  checked: '2026-09-24',
  caution: 'No Matador listing exists on Flipkart / Amazon.in in this dataset (Matador sells from a US storefront), so no in-list rank is shown. “Waterproof fabric” is the maker’s wording for the coated shell; the page does not claim sealed seams or a submersible bag.',
  maker: {
    label: 'Matador — official product page (US)',
    url: 'https://www.matadorequipment.com/products/packable-laundry-bag',
    title: 'Packable Laundry Bag',
    region: 'US',
  },
  image: {
    url: 'https://www.matadorequipment.com/cdn/shop/files/MATLB1001BK_Matador_Laundrybag_1.jpg?v=1759352581',
    source: 'matadorequipment.com product gallery (Black)',
  },
  facts: [
    { k: 'Volume', v: '30 L' },
    { k: 'Weight', v: '4.4 oz (125 g)' },
    { k: 'Dimensions', v: '21 × 14 × 9 in (53 × 36 × 23 cm)' },
    { k: 'Material', v: '50D nylon, PFAS-free; coated, waterproof fabric' },
    { k: 'Access', v: 'Zipper on top (hamper use) and on the front (laid flat in luggage); stuff-it pocket; dual clips, three handles' },
    { k: 'Warranty', v: '1 year — repair or replace free of charge' },
    { k: 'Price', v: 'US$30' },
  ],
  evidence: [
    { label: 'Matador Packable Laundry Bag review — 7.7/10', publisher: 'Pack Hacker', url: 'https://www.packhacker.com/travel-gear/matador/packable-laundry-bag' },
    { label: 'Matador warranty — packs and bags 2 years, smaller accessories 1 year', publisher: 'Matador', url: 'https://www.matadorequipment.com/pages/warranty' },
  ],
  match: { brand: '^matador$', model: 'packable\\s*laundry', note: 'Matador Packable Laundry Bag was not found on Flipkart / Amazon.in in this dataset.' },
};
