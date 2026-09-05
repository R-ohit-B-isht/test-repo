// Trekking shoes — reference ceiling. Facts read off the official Salomon Singapore storefront (rendered in a browser) on `checked`.
export default {
  category: 'trekking-shoes',
  brand: 'Salomon',
  name: 'Salomon X Ultra 5 GORE-TEX — men’s low-cut hiking shoe',
  why: 'The hiking shoe with the strongest independent test record that also has a full maker spec sheet: 380 g, 102 mm upper, GORE-TEX waterproof membrane, Quicklace, rubber outsole, synthetic/textile upper, rated by Salomon for muddy, rocky and wet mixed terrain. OutdoorGearLab names it Best Technical Hiking Shoe (78/100 with 9/10 traction) and Treeline Review calls it the best all-around hiking shoe for men.',
  checked: '2026-09-05',
  caution: 'Salomon’s global/India product pages (salomon.com/en-in, en-us, en-gb) returned HTTP 403 to every fetch, so the maker facts come from Salomon’s official Singapore storefront, which renders the same model page. Only the men’s low-cut X Ultra 5 GORE-TEX counts — the X Ultra 5 Mid, the women’s and kids’ versions are different models and are not matched.',
  maker: {
    label: 'Salomon Singapore — official storefront, men’s X Ultra 5 GORE-TEX (colour L47725900)',
    url: 'https://sg.salomon.com/products/x-ultra-5-gore-tex',
    title: 'X ULTRA 5 GORE-TEX – SALOMON SG',
    region: 'SG',
  },
  image: {
    url: 'https://img.myshopline.com/image/store/1732177844672/L47725900-0-GHO-X-ULTRA-5-GTXTurbulence-Rainy-Day-Spicy-Mustard-png-cq5dam-web-1200-1200.jpeg?w=1200&h=1200',
    source: 'sg.salomon.com product page (og:image, colour L47725900 Turbulence / Rainy Day / Spicy Mustard)',
  },
  facts: [
    { k: 'Wearer', v: 'Men’s (women’s and kids’ X Ultra 5 are separate models)' },
    { k: 'Height', v: 'Ankle (low cut); upper height 102 mm' },
    { k: 'Weight', v: '380 g (single shoe, maker stated)' },
    { k: 'Waterproofing', v: 'GORE-TEX membrane' },
    { k: 'Upper', v: 'Synthetic / textile; textile lining' },
    { k: 'Outsole', v: 'Rubber' },
    { k: 'Lacing', v: 'Quicklace®' },
    { k: 'Foot protection', v: 'High; stable support' },
    { k: 'Rated for', v: 'Single-day routes, hiking, easy paths, mixed terrain, muddy, rocky, wet terrain' },
  ],
  evidence: [
    { label: 'Salomon X Ultra 5 Gore-Tex review — Best Technical Hiking Shoe, 78/100 (traction 9, support 8, durability 8, water resistance 8)', publisher: 'OutdoorGearLab', url: 'https://www.outdoorgearlab.com/reviews/shoes-and-boots/hiking-shoes-men/salomon-x-ultra-5-gore-tex' },
    { label: 'The Best Hiking Shoes for Men — award list where the X Ultra 5 Gore-Tex holds the technical award', publisher: 'OutdoorGearLab', url: 'https://www.outdoorgearlab.com/topics/shoes-and-boots/best-hiking-shoes' },
    { label: 'Best Hiking Shoes — Salomon X Ultra 5 Low GTX named best all-around hiking shoe for men', publisher: 'Treeline Review', url: 'https://www.treelinereview.com/gearreviews/best-hiking-shoes' },
  ],
  // The Mid, women’s and kids’ X Ultra 5 are different models: reject "mid", "women", "w", "junior", "kids".
  match: { brand: '^salomon$', model: '^(?!.*\\b(?:mid|women|w|wmn|junior|kids?|j)\\b).*x[ -]?ultra[ -]?5.*(?:gore[ -]?tex|gtx)', note: 'Salomon X Ultra 5 GORE-TEX (men’s low) was not found on Flipkart / Amazon.in in this dataset; the Mid, women’s and kids’ versions are not counted.' },
};
