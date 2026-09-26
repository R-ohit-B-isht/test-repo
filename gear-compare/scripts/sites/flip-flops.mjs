// Slippers / flip-flops — the dry half of island footwear: room, shower, evenings, once the water shoes are salty.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const T = require('../lib/trip.cjs');
const { oneOf, warrantyMonths } = require('../lib/parse.cjs');

const STRAP = [['rubber', /rubber/i], ['eva', /\beva\b|foam/i], ['pu', /\bpu\b|polyurethane|synthetic\s*leather|faux\s*leather/i], ['fabric', /fabric|textile|nylon|polyester|canvas|cloth|webbing|mesh/i], ['leather', /genuine\s*leather|\bleather\b/i], ['pvc', /\bpvc\b|plastic|vinyl/i]];
const STYLE = [['thong', /flip\s*-?\s*flops?|thongs?|toe\s*-?\s*post|v[-\s]?strap|hawai|y[-\s]?strap/i], ['slider', /sliders?|slides?\b|single\s*strap|one\s*strap|band\s*slipper/i], ['clog', /clogs?|crocs|closed\s*toe/i], ['slipper', /slippers?|chappals?|sandals?/i]];
const GRIP = /anti[-\s]?(?:skid|slip)|slip[-\s]?resist|non[-\s]?slip|traction|grip|textured\s*(?:out)?sole|wet\s*grip/i;
const CUSHION = /cushion|arch\s*support|orthop|ortho\b|soft\s*(?:foot\s*)?bed|footbed|memory\s*foam|padded|contoured|ergonomic|diabetic|extra\s*soft|doctor/i;
const WET = /quick[-\s]?dry|water[-\s]?friendly|washable|beach|pool|shower|bath/i;

