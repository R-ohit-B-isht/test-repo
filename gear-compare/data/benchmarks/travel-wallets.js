// Travel wallets / passport organisers — reference ceiling. Facts read off bellroy.com (rendered in a browser, specifications panel) on `checked`.
export default {
  category: 'travel-wallets',
  brand: 'Bellroy',
  name: 'Travel Wallet — RFID (leather)',
  variant: 'Premium leather, Black (WTRB-BLK-301)',
  why: 'A passport wallet whose maker publishes weight (3.2 oz / ≈ 91 g) and external dimensions (3.9 × 6 × 0.5 in / ≈ 9.9 × 15.2 × 1.3 cm) on its own page, states its RFID-blocking lining, its composition (70 % leather from gold-rated Leather Working Group tanneries, 25 % recycled polyester) and a written 3-year warranty against faults in materials and workmanship. Pack Hacker names it best for full-time travellers in its travel-wallet guide and scores it 7.8/10 in review.',
  checked: '2026-09-24',
  caution: 'No Bellroy listing exists on Flipkart / Amazon.in in this dataset (Bellroy sells from its own global storefront), so no in-list rank is shown. Dimensions were read from the rendered page (the static HTML does not carry them); the maker page does not list a card count, so none is stated here.',
  maker: {
    label: 'Bellroy — official product page (global)',
    url: 'https://bellroy.com/products/travel-wallet-rfid',
    title: 'Travel Wallet: Leather RFID Passport Holder, Cover & Sleeve',
    region: 'AU',
  },
  image: {
    url: 'https://bellroy-product-images.imgix.net//bellroy_dot_com_gallery_image/USD/WTRB-BLK-301/0',
    source: 'bellroy.com product gallery (Black, WTRB-BLK-301)',
  },
  facts: [
    { k: 'Weight', v: '3.2 oz (≈ 91 g)' },
    { k: 'External dimensions', v: '3.9 × 6 × 0.5 in (≈ 9.9 × 15.2 × 1.3 cm)' },
    { k: 'Protection', v: 'RFID-blocking material shields passport and cards; hidden cash compartment' },
    { k: 'Composition', v: '70 % leather (gold-rated Leather Working Group tanneries), 25 % recycled polyester, 5 % other' },
    { k: 'Extras', v: 'Built-in micro pen; SIM-card slot with space for an ejector pin' },
    { k: 'Warranty', v: '3 years — faults in materials and workmanship, original purchase date' },
    { k: 'Price', v: 'US$145 (premium leather)' },
  ],
  evidence: [
    { label: 'Best Travel Wallet guide — Bellroy Travel Wallet, best for full-time travellers', publisher: 'Pack Hacker', url: 'https://www.packhacker.com/blog/general/best-travel-wallet/' },
    { label: 'Bellroy Travel Wallet review — 7.8/10', publisher: 'Pack Hacker', url: 'https://www.packhacker.com/travel-gear/bellroy/travel-wallet-2' },
  ],
  match: { brand: '^bellroy$', model: 'travel\\s*wallet', note: 'Bellroy Travel Wallet was not found on Flipkart / Amazon.in in this dataset.' },
};
