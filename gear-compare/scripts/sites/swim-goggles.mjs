// Swimming goggles — for the pool / lagoon swims a snorkel mask is overkill for. Goggle + cap kits live here.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const T = require('../lib/trip.cjs');
const { oneOf, warrantyMonths } = require('../lib/parse.cjs');

const LENS = [['polycarbonate', /polycarbonate|\bpc\b/i], ['glass', /tempered\s*glass|\bglass\b/i], ['plastic', /plastic|acrylic|\bpvc\b|resin/i]];
const TINT = [['polarised', /polari[sz]ed/i], ['mirror', /mirror(?:ed)?|coated|metallic|revo/i], ['tinted', /tint(?:ed)?|smoke|smoked|dark|blue\s*lens|grey\s*lens|gray\s*lens|amber|shaded/i], ['clear', /clear|transparent/i]];
const SEAL = [['silicone', /silicon/i], ['tpr', /\btpr\b|thermoplastic|tpe/i], ['pvc', /\bpvc\b|rubber|plastic/i], ['foam', /foam|neoprene/i]];
const ANTIFOG = /anti[-\s]?fog|fog[-\s]?(?:free|resist|proof)|no\s*fog/i;
const UV = /\buv\b|ultra[-\s]?violet|uv400|uva|uvb/i;
const KIDS = /\bkids?\b|children|child\b|boys?\b|girls?\b|junior|toddler|baby|infant|youth/i;

