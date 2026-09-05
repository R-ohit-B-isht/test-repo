// Power banks — reference ceiling. Facts read off the maker page on `checked`.
export default {
  category: 'power-banks',
  brand: 'Anker',
  name: 'Anker Prime Power Bank (27,650 mAh, 250 W) — A1340',
  why: 'The most complete portable pack a maker has published specs for: 27,650 mAh in an airline-legal 99.56 Wh, 250 W total across two USB-C + USB-A, 140 W PD 3.1 in and out, a live per-port power display and an app — all stated on the maker page, with independent reviews naming it the best power bank they have tested.',
  checked: '2026-07-19',
  caution: null,
  maker: {
    label: 'Anker Innovations — official product page (US)',
    url: 'https://www.anker.com/products/a1340-250w-power-bank',
    title: 'Anker Prime Power Bank (27K, 250W) - Anker US',
    region: 'US',
  },
  image: {
    url: 'https://cdn.shopify.com/s/files/1/0493/9834/9974/files/Rectangle1_885945a5-b5d8-439f-bc99-54bf72715ff4.png?v=1762766510',
    source: 'anker.com product page (og:image)',
  },
  facts: [
    { k: 'Rated capacity', v: '27,650 mAh (3,950 mAh × 7 cells)' },
    { k: 'Total output', v: '250 W max' },
    { k: 'USB-C output', v: 'up to 28 V ⎓ 5 A (140 W, PD 3.1) per port' },
    { k: 'USB-A output', v: 'up to 10 V ⎓ 6.5 A (65 W)' },
    { k: 'Input', v: 'USB-C 28 V ⎓ 5 A (140 W); 100 W pogo-pin base' },
    { k: 'Ports', v: '2 × USB-C, 1 × USB-A' },
    { k: 'Size', v: '2.24 × 1.96 × 6.37 in' },
  ],
  evidence: [
    { label: 'Anker Prime 27,650 mAh Power Bank (250 W) review — Editors’ Choice', publisher: 'Macworld', url: 'https://www.macworld.com/article/2345205/anker-prime-27650mah-power-bank-250w-review-portable-power-for-your-macbook.html' },
    { label: 'Anker Prime 27,650 mAh 250 W Power Bank review: the best power bank I’ve ever used', publisher: 'Android Central', url: 'https://www.androidcentral.com/accessories/anker-prime-27650mah-250w-power-bank-review' },
    { label: 'Anker Prime 27,650 mAh 250 W Power Bank review', publisher: 'Gadgetoid', url: 'https://gadgetoid.com/2024/04/28/anker-prime-27650mah-250w-power-bank-review' },
  ],
  // Indian marketplace match (brand + model regex over "brand model"); sibling Prime packs (20K/26K) must not match.
  match: { brand: '^anker$', model: 'prime.*27,?650|27,?650.*prime|a1340', note: 'Anker sells the Prime 27,650 mAh 250 W in India only intermittently; a Prime 20,000 mAh / 26,250 mAh sibling is not counted as the same product.' },
};
