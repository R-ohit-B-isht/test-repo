// Trekking shoes — site schema: raw sources, inclusion rule, verified fields, segments and facets.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { grams, yesNo, oneOf, allOf, warrantyMonths } = require('../lib/parse.cjs');

const UPPER = [['leather', /\b(?:full[-\s]grain|nubuck|suede|genuine)?\s*leather\b/i], ['mesh', /mesh|knit|textile|fabric/i], ['synthetic', /synthetic|pu\b|polyurethane|tpu|nylon/i]];
const SOLE = [['vibram', /vibram/i], ['rubber', /rubber/i], ['eva', /\beva\b|phylon/i], ['pu', /\bpu\b|polyurethane/i], ['tpr', /\btpr\b|thermoplastic/i]];
const CLOSURE = [['lace', /lace/i], ['velcro', /velcro|hook/i], ['slip', /slip/i], ['zip', /zip/i]];
const ANKLE = [['high', /high[-\s]?(?:ankle|top|cut)|\bboot/i], ['mid', /mid[-\s]?(?:ankle|top|cut)/i], ['low', /low[-\s]?(?:ankle|top|cut)/i]];
const WATER = [['membrane', /gore[-\s]?tex|outdry|\bgtx\b|waterproof\s*membrane|drytex|omni[-\s]?tech|hydro[-\s]?guard|aqua[-\s]?shield|novadry|waterproof/i], ['resistant', /water[-\s]?(?:resistant|repellent)|\bdwr\b|splash/i]];
// Who a shoe is cut for is part of its identity: a men's and a women's Trailstorm are different products with
// different pages. Encoded as a number so the matcher's numeric guard can compare it (1 men · 2 women · 3 kids).
const WEARER = [[3, /\b(?:kids?|boys?|girls?|junior|little|youth|toddler)\b/i], [2, /\b(?:women'?s?|ladies|female)\b/i], [1, /\b(?:men'?s?|male|gents?)\b/i]];
const wearer = (text) => {
  const t = String(text || '');
  if (/\bunisex\b/i.test(t)) return null;
  const hits = WEARER.filter(([, re]) => re.test(t)).map(([v]) => v);
  return hits.length === 1 ? hits[0] : null;
};
const TECH = [['toe-cap', /toe\s*(?:cap|bumper|guard|protection)|rubber\s*toe/i], ['cushioning', /cushion|techlite|memory\s*foam|ortholite|comfort\s*insole/i], ['grip', /anti[-\s]?(?:skid|slip)|multi[-\s]?directional|lugs?|traction|grip/i], ['ankle-support', /ankle\s*(?:support|collar|padding)/i]];

