// Shared pieces for the Lakshadweep trip categories (beach water shoes, swim caps, goggles, headlamps, flip-flops).
const { oneOf, yesNo, grams } = require('./parse.cjs');

// Who a piece is cut for is part of its identity (men's / women's / kids' pages are different products).
// Encoded as a number so the official-page matcher's numeric guard can compare it (1 men · 2 women · 3 kids).
const WEARER = [[3, /\b(?:kids?|boys?|girls?|junior|little|youth|toddler|children|child)\b/i], [2, /\b(?:women'?s?|ladies|female)\b/i], [1, /\b(?:men'?s?|male|gents?)\b/i]];
function wearer(text) {
  const t = String(text || '');
  if (/\bunisex\b/i.test(t)) return null;
  const hits = [...new Set(WEARER.filter(([, re]) => re.test(t)).map(([v]) => v))];
  return hits.length === 1 ? hits[0] : null;
}
const wearerNumeric = { label: 'wearer', show: (v) => ({ 1: "men's", 2: "women's", 3: "kids'" })[v] || String(v), tol: 0,
  listing: (l) => wearer(`${l.title} ${(l.listingSpec || {})['Ideal For'] || ''}`), catalog: (c) => wearer(`${c.title} ${c.kv.Gender || c.kv['Ideal For'] || ''}`) };

// Sole material of beach footwear. EVA alone is soft and slips on wet rock; rubber / TPR grips.
const SOLE = [['rubber', /rubber/i], ['tpr', /\btpr\b|thermo\s*plastic\s*rubber|thermoplastic/i], ['eva', /\beva\b|phylon|ethylene/i], ['pu', /\bpu\b|polyurethane/i], ['pvc', /\bpvc\b|vinyl/i], ['fabric', /lycra|fabric|textile|cloth|neoprene|polyester|spandex|elastane|nylon/i]];
const SOLE_LABEL = { rubber: 'Rubber', tpr: 'TPR (thermoplastic rubber)', eva: 'EVA foam', pu: 'PU', pvc: 'PVC', fabric: 'Fabric / lycra (no sole to speak of)' };

// Boolean stated in a spec row, on the maker's own page text (official) or in the title (claimed, unscored).
function feature(key, label, group, re, { dim = 'specs', weight = 1, listing = [], official = [], yes = 'Stated', no = 'Not stated', noPts = 0.2, negative = null } = {}) {
  return {
    key, label, group, dim, weight, title: true, listing, official,
    parse: (s) => { const t = String(s); if (negative && negative.test(t)) return false; return yesNo(t) !== null ? yesNo(t) : re.test(t) ? true : null; },
    prose: (s) => (re.test(String(s)) ? true : null),
    display: (v) => (v ? yes : no), points: (v) => (v ? 1 : noPts),
  };
}

function weightField({ min = 15, max = 2500, light = 250, mid = 500, label = 'Weight' } = {}) {
  return {
    key: 'weight', label, group: 'Size', dim: 'specs', weight: 1,
    listing: ['Weight', 'Item Weight', 'Net Weight', 'Product Weight', 'Net Quantity'], official: ['weight', 'net weight'],
    parse: grams, display: (v) => (v >= 1000 ? `${(v / 1000).toFixed(2)} kg` : `${v} g`),
    plausible: (v) => (v >= min && v <= max) || `${v} g is not a plausible weight (${min}–${max} g)`,
    points: (v) => (v <= light ? 1 : v <= mid ? 0.85 : 0.65),
  };
}

// Title gate: `strong` must name this product class; `hard` always rejects (a different product class).
const KIDS_ONLY = /\b(?:kids?|children|child|boys?|girls?|junior|toddler|baby|infant|newborn|youth)\b/i;
const ADULT = /\b(?:men'?s?|women'?s?|adults?|ladies|gents?|male|female)\b/i;
// A title cut for children only (no adult / men / women word anywhere; "unisex kids" is still kids) is not the user’s product.
const kidsOnly = (t) => KIDS_ONLY.test(t) && !ADULT.test(t);
// Accessory-only listings (a case, strap, battery, pouch sold alone) are never the product itself.
const ACCESSORY_ONLY = /\b(?:case|box|pouch|strap|cover|clip|plugs?|battery|batteries|charger|holder|mount|band|headband|bag|stand|lens|lenses|gasket)s?\b[^|,]{0,40}\bonly\b|\bonly\b[^|,]{0,20}\b(?:storage|carry(?:ing)?|protective)?\s*(?:pouch|case|box|bag|strap)s?\b|replacement\s*(?:strap|band|headband|battery|batteries|nose\s*(?:piece|bridge)|lens|lenses|gasket|cell)s?\b|spare\s*(?:strap|band|battery|batteries|lens|lenses|gasket)s?\b/i;

function includer({ strong, hard, noKids = false }) {
  const hit = (x, t) => (typeof x === 'function' ? x(t) : x.test(t));
  return (title) => !ACCESSORY_ONLY.test(title) && !hit(hard, title) && !(noKids && kidsOnly(title)) && hit(strong, title);
}

// Words in trip-gear titles that never identify a model (official-page matcher).
const DESCRIPTIVE = ['men', 'women', 'unisex', 'kids', 'adult', 'adults', 'for', 'and', 'with', 'the', 'of', 'pack', 'set', 'combo', 'pair', 'pairs', 'black', 'blue', 'navy', 'grey', 'gray', 'green', 'pink', 'red', 'white', 'yellow', 'orange',
  'uk', 'eu', 'us', 'size', 'free', 'one', 'l', 'xl', 'm', 's', 'cm', 'in', 'inch', 'premium', 'durable', 'lightweight', 'comfortable', 'stylish', 'quick', 'dry', 'water', 'waterproof', 'anti', 'slip', 'non', 'new', 'latest', 'original', 'imported'];

module.exports = { ACCESSORY_ONLY, kidsOnly, wearer, wearerNumeric, SOLE, SOLE_LABEL, feature, weightField, includer, DESCRIPTIVE, oneOf };
