// Trimmers — reference ceiling. Facts read off the Philips US page + its public PRX specification API on `checked`.
export default {
  category: 'trimmers',
  brand: 'Philips Norelco',
  name: 'Philips Norelco All-in-One Trimmer 7000 Series — MG7975/49',
  why: 'The most completely specified trimmer from an accountable maker: Philips publishes a structured spec sheet (22 tools, 0.5–16 mm length range, 5 h run time from a 3 h charge with 5-min quick charge, 100% shower-proof, self-sharpening steel blades, up to 5-year warranty). Wirecutter names it the best beard trimmer after testing.',
  checked: '2026-09-05',
  caution: 'The US model number is MG7975/49; Flipkart / Amazon.in list Philips Norelco Multigroom 3000 / 5000 and OneBlade models but not this one, so no in-list rank is shown.',
  maker: {
    label: 'Philips — official product page (US) + PRX specification API',
    url: 'https://www.usa.philips.com/c-p/MG7975_49/all-in-one-trimmer-7000-series-22-in-1-trimmer',
    title: 'Norelco All-in-One Trimmer 7000 Series 22 in 1 Trimmer MG7975/49 | Philips',
    region: 'US',
  },
  image: {
    url: 'https://images.philips.com/is/image/philipsconsumer/0afb7d41849644a68457b39100bdb00b?$png$&wid=1200&hei=630',
    source: 'usa.philips.com product page (og:image)',
  },
  facts: [
    { k: 'Tools & accessories', v: '22' },
    { k: 'Length settings', v: '0.5–16 mm; precision up to 0.2 mm' },
    { k: 'Run time', v: '5 hours' },
    { k: 'Charging', v: '3 hours via USB-A (5 V ⎓ ≥1 A; cable included, no adapter); 5-min quick charge' },
    { k: 'Battery', v: 'Lithium-ion; charging + low-battery indicators' },
    { k: 'Wet & dry', v: '100% shower proof' },
    { k: 'Blades', v: 'Self-sharpening; BeardSense technology' },
    { k: 'Body area', v: 'Face, hair & body' },
    { k: 'Warranty', v: 'Up to 5 years' },
  ],
  evidence: [
    { label: 'The 4 Best Beard Trimmers — Top pick: Philips Norelco All-in-One Trimmer 7000 MG7975', publisher: 'Wirecutter (The New York Times)', url: 'https://www.nytimes.com/wirecutter/reviews/best-beard-trimmer/' },
    { label: 'Philips MG7975/49 — public specification API (structured maker data used above)', publisher: 'Philips PRX API', url: 'https://www.usa.philips.com/prx/product/B2C/en_US/CONSUMER/products/MG7975_49.specification' },
  ],
  // Multigroom 3000/5000/9000 siblings and OneBlade must not match.
  match: { brand: '^philips( norelco)?$|^norelco', model: 'mg7975', note: 'Only MG7975 counts; the Multigroom 3000 / 5000 / 9000 series and OneBlade are different products.' },
};
