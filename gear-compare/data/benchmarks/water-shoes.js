// Beach water shoes — reference ceiling. Facts read off astraldesigns.com (product page + public product API) on `checked`.
export default {
  category: 'water-shoes',
  brand: 'Astral',
  name: 'Loyak AC',
  why: 'A closed-toe water shoe whose maker publishes exactly the things this category is scored on: a razor-siped, non-marking G.15 Rubber™ / Flex Grip™ outsole for wet and dry grip, a quick-dry / quick-drain construction that also keeps sand and silt out, an ultrafine ripstop-mesh upper with TPU reinforcements, 190 g per shoe, 11 mm foot-to-ground distance and a zero-drop level footbed. OutdoorGearLab’s 36-shoe water-shoe test names the men’s Loyak AC its best overall water shoe. It is a shoe for wet rock, reef flats and boat steps — not a waterproof shoe and not an aqua sock.',
  checked: '2026-09-26',
  caution: 'Astral sells from a US storefront and no Astral listing exists on Flipkart / Amazon.in in this dataset, so no in-list rank is shown. Astral itself says “not recommended for heavy whitewater use”. The women’s Loyak (no “AC”) is a different upper on the same outsole.',
  maker: {
    label: 'Astral — official product page (US)',
    url: 'https://www.astraldesigns.com/products/loyak-ac',
    title: 'Loyak AC — Ultra-Breathable Minimalist Water Shoe',
    region: 'US',
  },
  image: {
    url: 'https://cdn.shopify.com/s/files/1/0609/6840/3158/files/PROLAXASTRALDESIGNS-INSTUDIO-1-LoyakAC-Neptue-Havy.png?v=1789497934',
    source: 'astraldesigns.com product gallery (Neptune Navy)',
  },
  facts: [
    { k: 'Type', v: 'Closed-toe lace-up water shoe; intended use SUP, training, sailing, fishing (maker: not for heavy whitewater)' },
    { k: 'Outsole', v: 'Flex Grip™ outsole in non-marking, razor-siped G.15 Rubber™ — grip on wet and dry surfaces' },
    { k: 'Drainage', v: 'Water Ready™: quick dry, quick drain, reduces entry of sand or silt' },
    { k: 'Upper', v: 'Ultrafine ripstop mesh, TPU reinforcements, water-resistant laces' },
    { k: 'Insole', v: 'Removable 45C closed-cell EVA, zero drop, Level Footbed®, minimal arch' },
    { k: 'Weight', v: '190 g / 6.7 oz per shoe (men’s US 9)' },
    { k: 'Stack', v: '11 mm foot-to-ground distance; wider toe box (Original Shape™)' },
    { k: 'Price', v: 'US$120' },
  ],
  evidence: [
    { label: 'Best Water Shoes of 2026 — Astral Loyak AC, best overall water shoes for men (36 shoes tested)', publisher: 'OutdoorGearLab', url: 'https://www.outdoorgearlab.com/topics/shoes-and-boots/best-water-shoes' },
    { label: 'Loyak AC — technical details (outsole, upper, insole, weight, foot-to-ground)', publisher: 'Astral', url: 'https://www.astraldesigns.com/products/loyak-ac' },
  ],
  match: { brand: '^astral$', model: 'loyak', note: 'Astral Loyak / Loyak AC was not found on Flipkart / Amazon.in in this dataset.' },
};
