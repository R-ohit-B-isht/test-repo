// Laundry / dirty-clothes bags and underwear organisers — the "other essentials" layer that keeps worn clothes apart.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const O = require('../lib/organizer.cjs');
const { oneOf } = require('../lib/parse.cjs');

const CLOSURE = [['zip', /zip/i], ['drawstring', /draw\s*string|drawstring|cord|toggle/i], ['roll', /roll[-\s]?top|roll/i], ['open', /open\s*top|no\s*closure/i]];

export default {
  id: 'laundry-bags',
  label: 'Laundry & underwear bags',
  kicker: 'ESSENTIALS',
  family: 'travel',
  brandStore: true,
  collapseVariants: true,
  unit: 'laundry bag',
  blurb: 'Travel laundry bags, dirty-clothes pouches and underwear / undergarment organisers on Flipkart and Amazon.in — scored on stated size, fabric, closure, water resistance (keeps damp clothes from the rest), wet/dry separation and weight from the spec table or maker page; "odour-proof premium" in the title alone earns nothing.',
  sources: { flipkart: ['org_fk_pages.0.json', 'org_fk_pages.1.json', 'org_fk_pages.2.json', 'org_fk_pages.3.json', 'org_fk_pages.4.json'], amazon: ['org_amz_pages.json', 'org_amz_pages.rev.json', 'org_amz_pages.mid.json'] },
  include: O.includer({
    // "45 L Laundry Bag" is Flipkart's household hamper listing; a travel laundry bag is never sold by the litre.
    hard: (t) => {
      const l = /(\d{2,3})\s*(?:l|ltr|litres?|liters?)\b/i.exec(t);
      return (l && Number(l[1]) >= 20) || /packing\s*(?:\w+\s*)?cubes?|compression\s*cubes?|\bbox(?:es)?\b|\bbins?\b|\blids?\b|basket|hamper|washing\s*machine|machine\s*wash(?:ing)?\s*(?:bag|net)|mesh\s*(?:laundry\s*)?(?:wash|washing)\s*bags?|net\s*bag\s*for\s*(?:wash|laundry)|delicates?\s*wash|drawer\s*(?:organi|divider)|wardrobe|closet|hanging\s*(?:organi|shelf)|storage\s*box|foldable\s*box|cabinet|diaper|nappy|baby\s*(?:bag|clothes)|beach\s*bag|bra\s*(?:set|pack|combo)\b(?!.*(?:bag|organi))|panty|panties|briefs?\b(?!.*(?:bag|organi))|socks?\s*(?:set|pack|pair)\b(?!.*(?:bag|organi))/i.test(t);
    },
    strong: /laundry\s*(?:bags?|pouch(?:es)?|sacks?|organi[sz]er)|dirty\s*(?:clothes|cloth|laundry)\s*(?:bags?|pouch(?:es)?|organi[sz]er)|wet[-\s/]?dry\s*(?:separation\s*)?(?:bag|pouch|organi)|travel\s*(?:laundry|underwear|lingerie)\s*(?:bag|pouch|organi[sz]er)/i,
    weak: /(?:underwear|undergarment|under\s*garment|lingerie|innerwear|bra|socks?)\s*(?:travel\s*)?(?:organi[sz]ers?|bags?|pouch(?:es)?|storage\s*bag)/i,
    soft: /shoe|toiletr|cosmetic|makeup|packing\s*cubes?|cable|electronics|passport|swim(?:ming|suit)?\s*bag|gym\s*bag/i,
  }),
  deriveKv: (kv) => { const j = O.joinAxes(kv); return j ? { Dimensions: kv.Dimensions || j } : {}; },
  segment: {
    key: 'seg', label: 'Purpose',
    options: [
      { id: 'laundry', label: 'Laundry / dirty clothes' },
      { id: 'underwear', label: 'Underwear organiser' },
    ],
    of: (F) => (F.kind && F.kind.value === 'underwear' ? 'underwear' : 'laundry'),
  },
  fields: [
    { key: 'kind', label: 'Purpose', group: 'Type', dim: 'specs', weight: 0, title: true,
      listing: ['Type', 'Product Type', 'Item Type Name', 'Style'], official: ['type'],
      parse: (s) => (/underwear|undergarment|lingerie|innerwear|bra\b|socks?/i.test(s) ? 'underwear' : /laundry|dirty/i.test(s) ? 'laundry' : null), display: (v) => (v === 'underwear' ? 'Underwear organiser' : 'Laundry bag') },
    O.dimsField({ weight: 3, minL: 0.5, maxL: 40, side: [3, 70], note: 'laundry bag' }),
    O.materialField({ weight: 2, best: ['nylon'], good: ['polyester', 'mesh', 'canvas'] }),
    O.denierField(),
    { key: 'closure', label: 'Closure', group: 'Organisation', dim: 'specs', weight: 1.5, title: true,
      listing: ['Closure', 'Closure Type', 'Opening', 'Style'], official: ['closure', 'zip', 'drawstring'],
      parse: (s) => oneOf(s, CLOSURE), display: (v) => ({ zip: 'Zip', drawstring: 'Drawstring', roll: 'Roll top', open: 'Open top' })[v] || v, points: (v) => (v === 'zip' || v === 'roll' ? 1 : v === 'drawstring' ? 0.8 : 0.4) },
    O.featureField('sep', 'Wet / dry or clean / dirty separation', 'Organisation', /wet[-\s/]?dry|clean[-\s/]?dirty|two\s*compartment|2\s*compartment|dual\s*compartment|separat/i, { weight: 1.5, listing: ['Compartments', 'Number of Compartments', 'Additional Features', 'Other Features', 'Special Feature', 'Other Special Features of the Product'], official: ['wet', 'dry', 'separat', 'compartment'], noPts: 0.4 }),
    O.compartmentsField({ weight: 1, best: 2 }),
    O.featureField('vent', 'Breathable / mesh panel', 'Organisation', /breathab|mesh|vent|air\s*flow/i, { weight: 1, listing: ['Mesh', 'Breathable', 'Additional Features', 'Other Features', 'Special Feature'], official: ['mesh', 'breathable'], noPts: 0.4 }),
    O.zipsField(),
    O.weightField({ min: 15, max: 1200, light: 100, mid: 250 }),
    O.waterField({ dim: 'safety', weight: 3 }),
    O.featureField('lining', 'Waterproof / wipe-clean lining', 'Protection', /lined|lining|wipe[-\s]?clean|pu[-\s]?coat|tpu|leak[-\s]?proof|waterproof\s*inner/i, { dim: 'safety', weight: 1.5, listing: ['Lining', 'Inner Material', 'Additional Features', 'Other Features'], official: ['lining', 'wipe', 'coated'], noPts: 0.3 }),
    O.warrantyField(),
  ],
  pack: O.packOf,
  match: { descriptive: O.DESCRIPTIVE, bundleNouns: ['suitcase', 'backpack', 'trolley'], numeric: [] },
  officialProse: O.PROSE,
  facets: [
    { group: 'mat', label: 'Material', hint: '', of: (F) => (F.material ? F.material.value : null), labels: O.MATERIAL_LABEL },
    { group: 'fx', label: 'Features', hint: 'Stated', multi: true, of: (F) => [F.closure && F.closure.value === 'zip' ? 'zip' : null, F.closure && F.closure.value === 'drawstring' ? 'drawstring' : null, F.sep && F.sep.value ? 'sep' : null, F.water && F.water.value ? 'water' : null, F.vent && F.vent.value ? 'vent' : null, F.dims && F.dims.tier !== 'rejected' ? 'dims' : null].filter(Boolean),
      labels: { zip: 'Zip closure', drawstring: 'Drawstring', sep: 'Wet / dry separation', water: 'Water-resistant stated', vent: 'Breathable', dims: 'Dimensions stated' } },
  ],
  featured: ['seg:laundry', 'seg:underwear', 'fx:zip', 'fx:sep', 'fx:water', 'fx:dims', 'mat:nylon', 'mat:polyester', 'ev:official', 'maker:india'],
  lines: {
    q: (F) => [F.dims && F.dims.tier !== 'rejected' ? `${F.dims.value.join(' × ')} cm` : null, F.material ? F.material.display.split(' /')[0] : null, F.closure ? F.closure.display : null].filter(Boolean).join(' · '),
    f: (F) => [F.sep && F.sep.value ? 'wet / dry' : null, F.water && F.water.value ? 'water-resistant' : null, F.vent && F.vent.value ? 'breathable' : null, F.weight && F.weight.tier !== 'rejected' ? F.weight.display : null].filter(Boolean).join(' · '),
  },
};
