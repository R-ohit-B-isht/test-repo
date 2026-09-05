// Electric lighters — reference ceiling. Facts read off zippo.com (product page + public products/*.js) on `checked`.
export default {
  category: 'electric-lighters',
  brand: 'Zippo',
  name: 'Zippo Rechargeable Candle Lighter',
  why: 'Almost no arc-lighter maker publishes a real spec sheet; Zippo does — arc type, dimensions, weight, recharge time, materials and a one-year warranty are all stated on its own product page, from a maker with a public warranty process. Chosen for verifiable maker evidence, not for popularity: Wirecutter’s general lighter pick is the Suprus, cited below as context rather than as support for this pick, alongside Consumer Reports’ plasma-lighter tests.',
  checked: '2026-09-05',
  caution: 'No Zippo listing exists on Flipkart / Amazon.in in this dataset, so no in-list rank is shown. Listings that merely say “Zippo style” are not this product.',
  maker: {
    label: 'Zippo Manufacturing Co. — official product page (US)',
    url: 'https://zippo.com/products/rechargeable-candle-lighter',
    title: 'Rechargeable Candle Lighter – Zippo USA',
    region: 'US',
  },
  image: {
    url: 'https://zippo.com/cdn/shop/products/1e0716cc00caf63a2bfdd38be22c5b86e00b88ca.jpg?v=1742312628',
    source: 'zippo.com product image (Shopify CDN, HTTPS)',
  },
  facts: [
    { k: 'Ignition', v: 'Flameless, windproof electrical arc' },
    { k: 'Recharge', v: 'USB, approx. 90 minutes; charging cable included' },
    { k: 'Neck', v: 'Flexible neck for reaching wicks' },
    { k: 'Construction', v: 'Rugged metal' },
    { k: 'Size', v: '10.2 × 0.85 × 0.73 in' },
    { k: 'Weight', v: '0.21 lb' },
    { k: 'SKUs', v: '121573 (Rose Gold), 121651 (Candy Apple Red)' },
    { k: 'Warranty', v: '1 year' },
  ],
  evidence: [
    { label: 'Zippo Rechargeable Candle Lighter review', publisher: 'WhatGadget', url: 'https://www.whatgadget.net/zippo-rechargeable-candle-lighter-review/' },
    { label: 'Best plasma lighters — how arc lighters performed in CR’s tests (category context)', publisher: 'Consumer Reports', url: 'https://www.consumerreports.org/home-garden/plasma-lighters/best-plasma-lighters-a3752391644/' },
    { label: 'Suprus electric lighter review — Wirecutter’s pick for most people (named here as the counter-example, not as support for Zippo)', publisher: 'Wirecutter (The New York Times)', url: 'https://www.nytimes.com/wirecutter/reviews/suprus-electric-lighter-review/' },
  ],
  match: { brand: '^zippo$', model: 'candle|rechargeable', note: 'Not sold on Flipkart / Amazon.in in this dataset.' },
};
