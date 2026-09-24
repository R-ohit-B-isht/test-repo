// Shoe & slipper bags — keeps footwear soles away from clothes inside the rucksack.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const O = require('../lib/organizer.cjs');

export default {
  id: 'shoe-bags',
  label: 'Shoe & slipper bags',
  kicker: 'FOOTWEAR',
  family: 'travel',
  brandStore: true,
  collapseVariants: true,
  unit: 'shoe bag',
  blurb: 'Travel shoe bags, slipper pouches and footwear organisers on Flipkart and Amazon.in — scored on stated size, fabric, pieces, see-through window, ventilation, water resistance and weight from the spec table or maker page. "Dustproof premium" in the title earns nothing.',
  sources: { flipkart: ['org_fk_pages.0.json', 'org_fk_pages.1.json', 'org_fk_pages.2.json', 'org_fk_pages.3.json', 'org_fk_pages.4.json'], amazon: ['org_amz_pages.json', 'org_amz_pages.rev.json', 'org_amz_pages.mid.json'] },
  include: O.includer({
    hard: /packing\s*(?:\w+\s*)?cubes?|compression\s*cubes?|rack|cabinet|shelf|stand\b|under\s*-?bed|underbed|\bgrid\b|storage\s*box|shoe\s*box(?!.*bag)|shoe\s*shine\b(?!.*(?:bag|pouch))|polish|insole|laces?\b|shoe\s*horn|stretcher|rain\s*(?:shoe|boot)\s*cover|silicone|disposable|reusable\s*(?:rain|waterproof\s*shoe\s*cover)|anti[-\s]?slip|\bover[-\s]?shoes?\b|hanging\s*(?:shoe\s*)?organi[sz]er|over\s*(?:the\s*)?door|shoe\s*bag\s*for\s*school|duffel|duffle|sports?\s*kit\s*bag|cricket|football\s*kit|golf/i,
    strong: /shoes?\s*(?:bags?|pouch(?:es)?|organi[sz]ers?|storage\s*(?:bags?|organi[sz]ers?|pouch)|carry\s*bags?|carrier|sacks?|covers?|travel\s*(?:bags?|case))|slippers?\s*(?:bags?|pouch(?:es)?|covers?|organi[sz]er)|footwear\s*(?:storage\s*)?(?:bags?|pouch(?:es)?|organi[sz]ers?)|sneaker\s*(?:bags?|pouch)|shoes?\s*(?:packing|dust)\s*(?:bag|cover)/i,
    weak: /(?:travel|portable)\s*shoe\s*(?:bag|organi[sz]er|pouch)|gym\s*bag.*shoe/i,
    soft: /toiletr|cosmetic|makeup|packing\s*cubes?|laundry|wardrobe|closet|under\s*-?bed/i,
  }),
  deriveKv: (kv) => { const j = O.joinAxes(kv); return j ? { Dimensions: kv.Dimensions || j } : {}; },
  segment: {
    key: 'seg', label: 'Set',
    options: [
      { id: 'set', label: 'Set · 2 + bags' },
      { id: 'single', label: 'Single bag' },
      { id: 'unstated', label: 'Count not stated' },
    ],
    of: (F) => (F.pieces && F.pieces.tier !== 'rejected' ? (F.pieces.value >= 2 ? 'set' : 'single') : 'unstated'),
  },
  fields: [
    O.dimsField({ weight: 3, minL: 0.5, maxL: 25, side: [3, 60], note: 'shoe bag' }),
    O.piecesField({ max: 12, weight: 1, points: (v) => (v >= 4 ? 1 : v >= 2 ? 0.85 : 0.7) }),
    O.materialField({ weight: 2, best: ['nylon'], good: ['polyester', 'pu', 'pvc'] }),
    O.denierField(),
    O.featureField('window', 'See-through window', 'Organisation', /window|transparent|see[-\s]?through|clear\s*(?:panel|top|pvc)/i, { weight: 1.5, listing: ['Window', 'Transparent', 'Additional Features', 'Other Features', 'Special Feature', 'Other Special Features of the Product'], official: ['window', 'transparent', 'see-through'] }),
    O.featureField('vent', 'Ventilation (mesh / breathable panel)', 'Organisation', /vent|breathab|mesh|air\s*hole|odou?r/i, { weight: 1.5, listing: ['Ventilation', 'Breathable', 'Mesh', 'Additional Features', 'Other Features', 'Special Feature'], official: ['ventilat', 'breathable', 'mesh'] }),
    O.featureField('divider', 'Pair divider / two compartments', 'Organisation', /divider|separat|two\s*compartment|2\s*compartment|dual\s*compartment/i, { weight: 1, listing: ['Divider', 'Number of Compartments', 'Compartments', 'Additional Features'], official: ['divider', 'compartment'] }),
    O.featureField('handle', 'Carry handle', 'Organisation', /handle|grab\s*strap/i, { weight: 0.5, listing: ['Handle', 'Additional Features', 'Other Features'], official: ['handle'] }),
    O.zipsField(),
    O.weightField({ min: 15, max: 1500, light: 120, mid: 300 }),
    O.waterField({ dim: 'safety', weight: 3 }),
    O.featureField('lining', 'Wipe-clean / lined interior', 'Protection', /lined|lining|wipe[-\s]?clean|pu[-\s]?coat|easy\s*to\s*clean/i, { dim: 'safety', weight: 1.5, listing: ['Lining', 'Inner Material', 'Additional Features'], official: ['lining', 'wipe', 'coated'], noPts: 0.3 }),
    O.warrantyField(),
  ],
  pack: O.packOf,
  match: { descriptive: O.DESCRIPTIVE, bundleNouns: ['shoes', 'sneakers', 'suitcase', 'trolley', 'backpack'],
    numeric: [{ label: 'pieces', show: (v) => `${v} pcs`, tol: 0, listing: (l) => O.pieces(l.title), catalog: (c) => O.pieces(c.title) }] },
  officialProse: O.PROSE,
  facets: [
    { group: 'mat', label: 'Material', hint: '', of: (F) => (F.material ? F.material.value : null), labels: O.MATERIAL_LABEL },
    { group: 'fx', label: 'Features', hint: 'Stated', multi: true, of: (F) => [F.window && F.window.value ? 'window' : null, F.vent && F.vent.value ? 'vent' : null, F.water && F.water.value ? 'water' : null, F.divider && F.divider.value ? 'divider' : null, F.dims && F.dims.tier !== 'rejected' ? 'dims' : null].filter(Boolean),
      labels: { window: 'See-through window', vent: 'Ventilated', water: 'Water-resistant stated', divider: 'Pair divider', dims: 'Dimensions stated' } },
  ],
  featured: ['seg:set', 'seg:single', 'fx:window', 'fx:vent', 'fx:water', 'fx:dims', 'mat:nylon', 'mat:polyester', 'ev:official', 'maker:india'],
  lines: {
    q: (F) => [F.pieces ? F.pieces.display : null, F.dims && F.dims.tier !== 'rejected' ? `${F.dims.value.join(' × ')} cm` : null, F.material ? F.material.display.split(' /')[0] : null].filter(Boolean).join(' · '),
    f: (F) => [F.window && F.window.value ? 'window' : null, F.vent && F.vent.value ? 'ventilated' : null, F.water && F.water.value ? 'water-resistant' : null, F.weight && F.weight.tier !== 'rejected' ? F.weight.display : null].filter(Boolean).join(' · '),
  },
};