export default {
  id: 'flip-flops',
  label: 'Slippers & flip-flops',
  kicker: 'DRY FEET',
  family: 'trip',
  collapseVariants: true,
  unit: 'pair',
  blurb: 'Rubber / EVA flip-flops, sliders and slippers on Flipkart and Amazon.in — scored on the sole and strap material, anti-slip outsole, cushioning / arch support, water-friendly use and weight a maker page or the spec table states. Fur-lined winter slippers, socks and kids\' pairs never enter; "ultra-soft premium" in a title earns nothing.',
  sources: { flipkart: ['lk2_fk_pages.0.json', 'lk2_fk_pages.1.json', 'lk2_fk_pages.2.json'], amazon: ['lk2_amz_pages.json', 'lk2_amz_pages.rev.json', 'lk2_amz_pages.mid.json'] },
  include: T.includer({
    strong: /flip\s*-?\s*flops?|slippers?\b|sliders?\b|\bslides\b|thongs?\b|chappals?|hawai(?:i|an)?\s*(?:chappal|slipper)|floaters?|clogs?\b|crocs?\b/i,
    hard: /aqua|water\s*(?:sports?\s*)?shoes?|swim(?:ming)?\s*(?:shoes?|socks?)|snorkel|diving|neoprene|reef\s*shoes?|socks?\b|fur\b|furry|plush|woolen|woollen|wool\b|winter\s*slipper|warm\s*slipper|indoor\s*(?:carpet|fluffy|fuzzy)|fluffy|fuzzy|bunny|teddy|cartoon|unicorn|disposable|hotel\s*slipper|slipper\s*(?:bags?|racks?|stands?|socks?)|shoe\s*(?:racks?|bags?|covers?)|insoles?|heel\s*pads?|sandals?\s*(?:for\s*)?(?:trekking|hiking|sports?)|sports\s*sandals?|heels?\b|wedges?\b|platform|block\s*heel|kolhapuri|ethnic|mojari|jutti|wedding|party\s*wear|formal|bathroom\s*mat|door\s*mat|dog|pet\b|massag(?:e|er)\s*slipper|acupressure|charger|phone/i,
    noKids: true,
  }),
  segment: {
    key: 'seg', label: 'Style',
    options: [
      { id: 'thong', label: 'Flip-flop (toe post)' },
      { id: 'slider', label: 'Slider' },
      { id: 'clog', label: 'Clog (closed toe)' },
      { id: 'slipper', label: 'Other slipper' },
    ],
    of: (F) => (F.style ? F.style.value : 'slipper'),
  },
  fields: [
    { key: 'sole', label: 'Outsole material', group: 'Materials', dim: 'specs', weight: 3, title: true,
      listing: ['Sole material', 'Sole Material', 'Outsole', 'Outsole Material', 'Sole', 'Outer Sole Material', 'Material'], official: ['outsole', 'sole', 'sole material', 'outsole material', 'material'],
      parse: (s) => oneOf(s, T.SOLE), display: (v) => T.SOLE_LABEL[v], points: (v) => (v === 'rubber' ? 1 : v === 'eva' ? 0.9 : v === 'tpr' ? 0.9 : v === 'pu' ? 0.75 : v === 'pvc' ? 0.5 : 0.2) },
    { key: 'strap', label: 'Strap / upper material', group: 'Materials', dim: 'specs', weight: 1.5, title: true,
      listing: ['Outer material', 'Outer Material', 'Upper Material', 'Strap Material', 'Upper', 'Material Type'], official: ['strap', 'upper', 'upper material', 'outer material'],
      parse: (s) => oneOf(s, STRAP), display: (v) => ({ rubber: 'Rubber', eva: 'EVA / foam', pu: 'PU / synthetic leather', fabric: 'Fabric / webbing', leather: 'Leather', pvc: 'PVC / plastic' })[v], points: (v) => (v === 'rubber' ? 1 : v === 'eva' ? 0.9 : v === 'fabric' ? 0.8 : v === 'pu' ? 0.7 : v === 'leather' ? 0.5 : 0.4) },
    { key: 'style', label: 'Style', group: 'Identity', dim: 'specs', weight: 0, title: true,
      listing: ['Type', 'Style', 'Product Type', 'Slipper Type', 'Closure'], official: ['type', 'style'],
      parse: (s) => oneOf(s, STYLE), display: (v) => ({ thong: 'Flip-flop (toe post)', slider: 'Slider', clog: 'Clog', slipper: 'Slipper' })[v] },
    T.feature('cushion', 'Cushioning / arch support stated', 'Comfort', CUSHION, { weight: 1.5, listing: ['Cushioning', 'Arch Support', 'Insole Material', 'Inner Material', 'Technology used', 'Technology Used', 'Other Details', 'Features', 'Special Feature', 'Additional Features', 'Comfort Features'], official: ['cushion', 'arch support', 'footbed', 'orthopedic'], noPts: 0.4 }),
    T.feature('wet', 'Water-friendly / washable use stated', 'Comfort', WET, { weight: 1, listing: ['Occasion', 'Ideal For', 'Suitable For', 'Care Instructions', 'Fabric Care', 'Other Details', 'Features', 'Special Feature', 'Additional Features', 'Water Resistant', 'Waterproof'], official: ['beach', 'pool', 'shower', 'washable', 'water friendly'], noPts: 0.5 }),
    T.weightField({ min: 80, max: 1200, light: 250, mid: 400, label: 'Weight (per pair / shoe as stated)' }),
    T.feature('grip', 'Anti-slip outsole', 'Protection', GRIP, { dim: 'safety', weight: 3, listing: ['Anti Skid', 'Anti-Skid', 'Anti Slip', 'Slip Resistant', 'Sole Features', 'Technology used', 'Technology Used', 'Other Details', 'Features', 'Special Feature', 'Additional Features'], official: ['anti-skid', 'anti skid', 'anti-slip', 'slip resistant', 'non-slip', 'traction', 'grip'] }),
    T.feature('thick', 'Sole thickness stated', 'Protection', /(?:\d(?:\.\d+)?\s*(?:cm|mm|inch)\s*(?:thick\s*)?(?:sole|heel|platform)|sole\s*(?:thickness|height)\s*[:-]?\s*\d|thick\s*sole|heel\s*height)/i, { dim: 'safety', weight: 1, listing: ['Sole Thickness', 'Heel Height', 'Sole Height', 'Platform Height', 'Heel Type', 'Other Details', 'Features'], official: ['sole thickness', 'heel height', 'thick'], noPts: 0.3 }),
    T.feature('safe', 'Skin-safe / odour-resistant material stated', 'Protection', /anti[-\s]?bacterial|anti[-\s]?microbial|odou?r[-\s]?(?:free|resist|control)|skin[-\s]?friendly|non[-\s]?toxic|hypo[-\s]?allergenic|latex[-\s]?free/i, { dim: 'safety', weight: 1, listing: ['Other Details', 'Features', 'Special Feature', 'Additional Features', 'Material'], official: ['antibacterial', 'odour', 'odor', 'skin friendly'], noPts: 0.3 }),
    { key: 'warranty', label: 'Warranty', group: 'Support', dim: 'maker', weight: 0, title: true,
      listing: ['Warranty Summary', 'Warranty', 'Domestic Warranty', 'Warranty Period'], official: ['warranty', 'warranty period'],
      parse: warrantyMonths, display: (v) => (v % 12 === 0 ? `${v / 12} year${v > 12 ? 's' : ''}` : `${v} months`), plausible: (v) => (v <= 36 && v >= 1) || `${v} months warranty is not plausible` },
  ],
  match: { descriptive: [...T.DESCRIPTIVE, 'flip', 'flops', 'flop', 'slippers', 'slipper', 'sliders', 'slider', 'chappal', 'chappals', 'thong', 'thongs', 'hawai', 'hawaii', 'rubber', 'eva', 'soft', 'daily', 'casual', 'home', 'beach', 'bathroom', 'outdoor', 'indoor', 'comfortable', 'stylish', 'trendy', 'unisex', 'solid', 'printed'], bundleNouns: ['socks', 'shoes', 'sandal', 'bag', 'towel'], numeric: [T.wearerNumeric] },
  officialProse: {
    'outsole (page text)': (t) => { const m = /([^.\n]{0,25}(?:rubber|eva|tpr|pu)\s*(?:out)?sole[^.\n]{0,30})/i.exec(t); return m ? m[1].trim() : null; },
    'strap (page text)': (t) => { const m = /(?:strap|upper)\s*:?\s*([^.\n]{3,50})/i.exec(t); return m ? m[1].trim() : null; },
    'grip (page text)': (t) => (GRIP.test(t) ? 'Yes' : null),
    'cushioning (page text)': (t) => (CUSHION.test(t) ? 'Yes' : null),
    'weight (page text)': (t) => { const m = /(\d{2,4})\s*(?:g|gm|grams?)\b/i.exec(t); return m ? m[0] : null; },
  },
  facets: [
    { group: 'sole', label: 'Outsole', hint: 'Rubber / EVA for wet floors; PVC is stiff and slips', of: (F) => (F.sole && F.sole.tier !== 'rejected' ? F.sole.value : null), labels: { rubber: 'Rubber', tpr: 'TPR', eva: 'EVA', pu: 'PU', pvc: 'PVC', fabric: 'Fabric' } },
    { group: 'strap', label: 'Strap', hint: '', of: (F) => (F.strap ? F.strap.value : null), labels: { rubber: 'Rubber', eva: 'EVA / foam', pu: 'PU / synthetic leather', fabric: 'Fabric / webbing', leather: 'Leather', pvc: 'PVC / plastic' } },
    { group: 'fx', label: 'Stated features', hint: 'Spec row or maker page', multi: true,
      of: (F) => [F.grip && F.grip.value && F.grip.tier !== 'claimed' ? 'grip' : null, F.cushion && F.cushion.value && F.cushion.tier !== 'claimed' ? 'cushion' : null, F.wet && F.wet.value && F.wet.tier !== 'claimed' ? 'wet' : null, F.safe && F.safe.value && F.safe.tier !== 'claimed' ? 'safe' : null].filter(Boolean),
      labels: { grip: 'Anti-slip outsole', cushion: 'Cushioning / arch support', wet: 'Water-friendly use stated', safe: 'Skin-safe / odour-resistant' } },
  ],
  featured: ['seg:thong', 'seg:slider', 'sole:rubber', 'sole:eva', 'fx:grip', 'fx:cushion', 'fx:wet', 'ev:official', 'maker:global', 'maker:india'],
  lines: {
    q: (F) => [F.sole && F.sole.tier !== 'rejected' ? `${F.sole.display.split(' (')[0]} sole` : null, F.grip && F.grip.value ? 'anti-slip' : null, F.cushion && F.cushion.value ? 'cushioned' : null].filter(Boolean).join(' · '),
    f: (F) => [F.strap ? `${F.strap.display.split(' /')[0]} strap` : null, F.style ? F.style.display.split(' (')[0].toLowerCase() : null, F.weight && F.weight.tier !== 'rejected' ? F.weight.display : null].filter(Boolean).join(' · '),
  },
};