export default {
  id: 'trekking-shoes',
  label: 'Trekking shoes',
  kicker: 'TREK',
  family: 'outdoor',
  unit: 'trekking shoe',
  blurb: 'Hiking and trekking shoes sold on Flipkart and Amazon.in — scored on the upper, outsole, waterproofing technology, closure, ankle height and protection features a maker page or the marketplace spec table actually states; "premium" and "best quality" count for nothing.',
  sources: { flipkart: ['shoe_pages.json', 'shoe_beat_pages.json'], amazon: 'amz_shoe_pages.json' },
  include: (title) => /trek|hik|outdoor|mountain|trail|boot/i.test(title) && /shoe|boot|footwear|sneaker/i.test(title) && !/socks?|insole|lace(?:s)? only|shoe\s*(?:bag|rack|cover|polish|cleaner|dryer|deodor)|slipper|sandal|flip\s*flop|floater|crocs|sock\b|gaiter|crampon|spikes? only/i.test(title),
  segment: {
    key: 'seg', label: 'Ankle height',
    options: [
      { id: 'high', label: 'High-ankle boot' },
      { id: 'mid', label: 'Mid-ankle' },
      { id: 'low', label: 'Low-cut shoe' },
      { id: 'unstated', label: 'Height not stated' },
    ],
    of: (F) => (F.ankle ? F.ankle.value : 'unstated'),
  },
  fields: [
    { key: 'upper', label: 'Upper material', group: 'Materials', dim: 'specs', weight: 2, title: true,
      listing: ['Outer material', 'Outer Material', 'Upper Material', 'Upper', 'Material'], official: ['upper', 'upper material', 'outer material', 'material'],
      parse: (s) => oneOf(s, UPPER), display: (v) => ({ leather: 'Leather / nubuck / suede', mesh: 'Mesh / textile', synthetic: 'Synthetic' })[v], points: (v) => (v === 'leather' ? 1 : v === 'mesh' ? 0.8 : 0.7) },
    { key: 'sole', label: 'Outsole material', group: 'Materials', dim: 'specs', weight: 2.5, title: true,
      listing: ['Sole material', 'Sole Material', 'Outsole', 'Outsole Material', 'Sole'], official: ['outsole', 'sole', 'sole material', 'outsole material', 'vibram'],
      parse: (s) => oneOf(s, SOLE), display: (v) => ({ vibram: 'Vibram rubber', rubber: 'Rubber', eva: 'EVA', pu: 'PU', tpr: 'TPR' })[v], points: (v) => (v === 'vibram' ? 1 : v === 'rubber' ? 0.9 : v === 'pu' ? 0.6 : v === 'tpr' ? 0.5 : 0.4) },
    { key: 'water', label: 'Waterproofing', group: 'Protection', dim: 'specs', weight: 3, title: true,
      listing: ['Technology used', 'Technology Used', 'Water Resistant', 'Waterproof', 'Water Resistance', 'Other Details', 'Features'], official: ['waterproof', 'water resistant', 'membrane', 'gore-tex', 'outdry', 'technology'],
      parse: (s) => oneOf(s, WATER) || (yesNo(s) === true ? 'resistant' : null), display: (v) => (v === 'membrane' ? 'Waterproof membrane / technology named' : 'Water-resistant (no membrane named)'), points: (v) => (v === 'membrane' ? 1 : 0.6) },
    { key: 'closure', label: 'Closure', group: 'Fit', dim: 'specs', weight: 1, title: true,
      listing: ['Closure', 'Closure Type', 'Fastening'], official: ['closure', 'lacing', 'fastening'],
      parse: (s) => oneOf(s, CLOSURE), display: (v) => ({ lace: 'Lace-up', velcro: 'Velcro strap', slip: 'Slip-on', zip: 'Zip' })[v], points: (v) => (v === 'lace' ? 1 : v === 'velcro' ? 0.7 : 0.5) },
    { key: 'ankle', label: 'Ankle height', group: 'Fit', dim: 'specs', weight: 1.5, title: true,
      listing: ['Ankle Height', 'Shoe Height', 'Type', 'Type For Sports', 'Product details', 'Style'], official: ['ankle', 'height', 'cut', 'mid', 'boot'],
      parse: (s) => oneOf(s, ANKLE), display: (v) => ({ high: 'High-ankle boot', mid: 'Mid-ankle', low: 'Low-cut' })[v], points: (v) => (v === 'high' ? 1 : v === 'mid' ? 0.9 : 0.7) },
    { key: 'tech', label: 'Protection & comfort features', group: 'Protection', dim: 'specs', weight: 2, title: true,
      listing: ['Technology used', 'Technology Used', 'Inner material', 'Inner Material', 'Insole', 'Other Details', 'Features', 'Sole Features', 'Upper Features'], official: ['technology', 'features', 'toe cap', 'cushioning', 'insole', 'midsole', 'traction', 'lugs', 'grip'],
      parse: (s) => allOf(s, TECH), display: (v) => v.map((t) => ({ 'toe-cap': 'Toe cap', cushioning: 'Cushioning named', grip: 'Traction / anti-skid named', 'ankle-support': 'Ankle support' })[t]).join(', '),
      points: (v) => Math.min(1, 0.4 + 0.2 * v.length) },
    { key: 'weight', label: 'Weight (per shoe / pair as stated)', group: 'Fit', dim: 'specs', weight: 1,
      listing: ['Weight', 'Item Weight', 'Net Weight', 'Shoe Weight'], official: ['weight', 'net weight'],
      parse: grams, display: (v) => `${v} g`, plausible: (v) => (v >= 150 && v <= 2500) || `${v} g is not a plausible shoe weight`, points: (v) => (v <= 450 ? 1 : v <= 700 ? 0.8 : 0.6) },
    { key: 'lining', label: 'Inner lining', group: 'Materials', dim: 'specs', weight: 0.5,
      listing: ['Inner material', 'Inner Material', 'Lining', 'Lining Material'], official: ['lining', 'inner material', 'inner lining'],
      parse: (s) => (String(s).trim().length >= 3 && !/^(?:na|n\/a|-|none)$/i.test(s) ? String(s).trim().slice(0, 40) : null), display: (v) => v, points: () => 0.8 },
    { key: 'articleno', label: 'Maker article number', group: 'Identity', dim: 'specs', weight: 0,
      listing: ['Article Number', 'Style Code', 'Model Number', 'Model Name', 'Article No'], official: ['article', 'style code', 'model', 'sku'],
      parse: (s) => (/^[A-Za-z0-9\-_/ .]{3,30}$/.test(String(s).trim()) ? String(s).trim() : null), display: (v) => v },
    { key: 'certification', label: 'Safety / standards (EN ISO 20347, ISI)', group: 'Protection', dim: 'safety', weight: 3, title: true,
      listing: ['Certification', 'Certifications', 'Standards', 'Safety Standard', 'ISI Mark'], official: ['certification', 'en iso', 'iso 20347', 'iso 20345', 'isi', 'standard', 'astm'],
      parse: (s) => (/en\s*iso|iso\s*203\d\d|\bisi\b|\bastm\b|\bbis\b|is\s*\d{4,5}|\bce\b/i.test(s) ? true : yesNo(s)), display: (v) => (v ? 'Stated' : 'Not stated'), points: (v) => (v ? 1 : 0) },
    { key: 'antiskid', label: 'Anti-skid outsole', group: 'Protection', dim: 'safety', weight: 3, title: true,
      listing: ['Anti Skid', 'Anti-Skid', 'Slip Resistant', 'Sole Features', 'Technology used', 'Technology Used', 'Other Details'], official: ['anti-skid', 'anti skid', 'slip resistant', 'non-slip', 'traction', 'grip'],
      parse: (s) => (yesNo(s) !== null ? yesNo(s) : /anti[-\s]?(?:skid|slip)|slip[-\s]?resist|non[-\s]?slip|traction|grip/i.test(s) ? true : null), display: (v) => (v ? 'Stated' : 'Not stated'), points: (v) => (v ? 1 : 0) },
    { key: 'toecap', label: 'Toe protection', group: 'Protection', dim: 'safety', weight: 2, title: true,
      listing: ['Toe Cap', 'Toe Protection', 'Technology used', 'Technology Used', 'Other Details', 'Upper Features'], official: ['toe cap', 'toe bumper', 'toe guard', 'toe protection'],
      parse: (s) => (yesNo(s) !== null ? yesNo(s) : /toe\s*(?:cap|bumper|guard|protect)|rubber\s*toe|reinforced\s*toe/i.test(s) ? true : null), display: (v) => (v ? 'Stated' : 'Not stated'), points: (v) => (v ? 1 : 0) },
    { key: 'warranty', label: 'Warranty', group: 'Support', dim: 'maker', weight: 0, title: true,
      listing: ['Warranty Summary', 'Warranty', 'Domestic Warranty', 'Warranty Period'], official: ['warranty', 'warranty period'],
      parse: warrantyMonths, display: (v) => (v % 12 === 0 ? `${v / 12} year${v > 12 ? 's' : ''}` : `${v} months`), plausible: (v) => (v <= 36 && v >= 1) || `${v} months warranty is not plausible` },
  ],
  // Official-page matcher: category words that never identify a style (shoes carry no quantity both sides state).
  match: {
    // "mid" / "low" stay identifying: Columbia sells Trailstorm, Trailstorm Mid and Trailstorm Low as separate models.
    descriptive: ['trekking', 'trek', 'hiking', 'hike', 'outdoor', 'shoes', 'shoe', 'boots', 'boot', 'sneakers', 'sneaker', 'footwear', 'running', 'walking', 'sports', 'casual', 'ankle', 'high', 'top', 'cut',
      'leather', 'suede', 'nubuck', 'mesh', 'synthetic', 'waterproof', 'water', 'resistant', 'proof', 'lace', 'up', 'velcro', 'slip', 'on', 'rubber', 'eva', 'sole', 'outsole', 'anti', 'skid', 'grip', 'lightweight', 'comfortable',
      'breathable', 'cushioned', 'uk', 'eu', 'us', 'size', 'pair', 'with', 'for', 'and', 'the',
      // Range / collection names cover dozens of distinct styles and never pin down one shoe.
      'ozark', 'athleisure', 'trail', 'rugged', 'outdoors', 'adventure', 'culture', 'cultured'],
    bundleNouns: ['socks', 'backpack', 'bag', 'jacket', 'cap', 'bottle', 'insole', 'insoles', 'laces', 'polish', 'cleaner', 'trimmer', 'dryer'],
    numeric: [
      { label: 'wearer', show: (v) => ({ 1: "men's", 2: "women's", 3: "kids'" })[v] || String(v), tol: 0,
        listing: (l) => wearer(`${l.title} ${(l.listingSpec || {})['Ideal For'] || ''}`), catalog: (c) => wearer(`${c.title} ${c.kv.Gender || c.kv['Ideal For'] || ''}`) },
    ],
  },
  officialProse: {
    'waterproof (page text)': (t) => { const m = /(gore[-\s]?tex|outdry|drytex|omni[-\s]?tech|novadry|hydro[-\s]?guard|waterproof\s*membrane)/i.exec(t); return m ? m[1] : /\bwaterproof\b/i.test(t) ? 'Waterproof' : /water[-\s]?(?:resistant|repellent)/i.test(t) ? 'Water resistant' : null; },
    'outsole (page text)': (t) => { const m = /(vibram[^.\n]{0,30}|[^.\n]{0,20}rubber\s*outsole|[^.\n]{0,20}outsole[^.\n]{0,30})/i.exec(t); return m ? m[1].trim() : null; },
    'upper (page text)': (t) => { const m = /(?:upper|made\s*(?:of|from|with))\s*:?\s*([^.\n]{3,60})/i.exec(t); return m ? m[1].trim() : null; },
    'weight (page text)': (t) => { const m = /(\d{3,4})\s*(?:g|gm|grams?)\b(?:\s*(?:per|\/)\s*(?:shoe|pair|half\s*pair))?/i.exec(t); return m ? m[0] : null; },
    'toe cap (page text)': (t) => (/toe\s*(?:cap|bumper|guard|protection)|rubber\s*toe/i.test(t) ? 'Yes' : null),
    'anti-skid (page text)': (t) => (/anti[-\s]?(?:skid|slip)|slip[-\s]?resist|non[-\s]?slip|multi[-\s]?directional\s*lugs?/i.test(t) ? 'Yes' : null),
    'warranty (page text)': (t) => { const m = /(\d+)\s*[-\s]?(months?|years?)\s*(?:of\s*)?(?:brand\s*|manufacturer'?s?\s*)?warranty/i.exec(t) || /warranty\s*(?:of|:)?\s*(\d+)\s*[-\s]?(months?|years?)/i.exec(t); return m ? `${m[1]} ${m[2]}` : null; },
  },
  facets: [
    { group: 'water', label: 'Waterproofing', hint: 'Named membrane vs. a bare "water resistant"', of: (F) => (F.water ? F.water.value : null), labels: { membrane: 'Waterproof membrane named', resistant: 'Water-resistant only' } },
    { group: 'sole', label: 'Outsole', hint: '', of: (F) => (F.sole ? F.sole.value : null), labels: { vibram: 'Vibram', rubber: 'Rubber', eva: 'EVA', pu: 'PU', tpr: 'TPR' } },
    { group: 'upper', label: 'Upper', hint: '', of: (F) => (F.upper ? F.upper.value : null), labels: { leather: 'Leather / nubuck / suede', mesh: 'Mesh / textile', synthetic: 'Synthetic' } },
    { group: 'close', label: 'Closure', hint: '', of: (F) => (F.closure ? F.closure.value : null), labels: { lace: 'Lace-up', velcro: 'Velcro', slip: 'Slip-on', zip: 'Zip' } },
    { group: 'prot', label: 'Protection', hint: 'Stated features', multi: true, of: (F) => [F.toecap && F.toecap.value ? 'toe' : null, F.antiskid && F.antiskid.value ? 'antiskid' : null, F.tech && F.tech.value.includes('cushioning') ? 'cushion' : null, F.tech && F.tech.value.includes('ankle-support') ? 'ankle' : null, F.certification && F.certification.value ? 'certified' : null].filter(Boolean),
      labels: { toe: 'Toe cap', antiskid: 'Anti-skid outsole', cushion: 'Cushioning named', ankle: 'Ankle support', certified: 'Standard / certification stated' } },
  ],
  featured: ['seg:high', 'seg:mid', 'water:membrane', 'sole:vibram', 'sole:rubber', 'upper:leather', 'prot:toe', 'prot:antiskid', 'ev:official', 'maker:global', 'maker:india'],
  lines: {
    q: (F) => [F.water ? (F.water.value === 'membrane' ? 'waterproof membrane' : 'water-resistant') : null, F.sole ? `${F.sole.display} sole` : null, F.upper ? `${F.upper.display.split(' /')[0]} upper` : null].filter(Boolean).join(' · '),
    f: (F) => [F.ankle ? F.ankle.display : null, F.closure ? F.closure.display : null, F.weight ? F.weight.display : null].filter(Boolean).join(' · '),
  },
};
