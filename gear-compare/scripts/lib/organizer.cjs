// Shared parsers and field builders for the travel-organiser sites (packing cubes, shoe bags, toiletry kits,
// tech pouches, laundry bags, travel wallets). Everything here reads a captured string and returns a typed
// value or null — never a guess. Dimensions feed the pack planner as well as the score, so they are kept
// as a sorted [long, mid, short] cm triple with the litres they enclose.
const { num, grams, yesNo, oneOf, allOf, warrantyMonths } = require('./parse.cjs');

const r1 = (v) => Math.round(v * 10) / 10;

// "37L x 27W x 11H Centimeters", "35 x 25 x 10 cm", "14.5 x 10.6 x 4.3 inches", "35*25*10", "30 cm x 20 cm x 8 cm"
// → [long, mid, short] in cm. A unit stated once applies to all three; unitless triples where every number is
// ≥ 100 are read as millimetres (Flipkart's per-axis fields are often typed that way), otherwise centimetres.
function dimsCm(s) {
  const t = String(s || '').replace(/,/g, '.');
  const re = /(\d+(?:\.\d+)?)\s*(cm|mm|in(?:ch(?:es)?)?|"|centimet(?:er|re)s?|millimet(?:er|re)s?)?\s*[lwhdLWHD]?\s*(?:x|×|\*|by)\s*(\d+(?:\.\d+)?)\s*(cm|mm|in(?:ch(?:es)?)?|"|centimet(?:er|re)s?|millimet(?:er|re)s?)?\s*[lwhdLWHD]?\s*(?:x|×|\*|by)\s*(\d+(?:\.\d+)?)\s*(cm|mm|in(?:ch(?:es)?)?|"|centimet(?:er|re)s?|millimet(?:er|re)s?)?\s*[lwhdLWHD]?/i;
  const m = re.exec(t);
  if (!m) return null;
  const nums = [Number(m[1]), Number(m[3]), Number(m[5])];
  if (nums.some((n) => !Number.isFinite(n) || n <= 0)) return null;
  const unitWord = (m[2] || m[4] || m[6] || '').toLowerCase();
  let unit = unitWord.startsWith('mm') || unitWord.startsWith('milli') ? 'mm' : unitWord.startsWith('in') || unitWord === '"' ? 'in' : unitWord ? 'cm' : null;
  if (!unit) {
    const tail = t.slice(m.index + m[0].length, m.index + m[0].length + 20).toLowerCase();
    unit = /^\s*(?:mm|millimet)/.test(tail) ? 'mm' : /^\s*(?:in\b|inch|")/.test(tail) ? 'in' : /^\s*(?:cm|centimet)/.test(tail) ? 'cm' : nums.every((n) => n >= 100) ? 'mm' : 'cm';
  }
  const k = unit === 'mm' ? 0.1 : unit === 'in' ? 2.54 : 1;
  return nums.map((n) => r1(n * k)).sort((a, b) => b - a);
}

// Flipkart splits the size into Width / Height / Depth rows (each with its own unit) — join them into one
// dimensions string so the same parser handles every source.
function joinAxes(kv) {
  const w = kv.Width || null; const h = kv.Height || null; const d = kv.Depth || kv.Length || null;
  if (!w || !h || !d) return null;
  return `${w} x ${h} x ${d}`;
}

const litresOf = (d) => (d ? r1((d[0] * d[1] * d[2]) / 1000) : null);
const dimsDisplay = (d) => `${d[0]} × ${d[1]} × ${d[2]} cm (≈ ${litresOf(d)} L)`;

// "Set of 6", "6 Count", "Pack of 3", "7 pcs", "6-piece", "8 in 1", "Number of Contents … 6" → 1–24
function pieces(s) {
  const t = String(s || '');
  const m = /(?:set|pack|combo)\s*of\s*(\d{1,2})\b/i.exec(t) || /\b(\d{1,2})\s*(?:-|\s)?(?:pcs?|pieces?|piece|count|pc set|piece set|in\s*1|packs?\b(?!\s*of))/i.exec(t) || /\b(\d{1,2})\s*x?\s*(?:packing\s*|travel\s*|shoe\s*|mesh\s*)?(?:cubes?|bags?|pouch(?:es)?|organi[sz]ers?)\b/i.exec(t);
  if (m) { const n = Number(m[1]); return n >= 1 && n <= 24 ? n : null; }
  if (/^\s*\d{1,2}\s*$/.test(t)) { const n = Number(t); return n >= 1 && n <= 24 ? n : null; }
  return null;
}

const MATERIAL = [
  ['nylon', /nylon|ripstop|cordura|oxford\s*nylon/i],
  ['polyester', /polyester|poly\b|oxford(?!\s*nylon)|600d|300d|210d|900d|1200d/i],
  ['pu', /\bpu\b|polyurethane|vegan\s*leather|faux\s*leather|leatherette|synthetic\s*leather|pu\s*leather/i],
  ['leather', /genuine\s*leather|(?<!faux\s)(?<!pu\s)(?<!vegan\s)(?<!synthetic\s)\bleather\b/i],
  ['eva', /\beva\b|hard\s*shell|hardshell|moulded|molded/i],
  ['pvc', /\bpvc\b|\btpu\b|vinyl|transparent\s*plastic|clear\s*plastic/i],
  ['silicone', /silicone/i],
  ['mesh', /^mesh\b|mesh\s*fabric/i],
  ['canvas', /canvas|cotton/i],
  ['non-woven', /non[-\s]?woven|spunbond/i],
];
const MATERIAL_LABEL = { nylon: 'Nylon / ripstop', polyester: 'Polyester / Oxford', pu: 'PU / vegan leather', leather: 'Leather', eva: 'EVA hard shell', pvc: 'PVC / TPU', silicone: 'Silicone', mesh: 'Mesh', canvas: 'Canvas / cotton', 'non-woven': 'Non-woven' };
const materialOf = (s) => oneOf(s, MATERIAL);
const materialDisplay = (v) => MATERIAL_LABEL[v] || v;

const denier = (s) => { const m = /(\d{3,4})\s*d\b/i.exec(String(s)); return m ? Number(m[1]) : null; };

// Water resistance: an explicit "No" beats keyword matches; "waterproof" / "water resistant" / "water repellent" / "PU coating" → true
function waterStated(s) {
  const t = String(s || '');
  if (/water\s*-?\s*(?:proof|resist\w*|repell\w*)\s*[:-]?\s*no\b|not\s*water\s*-?\s*(?:proof|resist)/i.test(t)) return false;
  const yn = yesNo(t);
  if (yn !== null) return yn;
  return /water[-\s]?(?:proof|resist|repell)|\bdwr\b|pu\s*coat|tpu\s*coat|splash\s*proof/i.test(t) ? true : null;
}

const count = (s, max = 30) => { const n = num(s); return n !== null && Number.isInteger(n) && n >= 1 && n <= max ? n : null; };

// Field builders shared across the six sites. Listing labels cover Flipkart's spec tab and Amazon's details table.
const DIMS_LISTING = ['Dimensions', 'Item Dimensions L x W x H', 'Item Dimensions LxWxH', 'Product Dimensions', 'Item Dimensions', 'Size', 'Dimension', 'Bag Dimensions'];
const DIMS_OFFICIAL = ['dimensions', 'dimension', 'size', 'measurements', 'l x w x h', 'lxwxh', 'length x width x height'];

function dimsField({ weight = 3, minL = 0.05, maxL = 60, side = [2, 80], note = 'organiser' } = {}) {
  return {
    key: 'dims', label: 'Stated dimensions', group: 'Size', dim: 'specs', weight, title: true,
    listing: DIMS_LISTING, official: DIMS_OFFICIAL,
    parse: dimsCm, display: dimsDisplay,
    plausible: (d) => {
      const L = litresOf(d);
      if (d[0] > side[1] || d[2] < side[0]) return `${d.join(' × ')} cm is not a plausible ${note} size`;
      return (L >= minL && L <= maxL) || `${L} L is not a plausible ${note} volume (${minL}–${maxL} L)`;
    },
    points: () => 1,
  };
}

function weightField({ min = 15, max = 2500, light = 250, mid = 500 } = {}) {
  return {
    key: 'weight', label: 'Weight', group: 'Size', dim: 'specs', weight: 1,
    listing: ['Weight', 'Item Weight', 'Net Weight', 'Product Weight'], official: ['weight', 'net weight'],
    parse: grams, display: (v) => (v >= 1000 ? `${(v / 1000).toFixed(2)} kg` : `${v} g`),
    plausible: (v) => (v >= min && v <= max) || `${v} g is not a plausible weight (${min}–${max} g)`,
    points: (v) => (v <= light ? 1 : v <= mid ? 0.85 : 0.65),
  };
}

function materialField({ weight = 2, best = ['nylon'], good = ['polyester', 'eva', 'pu'] } = {}) {
  return {
    key: 'material', label: 'Material', group: 'Materials', dim: 'specs', weight, title: true,
    listing: ['Material', 'Material Type', 'Fabric', 'Outer Material', 'Body Material', 'Material Composition', 'Inner Material'], official: ['material', 'fabric', 'made of', 'shell'],
    parse: materialOf, display: materialDisplay,
    points: (v) => (best.includes(v) ? 1 : good.includes(v) ? 0.8 : v === 'non-woven' ? 0.3 : 0.6),
  };
}

function denierField() {
  return {
    key: 'denier', label: 'Fabric denier', group: 'Materials', dim: 'specs', weight: 1, title: true,
    listing: ['Material', 'Material Type', 'Fabric', 'Denier', 'Fabric Denier'], official: ['denier', 'fabric', 'material', '210d', '300d', '420d', '600d', '900d'],
    parse: denier, display: (v) => `${v}D`,
    plausible: (v) => (v >= 150 && v <= 1680) || `${v}D is not a plausible organiser fabric`,
    points: (v) => (v >= 600 ? 1 : v >= 420 ? 0.9 : v >= 300 ? 0.8 : 0.7),
  };
}

function waterField({ dim = 'safety', weight = 3 } = {}) {
  return {
    key: 'water', label: 'Water resistance', group: 'Protection', dim, weight, title: true,
    listing: ['Water Resistant', 'Waterproof', 'Water Resistance', 'Water Resistance Level', 'Material, Waterproof', 'Weather Resistant'], official: ['water resistant', 'waterproof', 'water repellent', 'dwr', 'pu coating', 'splash'],
    parse: waterStated, display: (v) => (v ? 'Stated' : 'Not water-resistant'), points: (v) => (v ? 1 : 0.2),
  };
}

function piecesField({ max = 24, weight = 1, points } = {}) {
  return {
    key: 'pieces', label: 'Pieces in the set', group: 'Set', dim: 'specs', weight, title: true,
    listing: ['Number of Contents in Sales Package', 'Pack of', 'Unit Count', 'Number of Items', 'Number of Pieces', 'Sales Package', 'Included Components', 'Set Contents', 'Size'], official: ['set of', 'pieces', 'pcs', 'contents', 'includes', 'pack of', 'number of'],
    parse: (s) => { const n = pieces(s); return n !== null && n <= max ? n : null; }, display: (v) => (v === 1 ? 'Single' : `Set of ${v}`),
    points: points || ((v) => (v >= 6 ? 1 : v >= 3 ? 0.85 : 0.6)),
  };
}

function compartmentsField({ weight = 1, best = 3 } = {}) {
  return {
    key: 'compartments', label: 'Compartments', group: 'Organisation', dim: 'specs', weight,
    listing: ['Number of Compartments', 'Compartments', 'Number of Pockets', 'Pockets'], official: ['compartments', 'pockets', 'number of compartments'],
    parse: (s) => count(s, 40), display: (v) => `${v}`, points: (v) => (v >= best ? 1 : v === 2 ? 0.8 : 0.6),
  };
}

function zipsField() {
  return {
    key: 'zips', label: 'Zip hardware named (YKK / SBS)', group: 'Materials', dim: 'specs', weight: 0.5, title: true,
    listing: ['Zipper', 'Zip', 'Closure', 'Closure Type', 'Hardware'], official: ['zipper', 'zip', 'ykk', 'sbs', 'hardware'],
    parse: (s) => (/\bykk\b/i.test(s) ? 'YKK' : /\bsbs\b/i.test(s) ? 'SBS' : null), display: (v) => v, points: (v) => (v === 'YKK' ? 1 : 0.8),
  };
}

function warrantyField() {
  return {
    key: 'warranty', label: 'Warranty', group: 'Support', dim: 'maker', weight: 0, title: true,
    listing: ['Warranty Summary', 'Warranty', 'Domestic Warranty', 'Warranty Period', 'Manufacturer Warranty Description', 'Warranty Description'], official: ['warranty', 'warranty period', 'lifetime warranty', 'guarantee'],
    parse: (s) => (/lifetime|life\s*time|forever/i.test(s) ? 240 : warrantyMonths(s)),
    display: (v) => (v >= 240 ? 'Lifetime' : v % 12 === 0 ? `${v / 12} year${v > 12 ? 's' : ''}` : `${v} months`),
    plausible: (v) => (v <= 240 && v >= 1) || `${v} months warranty is not plausible`,
  };
}

// Boolean feature stated in a spec row, the maker's own page text (official) or the title (claimed, shown but unscored).
function featureField(key, label, group, re, { dim = 'specs', weight = 1, listing = [], official = [], yes = 'Stated', no = 'Not stated', noPts = 0.2 } = {}) {
  return {
    key, label, group, dim, weight, title: true, listing, official,
    parse: (s) => (yesNo(s) !== null ? yesNo(s) : re.test(String(s)) ? true : null),
    prose: (s) => (re.test(String(s)) ? true : null),
    display: (v) => (v ? yes : no), points: (v) => (v ? 1 : noPts),
  };
}

// Official-page prose readers shared by every organiser site (maker pages rarely have a spec table).
const PROSE = {
  'dimensions (page text)': (t) => { const d = dimsCm(t); return d ? `${d[0]} x ${d[1]} x ${d[2]} cm` : null; },
  'material (page text)': (t) => { const m = /(\d{3,4}\s*d\s*(?:ripstop\s*)?(?:nylon|polyester|oxford)[^.\n]{0,20}|\b(?:ripstop|cordura|nylon|polyester|oxford|eva|tpu|pu[-\s]coated)\s*(?:fabric|shell|body|material|cloth)?[^.\n]{0,15})/i.exec(t); return m ? m[1].trim() : null; },
  'weight (page text)': (t) => { const m = /(\d{2,4}\s*(?:g|gm|gms|grams?)|\d(?:\.\d+)?\s*kg)\b/i.exec(t); return m ? m[1] : null; },
  'water resistant (page text)': (t) => (/water[-\s]?(?:proof|resistant|repellent)|\bdwr\b|pu[-\s]coat/i.test(t) ? (/not\s*water/i.test(t) ? null : 'Yes') : null),
  'pieces (page text)': (t) => { const n = pieces(t); return n ? `Set of ${n}` : null; },
  'warranty (page text)': (t) => { if (/lifetime\s*warranty/i.test(t)) return 'Lifetime'; const m = /(\d+)\s*[-\s]?(months?|years?)\s*(?:of\s*)?(?:brand\s*|manufacturer'?s?\s*)?warranty/i.exec(t) || /warranty\s*(?:of|:)?\s*(\d+)\s*[-\s]?(months?|years?)/i.exec(t); return m ? `${m[1]} ${m[2]}` : null; },
};

// Words in organiser titles that never identify a model (official-page matcher).
const DESCRIPTIVE = ['travel', 'organizer', 'organiser', 'organizers', 'organisers', 'bag', 'bags', 'pouch', 'pouches', 'set', 'of', 'pack', 'packing', 'cube', 'cubes', 'luggage', 'suitcase', 'backpack', 'for', 'and', 'with', 'the', 'men', 'women', 'unisex', 'kids',
  'waterproof', 'water', 'resistant', 'lightweight', 'portable', 'foldable', 'multi', 'multipurpose', 'large', 'small', 'medium', 'pcs', 'pieces', 'piece', 'compression', 'clothes', 'shoe', 'shoes', 'slipper', 'slippers', 'footwear', 'toiletry', 'toiletries', 'cosmetic', 'makeup',
  'hanging', 'kit', 'dopp', 'wash', 'tech', 'electronics', 'electronic', 'gadget', 'cable', 'charger', 'accessories', 'accessory', 'laundry', 'dirty', 'underwear', 'passport', 'holder', 'cover', 'wallet', 'document', 'documents', 'rfid', 'family', 'nylon', 'polyester', 'mesh', 'zipper', 'zip',
  'storage', 'case', 'premium', 'durable', 'black', 'grey', 'gray', 'blue', 'navy', 'green', 'pink', 'red', 'beige', 'l', 'xl', 'ml', 'cm', 'in', 'inch'];

// Title gate shared by the organiser sites. `hard` always rejects (a different product class — vacuum storage,
// wardrobe hangers, luggage itself); `strong` is an unmistakable name for this role and wins over the `soft`
// cross-role words (a "7 pcs packing cubes … clothes & toiletries, laundry" set is a packing-cube set); `weak`
// is a generic organiser phrase that only counts when no soft cross-role word is present.
function includer({ hard, strong, weak, soft }) {
  const hit = (x, t) => (typeof x === 'function' ? x(t) : x.test(t));
  return (title) => {
    if (hard && hit(hard, title)) return false;
    if (strong && hit(strong, title)) return true;
    if (!weak || !hit(weak, title)) return false;
    return !(soft && hit(soft, title));
  };
}
// Luggage words reject a title only when nothing says it is an organiser that goes *inside* the luggage.
const LUGGAGE = /trolley\s*bag|suitcase|backpack|rucksack|duffel|duffle|tote\b|handbag|sling\s*bag/i;
const luggageItself = (t) => LUGGAGE.test(t) && !/cube|organi[sz]|pouch|packing|storage\s*bag/i.test(t);

// The pack planner reads one volume per listing. A set states one size (its largest piece), so the set volume `s`
// is that piece plus a graded tail (0.6× for the next, then 0.6× again, floor 0.1×) — a 7-piece set ≈ 2.5× its
// largest cube, not 7×. `v` stays the largest piece alone; tier tells the UI how much to trust the number.
const GRADED_FLOOR = 0.1;
function gradedFactor(n) {
  let f = 0;
  for (let i = 0; i < n; i++) f += Math.max(GRADED_FLOOR, 0.6 ** i);
  return f;
}
function packOf(F) {
  const d = F.dims && F.dims.tier !== 'rejected' ? F.dims.value : null;
  if (!d) return null;
  const n = F.pieces && F.pieces.tier !== 'rejected' ? F.pieces.value : 1;
  const v = litresOf(d);
  return { d, v, n, s: Math.round(v * gradedFactor(n) * 10) / 10, tier: F.dims.tier, nTier: F.pieces ? F.pieces.tier : 'none' };
}

module.exports = { dimsCm, joinAxes, litresOf, dimsDisplay, pieces, materialOf, materialDisplay, MATERIAL_LABEL, denier, waterStated, count,
  dimsField, weightField, materialField, denierField, waterField, piecesField, compartmentsField, zipsField, warrantyField, featureField, PROSE, DESCRIPTIVE, packOf, allOf, includer, luggageItself };