export default {
  id: 'swim-goggles',
  label: 'Swimming goggles',
  kicker: 'SWIM',
  family: 'trip',
  brandStore: true,
  collapseVariants: true,
  unit: 'goggle',
  blurb: 'Swimming goggles (and goggle + cap kits) on Flipkart and Amazon.in — scored on the lens material, anti-fog coating, UV protection, tint, seal / gasket material, adjustable strap and nose bridge and included case the spec table or maker page states. "Professional anti-fog" in a title earns nothing until a spec row or the maker says so.',
  sources: { flipkart: ['lk2_fk_pages.0.json', 'lk2_fk_pages.1.json', 'lk2_fk_pages.2.json'], amazon: ['lk2_amz_pages.json', 'lk2_amz_pages.rev.json', 'lk2_amz_pages.mid.json'] },
  include: T.includer({
    strong: /swim(?:ming)?\s*(?:pool\s*)?go+g+les?|go+g+les?\s*(?:for\s*)?swim(?:ming)?|swim(?:ming)?\s*(?:accessories|kit|set|combo)\s*(?:for\s*)?[^|]{0,40}go+g+les?|swim(?:ming)?\s*(?:glasses|eyewear|eye\s*wear|spectacles)|pool\s*goggles?|(?:racing|competition|mirror(?:ed)?|open[-\s]?water|triathlon|training|fitness|lap)\s*goggles?/i,
    hard: /snorkel(?:l?ing)?\s*(?:mask|set|kit)|diving\s*mask|scuba|full[-\s]?face|prescription\s*only|ski\s*goggles?|motorcycle|bike|riding|welding|safety\s*goggles?|chemical|lab\b|sunglasses(?!.*swim)|vr\b|night\s*vision|toy|water\s*gun|earplugs?\s*only|nose\s*clip\s*only|lens\s*cleaner|defogger|anti[-\s]?fog\s*spray|case\s*only|goggle\s*(?:case|cover|pouch|strap)\s*only|swimming\s*(?:cap|costume|trunk|suit|shorts)\s*(?!.*goggle)/i,
    noKids: true,
  }),
  segment: {
    key: 'seg', label: 'Fit',
    options: [
      { id: 'adult', label: 'Adult' },
      { id: 'kids', label: 'Kids / junior' },
      { id: 'kit', label: 'Kit (goggles + cap / plugs)' },
      { id: 'unstated', label: 'Fit not stated' },
    ],
    of: (F) => (F.kit && F.kit.value ? 'kit' : F.fit ? (F.fit.value === 3 ? 'kids' : 'adult') : 'unstated'),
  },
  fields: [
    { key: 'lens', label: 'Lens material', group: 'Optics', dim: 'specs', weight: 2, title: true,
      listing: ['Lens Material', 'Lens material', 'Material', 'Frame Material'], official: ['lens material', 'lens', 'polycarbonate', 'glass composition'],
      parse: (s) => oneOf(s, LENS), display: (v) => ({ polycarbonate: 'Polycarbonate', glass: 'Tempered glass', plastic: 'Plastic / acrylic' })[v], points: (v) => (v === 'polycarbonate' ? 1 : v === 'glass' ? 0.8 : 0.5) },
    T.feature('antifog', 'Anti-fog coating', 'Optics', ANTIFOG, { weight: 3, listing: ['Anti Fog', 'Anti-Fog', 'Anti-fog', 'Lens Coating', 'Coating', 'Lens Feature', 'Lens Features', 'Features', 'Special Feature', 'Other Details', 'Additional Features', 'Technology Used', 'Technology used'], official: ['anti-fog', 'anti fog', 'fog', 'technical lens'] }),
    { key: 'tint', label: 'Lens tint', group: 'Optics', dim: 'specs', weight: 1, title: true,
      listing: ['Lens Colour', 'Lens Color', 'Lens Tint', 'Lens Type', 'Tint', 'Lens'], official: ['lens colour', 'lens color', 'tint', 'mirror', 'polarised', 'polarized', 'type of lens'],
      parse: (s) => oneOf(s, TINT), display: (v) => ({ polarised: 'Polarised', mirror: 'Mirrored', tinted: 'Tinted / smoke', clear: 'Clear' })[v], points: (v) => (v === 'polarised' ? 1 : v === 'mirror' ? 0.9 : v === 'tinted' ? 0.85 : 0.7) },
    { key: 'seal', label: 'Seal / gasket material', group: 'Fit', dim: 'specs', weight: 2, title: true,
      listing: ['Gasket Material', 'Seal Material', 'Eye Cup Material', 'Frame Material', 'Strap Material', 'Material', 'Material Type'], official: ['gasket', 'seal', 'eye cup', 'eyecup', 'silicone'],
      parse: (s) => oneOf(s, SEAL), display: (v) => ({ silicone: 'Silicone', tpr: 'TPR / TPE', pvc: 'PVC / rubber', foam: 'Foam' })[v], points: (v) => (v === 'silicone' ? 1 : v === 'tpr' ? 0.8 : v === 'foam' ? 0.5 : 0.4) },
    T.feature('strap', 'Adjustable / split strap', 'Fit', /adjustable|split\s*strap|double\s*strap|dual\s*strap|quick[-\s]?(?:adjust|release)|buckle/i, { weight: 1.5, listing: ['Strap', 'Strap Type', 'Adjustable', 'Adjustable Strap', 'Features', 'Special Feature', 'Other Details', 'Additional Features'], official: ['strap', 'adjustable', 'tightening'] }),
    T.feature('nose', 'Adjustable / interchangeable nose bridge', 'Fit', /nose\s*(?:bridge|piece|clip)s?\s*(?:adjust|interchange|replace|\d\s*size)|(?:adjustable|interchangeable|replaceable|\d\s*(?:size|pcs?))\s*nose\s*(?:bridge|piece)|\d\s*nose\s*(?:bridge|piece)s?/i, { weight: 1.5, listing: ['Nose Bridge', 'Nose Piece', 'Features', 'Special Feature', 'Other Details', 'Additional Features'], official: ['nose bridge', 'nose piece'], noPts: 0.4 }),
    T.feature('case', 'Protective case included', 'Set', /(?:with|includes?|including|\+|&|and)\s*(?:a\s*)?(?:protective\s*|hard\s*|storage\s*)?(?:case|box|pouch)|case\s*included|comes\s*with\s*(?:a\s*)?case/i, { weight: 1, listing: ['Sales Package', 'In the Box', 'Case', 'Included Components', 'Package Contents'], official: ['case', 'in the box', 'includes'], noPts: 0.5, negative: /\b(?:without|no|not\s*(?:included|supplied))\b[^.]{0,20}\b(?:case|box|pouch)|(?:case|box|pouch)\s*(?:not\s*included|sold\s*separately)/i }),
    T.feature('kit', 'Sold as a kit (cap / ear plugs / nose clip)', 'Set', /(?:with|\+|&|and|includes?)\s*(?:silicone\s*)?(?:swim(?:ming)?\s*)?cap\b|cap\s*(?:and|&|\+)\s*goggles?|ear\s*plugs?|nose\s*clip|\b(?:3|4|5|6)\s*(?:in|pcs?|piece)\s*(?:1|set|kit|combo)|combo|kit\b/i, { weight: 0, listing: ['Sales Package', 'In the Box', 'Included Components', 'Package Contents', 'Type'], official: ['in the box', 'includes', 'kit'], noPts: 0.5 }),
    { key: 'fit', label: 'Cut for', group: 'Fit', dim: 'specs', weight: 0, title: true,
      listing: ['Ideal For', 'Age Group', 'Age Range', 'Suitable For', 'Age'], official: ['age', 'ideal for', 'suitable for'],
      parse: (s) => (KIDS.test(String(s)) && !/adult|men|women|unisex/i.test(String(s)) ? 3 : /adult|men|women|unisex|senior/i.test(String(s)) ? 1 : null), display: (v) => (v === 3 ? 'Kids / junior' : 'Adult') },
    T.feature('uv', 'UV protection', 'Protection', UV, { dim: 'safety', weight: 3, listing: ['UV Protection', 'UV protection', 'Lens Coating', 'Coating', 'Lens Feature', 'Lens Features', 'Features', 'Special Feature', 'Other Details', 'Additional Features', 'Technology Used', 'Technology used'], official: ['uv', 'ultraviolet', 'technical lens'] }),
    T.feature('impact', 'Shatter / impact-resistant lens stated', 'Protection', /shatter[-\s]?(?:proof|resist)|impact[-\s]?resist|unbreakable\s*lens|scratch[-\s]?resist/i, { dim: 'safety', weight: 1.5, listing: ['Lens Feature', 'Lens Features', 'Features', 'Special Feature', 'Other Details', 'Additional Features'], official: ['shatter', 'impact', 'scratch'], noPts: 0.3 }),
    T.feature('leak', 'Leak-proof seal stated', 'Protection', /leak[-\s]?(?:proof|free|resist)|no[-\s]?leak|water[-\s]?tight|anti[-\s]?leak/i, { dim: 'safety', weight: 1.5, listing: ['Leak Proof', 'Leakproof', 'Features', 'Special Feature', 'Other Details', 'Additional Features'], official: ['leak'], noPts: 0.3 }),
    T.feature('latexfree', 'Latex-free / hypoallergenic stated', 'Protection', /latex[-\s]?free|hypo[-\s]?allergenic|skin[-\s]?friendly|non[-\s]?toxic|bpa[-\s]?free/i, { dim: 'safety', weight: 1, listing: ['Material', 'Features', 'Special Feature', 'Other Details', 'Additional Features'], official: ['latex', 'hypoallergenic'], noPts: 0.3 }),
    { key: 'warranty', label: 'Warranty', group: 'Support', dim: 'maker', weight: 0, title: true,
      listing: ['Warranty Summary', 'Warranty', 'Domestic Warranty', 'Warranty Period'], official: ['warranty', 'warranty period'],
      parse: warrantyMonths, display: (v) => (v % 12 === 0 ? `${v / 12} year${v > 12 ? 's' : ''}` : `${v} months`), plausible: (v) => (v <= 36 && v >= 1) || `${v} months warranty is not plausible` },
  ],
  match: { descriptive: [...T.DESCRIPTIVE, 'swimming', 'swim', 'goggles', 'goggle', 'glasses', 'pool', 'anti', 'fog', 'uv', 'protection', 'adult', 'adults', 'silicone', 'mirror', 'mirrored', 'clear', 'tinted', 'polarized', 'polarised', 'lens', 'wide', 'view', 'vision', 'no', 'leaking', 'leak', 'proof', 'adjustable', 'strap', 'case', 'unisex'], bundleNouns: ['cap', 'earplugs', 'nose clip', 'towel', 'bag', 'fins', 'snorkel'], numeric: [T.wearerNumeric] },
  officialProse: {
    'anti-fog (page text)': (t) => (ANTIFOG.test(t) ? 'Yes' : null),
    'uv protection (page text)': (t) => (UV.test(t) ? 'Yes' : null),
    'lens (page text)': (t) => { const m = /(polycarbonate|tempered\s*glass)\s*lens(?:es)?/i.exec(t); return m ? m[0] : null; },
    'seal (page text)': (t) => { const m = /(silicone|tpr|tpe)\s*(?:gasket|seal|eye\s*cups?|eyecups?|skirt)/i.exec(t); return m ? m[0] : null; },
    'nose bridge (page text)': (t) => (/nose\s*(?:bridge|piece)/i.test(t) ? 'Yes' : null),
  },
  facets: [
    { group: 'lens', label: 'Lens', hint: '', of: (F) => (F.lens ? F.lens.value : null), labels: { polycarbonate: 'Polycarbonate', glass: 'Tempered glass', plastic: 'Plastic / acrylic' } },
    { group: 'tint', label: 'Tint', hint: 'Mirrored / polarised for bright lagoon sun', of: (F) => (F.tint ? F.tint.value : null), labels: { polarised: 'Polarised', mirror: 'Mirrored', tinted: 'Tinted / smoke', clear: 'Clear' } },
    { group: 'seal', label: 'Seal', hint: '', of: (F) => (F.seal ? F.seal.value : null), labels: { silicone: 'Silicone', tpr: 'TPR / TPE', pvc: 'PVC / rubber', foam: 'Foam' } },
    { group: 'fx', label: 'Stated features', hint: 'Spec row or maker page', multi: true,
      of: (F) => [F.antifog && F.antifog.value && F.antifog.tier !== 'claimed' ? 'antifog' : null, F.uv && F.uv.value && F.uv.tier !== 'claimed' ? 'uv' : null, F.nose && F.nose.value && F.nose.tier !== 'claimed' ? 'nose' : null, F.case && F.case.value && F.case.tier !== 'claimed' ? 'case' : null, F.leak && F.leak.value && F.leak.tier !== 'claimed' ? 'leak' : null].filter(Boolean),
      labels: { antifog: 'Anti-fog', uv: 'UV protection', nose: 'Adjustable nose bridge', case: 'Case included', leak: 'Leak-proof stated' } },
  ],
  featured: ['seg:adult', 'seg:kit', 'fx:antifog', 'fx:uv', 'tint:mirror', 'tint:polarised', 'seal:silicone', 'lens:polycarbonate', 'fx:case', 'ev:official', 'maker:global', 'maker:india'],
  lines: {
    q: (F) => [F.antifog && F.antifog.value ? 'anti-fog' : null, F.uv && F.uv.value ? 'UV protection' : null, F.lens ? `${F.lens.display.toLowerCase()} lens` : null, F.tint ? F.tint.display.toLowerCase() : null].filter(Boolean).join(' · '),
    f: (F) => [F.seal ? `${F.seal.display.split(' /')[0]} seal` : null, F.nose && F.nose.value ? 'adjustable nose bridge' : null, F.case && F.case.value ? 'case' : null, F.kit && F.kit.value ? 'kit' : null].filter(Boolean).join(' · '),
  },
};
