// Swim goggles — reference ceiling. Facts read off zone3.com (product page + public product API) on `checked`.
export default {
  category: 'swim-goggles',
  brand: 'Zone3',
  name: 'Vapour Swim Goggles',
  why: 'An open-water goggle whose maker states the properties this category credits — anti-fog treated lenses with 100 % UVA protection, ultra-soft silicone gaskets, large curved lenses for peripheral vision, an easy-adjust strap and a choice of polarised or photochromatic lenses for glare on open water — and backs it with a 12-month warranty. Tom’s Guide’s swimming-goggle test names it best for open water, which is what a Lakshadweep lagoon is; pool racing goggles trade that field of view for a low profile.',
  checked: '2026-09-26',
  caution: 'Zone3 sells from a UK storefront and no Zone3 listing exists on Flipkart / Amazon.in in this dataset, so no in-list rank is shown. Tom’s Guide’s overall winner is the Zone3 Volare Streamline racing goggle; the Vapour is the open-water pick shown here because it fits the trip, not because it out-scores every goggle.',
  maker: {
    label: 'Zone3 — official product page (UK)',
    url: 'https://www.zone3.com/products/vapour-goggles',
    title: 'Vapour Swim Goggles',
    region: 'UK',
  },
  image: {
    url: 'https://cdn.shopify.com/s/files/1/0039/0434/0032/files/11648_zone3_goggles_BlackMetallic_Gold_v4_071326.png?v=1787045024',
    source: 'zone3.com product gallery (Black Metallic / Gold)',
  },
  facts: [
    { k: 'Lens', v: 'Large curved lenses; polarised or photochromatic options (also a coloured lens)' },
    { k: 'Coatings', v: 'Anti-fog treated; 100 % UVA protection' },
    { k: 'Seal', v: 'Ultra-soft silicone gaskets' },
    { k: 'Strap', v: 'Easy-adjust strap; spare straps and clips sold by the maker' },
    { k: 'Warranty', v: '12 months' },
    { k: 'Price', v: '£45' },
  ],
  evidence: [
    { label: '5 of the best swimming goggles 2025 — Zone3 Vapour Goggles, best open water', publisher: 'Tom’s Guide', url: 'https://www.tomsguide.com/best-picks/best-swimming-goggles' },
    { label: 'Vapour Swim Goggles — key features (anti-fog, 100 UVA, silicone gaskets, polarised / photochromatic)', publisher: 'Zone3', url: 'https://www.zone3.com/products/vapour-goggles' },
  ],
  match: { brand: '^zone\\s*3$', model: 'vapou?r', note: 'Zone3 Vapour was not found on Flipkart / Amazon.in in this dataset.' },
};
