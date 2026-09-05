// Trekking backpacks — reference ceiling. Facts read off osprey.com (rendered in a browser) on `checked`.
export default {
  category: 'trekking-backpacks',
  brand: 'Osprey',
  name: 'Osprey Atmos AG LT 65 — men’s backpacking pack',
  why: 'A 65-litre trekking pack whose maker publishes every load-bearing number — 30–40 lb load range, 3,967 in³ / 65 L (S/M) volume, 4.068 lb / 1.845 kg, 12.6 × 15.35 × 33.46 in — on its own product page. OutdoorGearLab’s lab test names it Best Overall Backpacking Backpack at 88/100, with its measured 4.2 lb and 65 L confirming the maker figures.',
  checked: '2026-09-05',
  caution: 'No Osprey listing exists on Flipkart / Amazon.in in this dataset, so no in-list rank is shown. The women’s Aura AG LT 65, the Atmos AG LT 50 and the heavier Atmos AG 65 are different models and are not matched.',
  maker: {
    label: 'Osprey Packs — official product page (US)',
    url: 'https://www.osprey.com/atmos-ag-lt-65-atmos65lt-476',
    title: 'Atmos AG LT 65 - Men’s Lightweight Backpacking Pack',
    region: 'US',
  },
  image: {
    url: 'https://www.osprey.com/media/catalog/product/cache/b2f1ce2dfe10d3d31bf2056bf6e0d10f/A/t/AtmosAGLT65_Side_ScenicValleyGreenPeppercorn-resized.jpg',
    source: 'osprey.com product gallery (side view, Scenic Valley / Green Peppercorn)',
  },
  facts: [
    { k: 'Volume', v: 'S/M 3,967 in³ / 65 L; L/XL 4,150 in³ / 68 L' },
    { k: 'Load range', v: '30–40 lb (13.6–18.1 kg)' },
    { k: 'Weight', v: 'S/M 4.068 lb / 1.845 kg; L/XL 4.245 lb / 1.925 kg' },
    { k: 'Size', v: 'S/M 12.6 H × 15.35 W × 33.46 D in; L/XL 12.6 × 15.35 × 35.43 in' },
    { k: 'Wearer', v: 'Men’s (the Aura AG LT 65 is the women’s counterpart)' },
  ],
  evidence: [
    { label: 'Osprey Atmos AG LT 65 review — Best Overall Backpacking Backpack, 88/100 (measured 4.2 lb, 65 L)', publisher: 'OutdoorGearLab', url: 'https://www.outdoorgearlab.com/reviews/camping-and-hiking/backpacks-backpacking/osprey-atmos-ag-lt-65' },
    { label: 'The Best Backpacking Backpacks — award list', publisher: 'OutdoorGearLab', url: 'https://www.outdoorgearlab.com/topics/camping-and-hiking/best-backpacks-backpacking' },
  ],
  // Aura (women’s), Atmos AG LT 50 and Atmos AG 65 (non-LT) are different models.
  match: { brand: '^osprey$', model: 'atmos\\s*ag\\s*lt\\s*65|atmos65lt', note: 'Osprey Atmos AG LT 65 was not found on Flipkart / Amazon.in in this dataset; the Aura AG LT 65, Atmos AG LT 50 and Atmos AG 65 are not counted.' },
};
