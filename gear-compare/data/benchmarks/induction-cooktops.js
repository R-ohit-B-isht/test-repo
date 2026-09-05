// Induction cooktops — reference ceiling. Facts read off breville.com on `checked`.
export default {
  category: 'induction-cooktops',
  brand: 'Breville',
  name: 'Breville the Control Freak™ Home — BMC800',
  why: 'The only portable induction hob that controls actual pan temperature rather than a power level: a through-glass sensor reads the pan 20× a second across a published 77–428 °F (25–220 °C) range, with a food probe for probe-controlled cooking, all on a stainless body with a 2-year warranty. Independent testers (Tom’s Guide, WIRED, Sizzle & Sear) rate its precision unmatched at any price.',
  checked: '2026-09-05',
  caution: 'US 110–120 V product; the Indian marketplaces do not sell it, so no in-list rank is shown.',
  maker: {
    label: 'Breville — official product page (US)',
    url: 'https://www.breville.com/en-us/product/bmc800',
    title: 'the Control Freak™ Home | Breville (US)',
    region: 'US',
  },
  image: {
    url: 'https://assets.breville.com/cdn-cgi/image/width=1300,format=auto/BMC800/BMC800BSSUSC/pdp.png?pdp',
    source: 'breville.com product page (primary product image)',
  },
  facts: [
    { k: 'Power', v: '1,800 W, 110–120 V' },
    { k: 'Temperature range', v: '77–428 °F (25–220 °C), set by the degree' },
    { k: 'Sensing', v: 'Real-time through-glass pan sensing, 20 readings per second' },
    { k: 'Probe', v: 'Temperature probe with pot clip — Probe Control mode' },
    { k: 'Modes', v: 'Manual mode + custom presets' },
    { k: 'Housing', v: '0.4 mm stainless steel; sealed high-heat, crack-resistant ceramic glass' },
    { k: 'Size', v: '12.2 × 16.9 × 4.1 in' },
    { k: 'Weight', v: '15.37 lb (6.97 kg)' },
    { k: 'In the box', v: 'Probe, pot clip, storage box, instruction booklet' },
    { k: 'Warranty', v: '2-year limited' },
  ],
  evidence: [
    { label: 'I’ve been using Breville’s portable induction stove for 2 weeks — and now I want to replace my gas range', publisher: 'Tom’s Guide', url: 'https://www.tomsguide.com/home/kitchen-dining/ive-been-using-brevilles-portable-induction-stove-for-2-weeks-and-now-i-want-to-replace-my-gas-range' },
    { label: 'Cooking by the degree: the Control Freak Home', publisher: 'WIRED', url: 'https://www.wired.com/story/induction-by-the-degree-cooking-kitchen-zen/' },
    { label: 'Breville Control Freak Home by ChefSteps — precision for home cooks', publisher: 'Sizzle & Sear', url: 'https://www.sizzleandsear.com/article/breville-control-freak-home-by-chefsteps-precision-for-home-cooks/' },
  ],
  match: { brand: '^breville$', model: 'control freak|bmc800', note: 'Not sold on Flipkart / Amazon.in in this dataset.' },
};
