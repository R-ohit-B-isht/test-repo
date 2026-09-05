// Portable blenders — reference ceiling. Facts read off sharkninja.com (Product Details) on `checked`.
export default {
  category: 'portable-blenders',
  brand: 'Ninja',
  name: 'Ninja Blast™ Max Cordless Portable Blender — BC251',
  why: 'The portable blender with the most complete maker spec sheet and the strongest independent test result: 22 oz Twist & Go vessel, built-in CrushBlade rated by Ninja for frozen ingredients and ice, three automatic programs, BPA-free and dishwasher-safe parts, a stated 13.3 V / 0.75 A pack and a 1-year warranty. WIRED names it the best portable blender overall. Chosen over the Beast GO (RTINGS’ best-overall) because Ninja publishes the electrical spec, programs and warranty that the scoring here demands.',
  checked: '2026-09-05',
  caution: 'India sells the smaller Ninja Blast (BC151, 530 ml). That is a sibling, not this product, and is shown only as a related listing.',
  maker: {
    label: 'SharkNinja — official product page (US)',
    url: 'https://www.sharkninja.com/ninja-blast-max-cordless-portable-blender-sea-glass/BC251MT.html',
    title: 'Ninja Blast™ Max Portable Blender in Teal',
    region: 'US',
  },
  image: {
    url: 'https://assets.sharkninja.com/image/upload/f_auto/q_auto/SharkNinja-NA/BC251MT_01.jpg',
    source: 'sharkninja.com product gallery (BC251MT_01; the page og:image points at a generic BC151 asset and was not used)',
  },
  facts: [
    { k: 'Model', v: 'BC251MT (Sea Glass)' },
    { k: 'Vessel', v: '22 oz Twist & Go vessel; easy-open sip lid with carry handle' },
    { k: 'Blade', v: 'Built-in CrushBlade — rated for frozen ingredients and ice' },
    { k: 'Programs', v: '3 automatic programs' },
    { k: 'Battery', v: '1 lithium-ion battery included; 13.3 V, 0.75 A' },
    { k: 'Materials', v: 'BPA-free; dishwasher-safe parts' },
    { k: 'Size', v: '4.57 in L × 3.58 in W × 12.2 in H' },
    { k: 'Weight', v: '2.45 lb' },
    { k: 'In the box', v: 'Charging cable, 5-recipe guide' },
    { k: 'Warranty', v: '1 year' },
  ],
  evidence: [
    { label: 'The Best Portable Blenders — Best Overall: Ninja Blast Max', publisher: 'WIRED', url: 'https://www.wired.com/story/best-portable-blenders/' },
    { label: 'The 4 Best Portable Blenders (lab-tested; names Beast GO Cordless best overall — context for the pick above)', publisher: 'RTINGS', url: 'https://www.rtings.com/blender/reviews/best/portable' },
  ],
  // The 530 ml Ninja Blast (BC151) is a sibling → related, never "found".
  match: { brand: '^ninja$', model: 'blast', exact: false, note: 'Flipkart / Amazon.in sell the smaller Ninja Blast (BC151, 530 ml) — a sibling of the Blast Max, not the same product.' },
};
