// Swimming caps — keeps hair out of the mask strap and salt out of the hair on snorkel days.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const T = require('../lib/trip.cjs');
const { oneOf, warrantyMonths } = require('../lib/parse.cjs');

const MATERIAL = [['silicone', /silicon/i], ['latex', /latex|rubber/i], ['pu', /\bpu\b|polyurethane|pu[-\s]?coat/i], ['fabric', /lycra|polyester|spandex|elastane|nylon|fabric|cloth|mesh|textile/i]];
const LONG = /long\s*hair|extra\s*(?:large|room|space)|ponytail|pony\s*tail|braids?|dread|afro|voluminous|thick\s*hair|bubble|3d\s*(?:ergonomic|design)|large\s*(?:size|fit)/i;

export default {
  id: 'swim-caps',
  label: 'Swimming caps',
  kicker: 'SWIM',
  family: 'trip',
  brandStore: true,
  collapseVariants: true,
  unit: 'swim cap',
  blurb: 'Swimming caps on Flipkart and Amazon.in — scored on the material (silicone seals and lasts; lycra soaks through), long-hair room, seamless / wrinkle-free moulding, ear coverage and weight the spec table or maker page states. "Premium waterproof" in a title earns nothing, and shower caps never enter.',
  sources: { flipkart: ['lk2_fk_pages.0.json', 'lk2_fk_pages.1.json', 'lk2_fk_pages.2.json'], amazon: ['lk2_amz_pages.json', 'lk2_amz_pages.rev.json', 'lk2_amz_pages.mid.json'] },
  include: T.includer({
    strong: /swim(?:ming)?\s*(?:pool\s*)?caps?\b|swim(?:ming)?\s*hats?|bathing\s*caps?|silicone\s*(?:swim(?:ming)?\s*)?caps?|swimming\s*head\s*cap/i,
    // Goggle-and-cap kits are listed under goggles (one listing, one place); shower caps and hair-care caps are not swimwear.
    hard: /goggles?|shower\s*caps?|hair\s*(?:spa|treatment|steam|dye|colou?r)\s*caps?|heat(?:ing)?\s*caps?|conditioning\s*caps?|bonnets?|disposable|shampoo|baseball|bucket\s*hat|beanie|cricket|helmet/i,
    noKids: true,
  }),
  segment: {
    key: 'seg', label: 'Material',
    options: [
      { id: 'silicone', label: 'Silicone' },
      { id: 'fabric', label: 'Lycra / fabric' },
      { id: 'other', label: 'Latex / PU' },
      { id: 'unstated', label: 'Material not stated' },
    ],
    of: (F) => (F.material ? (F.material.value === 'silicone' ? 'silicone' : F.material.value === 'fabric' ? 'fabric' : 'other') : 'unstated'),
  },
  fields: [
    { key: 'material', label: 'Material', group: 'Materials', dim: 'specs', weight: 3, title: true,
      listing: ['Material', 'Cap Material', 'Fabric', 'Outer Material', 'Material Type', 'Material Composition'], official: ['material', 'fabric', 'made of', 'silicone'],
      parse: (s) => oneOf(s, MATERIAL), display: (v) => ({ silicone: 'Silicone', latex: 'Latex / rubber', pu: 'PU-coated', fabric: 'Lycra / fabric' })[v], points: (v) => (v === 'silicone' ? 1 : v === 'pu' ? 0.85 : v === 'latex' ? 0.6 : 0.4) },
    T.feature('long', 'Room for long / thick hair stated', 'Fit', LONG, { weight: 1.5, listing: ['Hair Length', 'Suitable For', 'Ideal For', 'Type', 'Fit', 'Features', 'Special Feature', 'Other Details', 'Additional Features'], official: ['long hair', 'ponytail', 'thick hair', 'extra room'], noPts: 0.4 }),
    T.feature('seamless', 'Seamless / wrinkle-free moulding', 'Fit', /seamless|wrinkle[-\s]?free|no\s*wrinkles?|one[-\s]?piece\s*mould|moulded|molded|smooth\s*fit/i, { weight: 1, listing: ['Features', 'Special Feature', 'Other Details', 'Additional Features', 'Design'], official: ['seamless', 'wrinkle'] , noPts: 0.4 }),
    T.feature('thick', 'Thickness stated (tear resistance)', 'Materials', /(?:\d(?:\.\d+)?\s*mm\s*thick|thick(?:er|ened)?\s*silicone|tear[-\s]?resist|anti[-\s]?tear|durable\s*silicone)/i, { weight: 1, listing: ['Thickness', 'Features', 'Special Feature', 'Other Details'], official: ['thick', 'tear'], noPts: 0.3 }),
    T.feature('ear', 'Ear coverage / ear pockets', 'Protection', /ear\s*(?:pocket|cover|protect|guard|flap|pouch)|covers?\s*(?:the\s*)?ears?|over\s*(?:the\s*)?ears?/i, { dim: 'safety', weight: 2, listing: ['Ear Protection', 'Features', 'Special Feature', 'Other Details', 'Additional Features'], official: ['ear'], noPts: 0.3 }),
    T.feature('safe', 'Hypoallergenic / non-toxic material stated', 'Protection', /hypo[-\s]?allergenic|non[-\s]?toxic|food[-\s]?grade|medical[-\s]?grade|bpa[-\s]?free|latex[-\s]?free|odou?r[-\s]?(?:less|free)|skin[-\s]?friendly/i, { dim: 'safety', weight: 2, listing: ['Material', 'Features', 'Special Feature', 'Other Details', 'Additional Features'], official: ['hypoallergenic', 'non-toxic', 'food grade', 'latex free'], noPts: 0.3 }),
    T.feature('uv', 'UV / chlorine resistance stated', 'Protection', /uv[-\s]?(?:resist|protect|proof)|chlorine[-\s]?(?:resist|proof)|salt[-\s]?water\s*resist/i, { dim: 'safety', weight: 1, listing: ['Features', 'Special Feature', 'Other Details', 'Additional Features'], official: ['uv', 'chlorine'], noPts: 0.3 }),
    T.weightField({ min: 15, max: 400, light: 60, mid: 100 }),
    { key: 'warranty', label: 'Warranty', group: 'Support', dim: 'maker', weight: 0, title: true,
      listing: ['Warranty Summary', 'Warranty', 'Domestic Warranty', 'Warranty Period'], official: ['warranty', 'warranty period'],
      parse: warrantyMonths, display: (v) => (v % 12 === 0 ? `${v / 12} year${v > 12 ? 's' : ''}` : `${v} months`), plausible: (v) => (v <= 36 && v >= 1) || `${v} months warranty is not plausible` },
  ],
  match: { descriptive: [...T.DESCRIPTIVE, 'swimming', 'swim', 'cap', 'caps', 'silicone', 'silicon', 'adult', 'adults', 'long', 'hair', 'ear', 'protection', 'pool', 'bathing', 'unisex', 'solid', 'plain', 'printed'], bundleNouns: ['goggles', 'earplugs', 'nose clip', 'towel', 'bag'], numeric: [T.wearerNumeric] },
  officialProse: {
    'material (page text)': (t) => { const m = /(100\s*%\s*silicone|silicone|latex|lycra|polyester)/i.exec(t); return m ? m[1] : null; },
    'long hair (page text)': (t) => (LONG.test(t) ? 'Yes' : null),
    'ear coverage (page text)': (t) => (/ear\s*(?:pocket|cover|protect|guard)|covers?\s*(?:the\s*)?ears?/i.test(t) ? 'Yes' : null),
    'weight (page text)': (t) => { const m = /(\d{2,3})\s*(?:g|gm|grams?)\b/i.exec(t); return m ? m[0] : null; },
  },
  facets: [
    { group: 'mat', label: 'Material', hint: 'Silicone seals and lasts; lycra soaks through', of: (F) => (F.material ? F.material.value : null), labels: { silicone: 'Silicone', latex: 'Latex / rubber', pu: 'PU-coated', fabric: 'Lycra / fabric' } },
    { group: 'fit', label: 'Fit & protection', hint: 'Stated in a spec row or on the maker page', multi: true,
      of: (F) => [F.long && F.long.value && F.long.tier !== 'claimed' ? 'long' : null, F.ear && F.ear.value && F.ear.tier !== 'claimed' ? 'ear' : null, F.seamless && F.seamless.value && F.seamless.tier !== 'claimed' ? 'seamless' : null, F.safe && F.safe.value && F.safe.tier !== 'claimed' ? 'safe' : null].filter(Boolean),
      labels: { long: 'Long-hair room', ear: 'Ear coverage', seamless: 'Seamless / wrinkle-free', safe: 'Hypoallergenic stated' } },
  ],
  featured: ['seg:silicone', 'mat:silicone', 'fit:long', 'fit:ear', 'fit:seamless', 'ev:official', 'maker:global', 'maker:india'],
  lines: {
    q: (F) => [F.material ? F.material.display : null, F.long && F.long.value ? 'long-hair room' : null, F.ear && F.ear.value ? 'ear coverage' : null].filter(Boolean).join(' · '),
    f: (F) => [F.seamless && F.seamless.value ? 'seamless' : null, F.safe && F.safe.value ? 'hypoallergenic' : null, F.weight && F.weight.tier !== 'rejected' ? F.weight.display : null].filter(Boolean).join(' · '),
  },
};
