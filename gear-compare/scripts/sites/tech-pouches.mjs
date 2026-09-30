// Tech / accessory pouches — chargers, cables, power bank, earphones, small accessories in one place.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const O = require('../lib/organizer.cjs');

export default {
  id: 'tech-pouches',
  label: 'Tech & accessory pouches',
  kicker: 'ACCESSORIES',
  family: 'travel',
  brandStore: true,
  collapseVariants: true,
  unit: 'tech pouch',
  blurb: 'Electronics organisers, cable / charger pouches and accessory cases on Flipkart and Amazon.in — scored on stated size, shell material, layers, elastic loops and pockets, padding, water resistance and weight read from the spec table or maker page; "shockproof premium" in the title alone earns nothing.',
  sources: { flipkart: ['org_fk_pages.0.json', 'org_fk_pages.1.json', 'org_fk_pages.2.json', 'org_fk_pages.3.json', 'org_fk_pages.4.json'], amazon: ['org_amz_pages.json', 'org_amz_pages.rev.json', 'org_amz_pages.mid.json'] },
  include: O.includer({
    // Content words ("for power bank, adapter, hard disk…") only reject when the title names no organiser at all:
    // a single-product case for one gadget is not a tech pouch, an organiser that lists what it holds is.
    hard: (t) =>
      /price\s*in\s*india|shel(?:f|ves)|kitchen|closet|wardrobe|scarf|spice|\bjar|\brack|packing\s*cubes?|compression\s*cubes?|cable\s*(?:tie|clip|winder|protector|holder\s*clip|sleeve|management\s*box|box\b)|hook\s*(?:rail|&\s*loop|and\s*loop)|adhesive|\btape\b|\d{2,3}\s*(?:piece|pcs?)\s*cable|clips?\s*(?:set|pack)|velcro\s*(?:strap|tie)|desk\s*(?:organi|mat)|wall\b|\bcar\b|laptop\s*(?:sleeve|bag|backpack)|ipad\s*(?:sleeve|case)|tablet\s*(?:sleeve|case)|mouse\s*pad|keyboard|camera\s*bag|lens\s*(?:case|pouch)|drone|tripod|sling\s*bag|messenger|office\s*bag|stationery/i.test(t) ||
      (/hard\s*(?:disk|drive)|earphones?|headphones?|airpods?|earbuds?|sd\s*card|power\s*bank|adapter|pencil|pen\s*(?:case|pouch)/i.test(t) && !/organi[sz]|pouch|(?:storage|carry(?:ing)?|travel)\s*(?:bag|case)|cable|charger/i.test(t)),
    strong: /(?:electronics?|gadgets?|ge?dgets?|cables?|cords?|chargers?|tech|digital|usb)\s*(?:accessor(?:y|ies)\s*)?(?:travel\s*)?(?:gadget\s*)?(?:organi[sz]ers?|pouch(?:es)?|bags?|cases?|kit\s*bag|storage\s*(?:bag|pouch|case|organi[sz]er))|cable\s*(?:storage|management)\s*(?:bag|pouch|case|organi)|tech\s*(?:pouch|kit|case)|travel\s*(?:electronics?|gadget|digital)\s*(?:accessor(?:y|ies)\s*)?(?:organi[sz]er|pouch|bag|case|storage)|(?:organi[sz]er|pouch|bag|case)\s*for\s*(?:cables?|chargers?|electronics?|gadgets?|power\s*bank)|(?:storage|carry(?:ing)?)\s*(?:bag|pouch|case|organi[sz]er)(?:\s*bag)?\s*(?:for\s*)?(?:cables?|chargers?|electronics?|gadgets?|usb|earphones?|power\s*bank)/i,
    weak: /accessor(?:y|ies)\s*(?:travel\s*)?(?:organi[sz]er\s*)?(?:pouch(?:es)?|bags?|cases?)|travel\s*accessor(?:y|ies)\s*(?:organi[sz]er|pouch|bag|case)|(?:organi[sz]er|pouch|bag|case)\s*for\s*accessories/i,
    soft: /makeup|cosmetic|toiletr|shoe|laundry|packing\s*cubes?|passport|jewel|hair|watch|sunglass/i,
  }),
  deriveKv: (kv) => { const j = O.joinAxes(kv); return j ? { Dimensions: kv.Dimensions || j } : {}; },
  segment: {
    key: 'seg', label: 'Layout',
    options: [
      { id: 'double', label: 'Double layer' },
      { id: 'single', label: 'Single layer' },
      { id: 'hard', label: 'Hard shell (EVA)' },
    ],
    of: (F) => (F.material && F.material.value === 'eva' ? 'hard' : F.layers && F.layers.value ? 'double' : 'single'),
  },
  fields: [
    O.dimsField({ weight: 3, minL: 0.2, maxL: 8, side: [2, 40], note: 'tech pouch' }),
    O.materialField({ weight: 2, best: ['nylon', 'eva'], good: ['polyester', 'pu'] }),
    O.denierField(),
    O.featureField('layers', 'Double layer', 'Organisation', /double[-\s]?layer|two[-\s]?layer|2[-\s]?layer|dual[-\s]?layer|multi[-\s]?layer/i, { weight: 1.5, listing: ['Layers', 'Number of Layers', 'Additional Features', 'Other Features', 'Special Feature', 'Other Special Features of the Product', 'Style'], official: ['layer', 'double'], noPts: 0.5 }),
    O.featureField('loops', 'Elastic loops / straps', 'Organisation', /elastic\s*(?:loop|band|strap|holder)|loops?\b|cable\s*(?:loop|strap|holder)/i, { weight: 1.5, listing: ['Elastic Loops', 'Additional Features', 'Other Features', 'Special Feature', 'Other Special Features of the Product'], official: ['elastic', 'loop', 'strap'] }),
    O.compartmentsField({ weight: 1.5, best: 6 }),
    O.featureField('mesh', 'Mesh / zip pockets', 'Organisation', /mesh\s*pocket|zip(?:per)?\s*pocket|zippered\s*pocket|mesh/i, { weight: 1, listing: ['Mesh Pocket', 'Pockets', 'Additional Features', 'Other Features', 'Special Feature'], official: ['mesh', 'zip pocket'] }),
    O.featureField('handle', 'Carry handle', 'Organisation', /handle|grab\s*strap/i, { weight: 0.5, listing: ['Handle', 'Additional Features', 'Other Features'], official: ['handle'] }),
    O.zipsField(),
    O.weightField({ min: 20, max: 1200, light: 150, mid: 300 }),
    O.waterField({ dim: 'safety', weight: 2.5 }),
    O.featureField('padded', 'Padded / shock-absorbing shell', 'Protection', /padded|padding|shock[-\s]?(?:proof|absorb)|cushion|foam|semi[-\s]?rigid|hard\s*shell|eva\b/i, { dim: 'safety', weight: 2, listing: ['Padding', 'Padded', 'Shockproof', 'Material', 'Material Type', 'Additional Features', 'Other Features', 'Special Feature'], official: ['padded', 'padding', 'shock', 'eva', 'hard shell'], noPts: 0.2 }),
    O.warrantyField(),
  ],
  pack: O.packOf,
  cover: O.coverOf,
  match: { descriptive: O.DESCRIPTIVE, bundleNouns: ['charger', 'cable', 'power bank', 'earphones', 'laptop'], numeric: [] },
  officialProse: O.PROSE,
  facets: [
    { group: 'mat', label: 'Material', hint: '', of: (F) => (F.material ? F.material.value : null), labels: O.MATERIAL_LABEL },
    { group: 'fx', label: 'Features', hint: 'Stated', multi: true, of: (F) => [F.layers && F.layers.value ? 'double' : null, F.loops && F.loops.value ? 'loops' : null, F.padded && F.padded.value ? 'padded' : null, F.water && F.water.value ? 'water' : null, F.dims && F.dims.tier !== 'rejected' ? 'dims' : null].filter(Boolean),
      labels: { double: 'Double layer', loops: 'Elastic loops', padded: 'Padded', water: 'Water-resistant stated', dims: 'Dimensions stated' } },
  ],
  featured: ['seg:double', 'seg:hard', 'fx:loops', 'fx:padded', 'fx:water', 'fx:dims', 'mat:nylon', 'mat:eva', 'ev:official', 'maker:india', 'maker:global'],
  lines: {
    q: (F) => [F.dims && F.dims.tier !== 'rejected' ? `${F.dims.value.join(' × ')} cm` : null, F.material ? (F.denier ? `${F.denier.display} ${F.material.display.split(' /')[0]}` : F.material.display.split(' /')[0]) : null, F.layers && F.layers.value ? 'double layer' : null].filter(Boolean).join(' · '),
    f: (F) => [F.loops && F.loops.value ? 'elastic loops' : null, F.padded && F.padded.value ? 'padded' : null, F.water && F.water.value ? 'water-resistant' : null, F.weight && F.weight.tier !== 'rejected' ? F.weight.display : null].filter(Boolean).join(' · '),
  },
};
