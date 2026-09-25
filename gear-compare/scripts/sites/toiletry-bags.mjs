// Toiletry / skincare kits — the one organiser that has to survive a leaking bottle inside a rucksack.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const O = require('../lib/organizer.cjs');

export default {
  id: 'toiletry-bags',
  label: 'Toiletry & skincare kits',
  kicker: 'SKINCARE',
  family: 'travel',
  brandStore: true,
  collapseVariants: true,
  unit: 'toiletry bag',
  blurb: 'Toiletry bags, hanging wash kits, dopp kits and skincare / cosmetic travel pouches on Flipkart and Amazon.in — scored on stated size, fabric, water- and leak-resistance, hanging hook, compartments, bottle / brush holders and weight from the spec table or maker page; "leak-proof premium" in the title alone earns nothing.',
  sources: { flipkart: ['org_fk_pages.0.json', 'org_fk_pages.1.json', 'org_fk_pages.2.json', 'org_fk_pages.3.json', 'org_fk_pages.4.json'], amazon: ['org_amz_pages.json', 'org_amz_pages.rev.json', 'org_amz_pages.mid.json'] },
  include: O.includer({
    hard: /packing\s*cubes?|compression\s*cubes?|acrylic|drawer|\bdesk\b|brush(?:es)?\s*(?:set|holder)?\b(?!.*(?:bag|pouch|kit))|mirror\s*only|jewel|trolley|vanity\s*box|vanity\s*case\b(?!.*bag)|makeup\s*kit\s*(?:set|combo)\b(?!.*bag)|combo\s*of\s*(?:makeup|lipstick)|lipstick|eyeshadow|foundation|nail|razor(?!.*bag)|trimmer|hair\s*dryer|first\s*aid\s*kit\b(?!.*bag)|medicine\s*box|pill\b|lunch|diaper|baby\s*(?:bag|kit)|hanging\s*(?:shoe|shelf|wardrobe|closet|door)|wall\s*(?:hanging|mount)|hook\s*only|bottle\s*set\b(?!.*bag)|bottles?\s*(?:set|kit)\s*(?:of|for)\b(?!.*bag)|sanitary|menstrual/i,
    strong: /toiletr(?:y|ies)\s*(?:bag|pouch|kit|organi[sz]er|case)|dopp\s*kit|wash\s*bag|hanging\s*toiletr|(?:cosmetic|makeup|make-up|skincare|skin\s*care|shaving|grooming)\s*(?:travel\s*)?(?:bags?|pouch(?:es)?|organi[sz]ers?|kit\s*bag)|travel\s*(?:cosmetic|makeup|vanity|shaving|grooming)\s*(?:bag|pouch|kit|case|organi[sz]er)/i,
    weak: /toiletr(?:y|ies)|(?:beauty|vanity)\s*(?:travel\s*)?(?:bags?|pouch(?:es)?|organi[sz]ers?|case)|hanging\s*(?:travel\s*)?(?:bag|organi[sz]er|kit)|grooming\s*kit\s*bag/i,
    soft: /packing\s*cubes?|shoe\s*bag|laundry|cable|electronics|gadget|charger/i,
  }),
  deriveKv: (kv) => { const j = O.joinAxes(kv); return j ? { Dimensions: kv.Dimensions || j } : {}; },
  segment: {
    key: 'seg', label: 'Style',
    options: [
      { id: 'hanging', label: 'Hanging kit' },
      { id: 'flat', label: 'Pouch / dopp kit' },
    ],
    of: (F) => (F.hook && F.hook.value ? 'hanging' : 'flat'),
  },
  fields: [
    O.dimsField({ weight: 3, minL: 0.3, maxL: 15, side: [3, 45], note: 'toiletry bag' }),
    O.materialField({ weight: 2, best: ['nylon', 'eva'], good: ['polyester', 'pu', 'pvc', 'silicone'] }),
    O.denierField(),
    O.featureField('hook', 'Hanging hook', 'Organisation', /hang(?:ing|able)?\s*hook|\bhook\b|hang(?:ing|able)\b/i, { weight: 1.5, listing: ['Hanging Hook', 'Hook', 'Hanging', 'Additional Features', 'Other Features', 'Special Feature', 'Other Special Features of the Product', 'Style'], official: ['hook', 'hanging'], noPts: 0.5 }),
    O.compartmentsField({ weight: 1.5, best: 4 }),
    O.featureField('bottles', 'Bottle / elastic holders', 'Organisation', /elastic\s*(?:loop|band|strap|holder)|bottle\s*(?:holder|loop|slot|pocket)|brush\s*holder/i, { weight: 1, listing: ['Elastic Loops', 'Bottle Holder', 'Additional Features', 'Other Features', 'Special Feature'], official: ['elastic', 'bottle', 'holder'] }),
    O.featureField('mirror', 'Built-in mirror', 'Organisation', /mirror/i, { weight: 0.5, listing: ['Mirror', 'Additional Features', 'Other Features', 'Special Feature'], official: ['mirror'], noPts: 0.5 }),
    O.featureField('handle', 'Carry handle', 'Organisation', /handle|grab\s*strap/i, { weight: 0.5, listing: ['Handle', 'Additional Features', 'Other Features'], official: ['handle'] }),
    O.zipsField(),
    O.weightField({ min: 20, max: 1500, light: 200, mid: 400 }),
    O.waterField({ dim: 'safety', weight: 3 }),
    O.featureField('leak', 'Leak-resistant / wipe-clean lining', 'Protection', /leak[-\s]?(?:proof|resist)|wipe[-\s]?clean|pu[-\s]?coat|tpu[-\s]?coat|lined|lining|waterproof\s*lining|easy\s*to\s*clean/i, { dim: 'safety', weight: 2, listing: ['Lining', 'Inner Material', 'Leak Proof', 'Additional Features', 'Other Features', 'Special Feature'], official: ['lining', 'leak', 'wipe', 'coated'], noPts: 0.2 }),
    O.warrantyField(),
  ],
  pack: O.packOf,
  cover: O.coverOf,
  match: { descriptive: O.DESCRIPTIVE, bundleNouns: ['bottles', 'brushes', 'razor', 'trimmer', 'suitcase', 'backpack'], numeric: [] },
  officialProse: O.PROSE,
  facets: [
    { group: 'mat', label: 'Material', hint: '', of: (F) => (F.material ? F.material.value : null), labels: O.MATERIAL_LABEL },
    { group: 'fx', label: 'Features', hint: 'Stated', multi: true, of: (F) => [F.hook && F.hook.value ? 'hook' : null, F.water && F.water.value ? 'water' : null, F.leak && F.leak.value ? 'leak' : null, F.compartments && F.compartments.value >= 4 ? 'comp4' : null, F.mirror && F.mirror.value ? 'mirror' : null, F.dims && F.dims.tier !== 'rejected' ? 'dims' : null].filter(Boolean),
      labels: { hook: 'Hanging hook', water: 'Water-resistant stated', leak: 'Leak-resistant lining', comp4: '4 + compartments', mirror: 'Mirror', dims: 'Dimensions stated' } },
  ],
  featured: ['seg:hanging', 'seg:flat', 'fx:water', 'fx:leak', 'fx:comp4', 'fx:dims', 'mat:nylon', 'mat:eva', 'ev:official', 'maker:india', 'maker:global'],
  lines: {
    q: (F) => [F.dims && F.dims.tier !== 'rejected' ? `${F.dims.value.join(' × ')} cm` : null, F.material ? (F.denier ? `${F.denier.display} ${F.material.display.split(' /')[0]}` : F.material.display.split(' /')[0]) : null, F.compartments ? `${F.compartments.display} compartments` : null].filter(Boolean).join(' · '),
    f: (F) => [F.hook && F.hook.value ? 'hanging hook' : null, F.water && F.water.value ? 'water-resistant' : null, F.leak && F.leak.value ? 'lined' : null, F.weight && F.weight.tier !== 'rejected' ? F.weight.display : null].filter(Boolean).join(' · '),
  },
};
