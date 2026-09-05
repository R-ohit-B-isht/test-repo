// Hair dryers — reference ceiling. Facts read off dyson.in on `checked`.
export default {
  category: 'hair-dryers',
  brand: 'Dyson',
  name: 'Dyson Supersonic Nural™ hair dryer — HD16',
  why: 'The only dryer whose maker publishes airflow, motor power, weight and dimensions on the product page and backs them with a 2-year guarantee: 13.3 l/s from a 1,380 W digital motor at 0.66 kg, with scalp-distance sensing that lowers heat automatically. Independent reviews from TechRadar, The Guardian, WSJ and T3 rate it the most capable dryer they have tested.',
  checked: '2026-09-05',
  caution: 'Price is not part of the ceiling. The Dyson listing on the Indian marketplaces was not found in this dataset, so no in-list rank is shown.',
  maker: {
    label: 'Dyson India — official product page',
    url: 'https://www.dyson.in/supersonic-nural-hair-dryer-blue-topaz',
    title: 'Dyson Supersonic Nural™ Hair Dryer (Vinca blue/Topaz) | Buy Now',
    region: 'IN',
  },
  image: {
    url: 'https://dyson-h.assetsadobe2.com/is/image/content/dam/dyson/leap-petite-global/products/hair-care/supersonic-nural/pdp/blue-orange/gallery/605G-PDP-Gallery-Images-VIBLTRCTPOR-01.jpg?$responsive$&cropPathE=desktop&fit=stretch,1&wid=1040',
    source: 'dyson.in product gallery (no og:image is published; first gallery image)',
  },
  facts: [
    { k: 'Model', v: 'HD16 (Supersonic Nural™)' },
    { k: 'Power', v: '1,380 W' },
    { k: 'Airflow', v: '13.3 l/s' },
    { k: 'Weight', v: '0.66 kg' },
    { k: 'Size', v: '245 mm H × 97 mm L × 78 mm W' },
    { k: 'Cable', v: '2.6 m (8.6 ft)' },
    { k: 'Ionic', v: 'Negative ions to help reduce static' },
    { k: 'Guarantee', v: '2 years (Dyson Technology India Pvt Ltd)' },
    { k: 'Made in', v: 'Philippines' },
  ],
  evidence: [
    { label: 'Dyson Supersonic Nural review: tech-packed and time-saving', publisher: 'TechRadar', url: 'https://www.techradar.com/home/hair-care/dyson-supersonic-nural-review-tech-packed-and-time-saving' },
    { label: 'Dyson Supersonic Nural review: can a hair dryer really save your scalp?', publisher: 'The Guardian', url: 'https://www.theguardian.com/thefilter/2026/feb/22/dyson-supersonic-nural-hair-dryer-review' },
    { label: 'Dyson Supersonic Nural hair dryer review — more powerful and compact than the competition', publisher: 'The Wall Street Journal (Buy Side)', url: 'https://www.wsj.com/buyside/wellness/personal-care/dyson-supersonic-nural-hair-dryer-review' },
    { label: 'Dyson Supersonic Nural review: the most intelligent hair dryer yet', publisher: 'T3', url: 'https://www.t3.com/home-living/beauty/dyson-supersonic-nural-review-the-most-intelligent-hair-dryer-yet' },
  ],
  // Sibling Supersonic (HD07/HD08/Origin) and Airwrap listings must not match.
  match: { brand: '^dyson$', model: 'nural|hd16', note: 'Only the Supersonic Nural (HD16) counts; the Supersonic Origin / HD07 / HD08 and Airwrap are different products.' },
};
