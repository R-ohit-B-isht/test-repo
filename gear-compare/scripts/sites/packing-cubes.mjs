// Packing cubes / compression cubes / clothes organiser sets — the clothes layer of a rucksack pack plan.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const O = require('../lib/organizer.cjs');

const KIND = [['compression', /compression|compress|vacuum|roll[-\s]?up/i], ['cylinder', /cylind|round|barrel|tube\s*shape/i], ['cube', /cube|packing|organi[sz]er/i]];
const kindOf = (F) => (F.kind ? F.kind.value : 'cube');

export default {
  id: 'packing-cubes',
  label: 'Packing cubes',
  kicker: 'CLOTHES',
  family: 'travel',
  brandStore: true,
  collapseVariants: true,
  unit: 'packing cube set',
  blurb: 'Packing cubes, compression cubes and clothes-organiser sets sold on Flipkart and Amazon.in — scored on stated dimensions, fabric and denier, weight, pieces, mesh panel and water resistance read from the spec table or the maker’s page; "premium", "ultra-light" and "100% waterproof" in the title count for nothing.',
  sources: { flipkart: ['org_fk_pages.0.json', 'org_fk_pages.1.json', 'org_fk_pages.2.json', 'org_fk_pages.3.json', 'org_fk_pages.4.json'], amazon: ['org_amz_pages.json', 'org_amz_pages.rev.json', 'org_amz_pages.mid.json'] },
  include: O.includer({
    hard: (t) => O.luggageItself(t) || /vacuum\s*(?:seal|storage|pump|bag)|saree|wardrobe|under\s*-?bed|underbed|quilt|blanket|hanging\s*(?:organi[sz]er|shelf|wardrobe)|drawer|closet|lunch|diaper|baby|kids?\s*school|pet\b|dog\b|first\s*aid|medicine|wine|bottle\s*(?:bag|cover)|garment\s*cover|suit\s*cover|shirt\s*folder(?!.*cube)|jewel|bra\b(?!.*cube)|cloth\s*storage\s*box/i.test(t),
    strong: /packing\s*(?:\w+\s*)?cubes?|travel\s*cubes?|compression\s*(?:cubes?|bags?|pouch(?:es)?|packing)|cylind\w*\s*(?:organi[sz]er|bag)|packing\s*(?:organi[sz]er|bags?|pouch(?:es)?)\s*(?:set|for\s*(?:travel|luggage|suitcase|cloth))|travel\s*organi[sz]er\s*packing\s*(?:bags?|pouch)|organi[sz]er\s*packs?\b|\d+\s*(?:pcs|pieces|piece|-?\s*in\s*-?\s*1|set|pc)\s*(?:travel|luggage)\s*(?:waterproof\s*)?(?:organi[sz]er|storage|packing|bag)|(?:travel|luggage)\s*(?:organi[sz]er|storage|packing)\s*(?:bags?|pouch(?:es)?|set)\s*(?:set\s*)?(?:of\s*\d|\d+\s*(?:pcs|pieces|piece|in\s*1))/i,
    weak: /packing\s*organi[sz]er|garment\s*folder|shirt\s*organi[sz]er|travel\s*(?:organi[sz]er|storage)\s*(?:bags?|set|cubes?|pouch)|luggage\s*organi[sz]er|clothes?\s*organi[sz]er.*travel|travel.*clothes?\s*(?:organi[sz]er|storage)/i,
    soft: /shoe|slipper|toiletr|cosmetic|makeup|make-up|passport|cable|laundry|electronics|gadget|charger|document|underwear\s*organi[sz]er|\bbra\b/i,
  }),
  deriveKv: (kv) => { const j = O.joinAxes(kv); return j ? { Dimensions: kv.Dimensions || j } : {}; },
  segment: {
    key: 'seg', label: 'Type',
    options: [
      { id: 'compression', label: 'Compression cubes' },
      { id: 'cube', label: 'Standard cubes' },
      { id: 'cylinder', label: 'Cylinder / roll organisers' },
    ],
    of: (F) => kindOf(F),
  },
  fields: [
    { key: 'kind', label: 'Cube type', group: 'Type', dim: 'specs', weight: 0, title: true,
      listing: ['Type', 'Style', 'Product Type', 'Item Type Name'], official: ['type', 'style'],
      parse: (s) => { const v = O.allOf(s, KIND); return v ? v[0] : null; }, display: (v) => ({ compression: 'Compression cube', cylinder: 'Cylinder / roll organiser', cube: 'Standard cube' })[v] },
    O.dimsField({ weight: 3, minL: 0.5, maxL: 45, side: [3, 70], note: 'packing cube' }),
    O.piecesField({ max: 24, weight: 1.5 }),
    O.materialField({ weight: 2, best: ['nylon'], good: ['polyester'] }),
    O.denierField(),
    O.featureField('mesh', 'Mesh panel (see contents / airflow)', 'Organisation', /mesh|see[-\s]?through|transparent\s*(?:top|panel|window)|breathable/i, { weight: 1.5, listing: ['Mesh', 'Mesh Panel', 'Additional Features', 'Other Features', 'Special Feature', 'Other Special Features of the Product'], official: ['mesh', 'window', 'breathable'] }),
    O.featureField('twozip', 'Double zipper / two-way zip', 'Materials', /two[-\s]?way\s*zip|double\s*zip|dual\s*zip|2[-\s]?way\s*zip/i, { weight: 0.5, listing: ['Zipper', 'Closure', 'Closure Type', 'Additional Features'], official: ['zipper', 'two-way', 'double zip'] }),
    O.featureField('handle', 'Carry handle', 'Organisation', /handle|grab\s*strap/i, { weight: 0.5, listing: ['Handle', 'Additional Features', 'Other Features', 'Special Feature'], official: ['handle'] }),
    O.zipsField(),
    O.weightField({ min: 20, max: 2500, light: 300, mid: 600 }),
    O.waterField({ dim: 'safety', weight: 3 }),
    O.featureField('lining', 'Lined interior (protects clothes)', 'Protection', /lined|lining|inner\s*lining/i, { dim: 'safety', weight: 1, listing: ['Lining', 'Inner Material', 'Additional Features'], official: ['lining', 'lined'], noPts: 0.3 }),
    O.warrantyField(),
  ],
  pack: O.packOf,
  cover: O.coverOf,
  match: { descriptive: O.DESCRIPTIVE, bundleNouns: ['suitcase', 'trolley', 'backpack', 'duffel', 'shoes'],
    numeric: [{ label: 'pieces', show: (v) => `${v} pcs`, tol: 0, listing: (l) => O.pieces(l.title), catalog: (c) => O.pieces(c.title) }] },
  officialProse: O.PROSE,
  facets: [
    { group: 'pcs', label: 'Pieces', hint: 'As stated (title claims shown, not scored)', of: (F) => (F.pieces ? (F.pieces.value >= 6 ? 'p6' : F.pieces.value >= 3 ? 'p3' : F.pieces.value >= 2 ? 'p2' : 'p1') : null), labels: { p6: '6 + pieces', p3: '3–5 pieces', p2: '2 pieces', p1: 'Single cube' } },
    { group: 'mat', label: 'Material', hint: '', of: (F) => (F.material ? F.material.value : null), labels: O.MATERIAL_LABEL },
    { group: 'fx', label: 'Features', hint: 'Stated', multi: true, of: (F) => [F.mesh && F.mesh.value ? 'mesh' : null, F.water && F.water.value ? 'water' : null, F.twozip && F.twozip.value ? 'twozip' : null, F.dims && F.dims.tier !== 'rejected' ? 'dims' : null].filter(Boolean), labels: { mesh: 'Mesh panel', water: 'Water-resistant stated', twozip: 'Two-way zip', dims: 'Dimensions stated' } },
  ],
  featured: ['seg:compression', 'seg:cube', 'pcs:p6', 'fx:mesh', 'fx:dims', 'mat:nylon', 'mat:polyester', 'ev:official', 'maker:india', 'maker:d2c'],
  lines: {
    q: (F) => [F.pieces ? F.pieces.display : null, F.dims && F.dims.tier !== 'rejected' ? `${F.dims.value.join(' × ')} cm` : null, F.material ? (F.denier ? `${F.denier.display} ${F.material.display.split(' /')[0]}` : F.material.display.split(' /')[0]) : null].filter(Boolean).join(' · '),
    f: (F) => [F.mesh && F.mesh.value ? 'mesh panel' : null, F.water && F.water.value ? 'water-resistant' : null, F.weight && F.weight.tier !== 'rejected' ? F.weight.display : null].filter(Boolean).join(' · '),
  },
};
