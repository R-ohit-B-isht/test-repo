// Maker model codes ("VHDH-36", "NHP 8222", "HD-1120", "HP8120/00", "PB400") — the one token a seller cannot
// paraphrase. A code is a short vowel-less letter prefix followed by digits; word+number pairs ("Pro 2500",
// "Style 1600", "Bank 20000", "Aero 10") are marketing names, not codes, and are handled by the name matcher instead.
const CODE = /\b([A-Za-z]{2,5})[ -]?(\d{2,5})(?:\/(\d{2}))?(?![\d.])(?:[+]|\b)/g;
// Digit-led codes (Zebronics "20MR1", "10R2"): digits, a vowel-less letter block, digits — never "3in1" / "2x1".
const DIGIT_CODE = /\b(\d{1,3})([A-Za-z]{1,3})(\d{1,3})\b/g;
// Vowel-less abbreviations that are units / protocols / generic, never a maker's model prefix.
const NOT_CODES = new Set(['qc', 'pd', 'pps', 'ipx', 'ip', 'mm', 'cm', 'kg', 'gm', 'ml', 'ltr', 'lts', 'pcs', 'rpm', 'hrs', 'hr', 'mth', 'yr', 'yrs', 'ft', 'dc', 'tv', 'hd', 'rs', 'gb', 'tb', 'mb', 'mp', 'khz', 'ghz', 'mhz', 'hz', 'db', 'kw', 'mw', 'ppm', 'lbs', 'sq', 'ct', 'pk', 'mt', 'mtr', 'mtrs', 'cms', 'gms', 'kgs', 'ltrs', 'wh', 'kwh', 'bhp', 'hp', 'ss', 'pc', 'pcs', 'nm', 'ph', 'std', 'pvc', 'fps', 'mph', 'kmph', 'kmh', 'spf', 'hdmi', 'vs', 'pt', 'pts']);

export const normCode = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');

// Codes in a piece of text, normalised ("vhdh36", "hp812000"). Philips-style codes are returned both with and
// without their "/xx" suffix so a suffix-less seller title still names the base model.
export function modelCodes(text) {
  const out = new Set();
  for (const m of String(text || '').matchAll(CODE)) {
    const prefix = m[1].toLowerCase();
    if (/[aeiou]/.test(prefix)) continue;
    // "HD" / "HP" are also generic abbreviations (video, horsepower); keep them only as a maker-style 4-digit code.
    if (NOT_CODES.has(prefix) && !((prefix === 'hd' || prefix === 'hp') && /^\d{4}$/.test(m[2]))) continue;
    out.add(normCode(m[1] + m[2]));
    if (m[3]) out.add(normCode(m[1] + m[2] + m[3]));
  }
  for (const m of String(text || '').matchAll(DIGIT_CODE)) {
    if (/[aeiou]/i.test(m[2]) || /^x$/i.test(m[2]) || m[0].length < 4) continue;
    out.add(normCode(m[0]));
  }
  return [...out];
}

// Per-maker index: normalised code → catalogue products that print it (title, handle, model-number kv values).
export function codeIndex(catalog) {
  const idx = new Map();
  for (const c of catalog) {
    const src = `${c.title} ${c.handle || ''} ${Object.entries(c.kv || {}).filter(([k]) => /model|ctn|sku|item code/i.test(k)).map(([, v]) => v).join(' ')}`;
    for (const code of modelCodes(src)) {
      const k = `${c.maker}\u0000${code}`;
      if (!idx.has(k)) idx.set(k, []);
      idx.get(k).push(c);
    }
  }
  return {
    /** catalogue products of this maker printing `code` */
    holders: (maker, code) => idx.get(`${maker}\u0000${code}`) || [],
  };
}

const BUNDLE = /\bcombo\b|\bbundle\b|\bpack of\s*\d|\bset of\s*\d/i;
// Other products a seller bundles in ("… & Foot Massager", "with Round Brush"); a site schema supplies its own list
// via match.bundleNouns (these are the cross-category defaults).
export const BUNDLE_NOUNS = ['massager', 'straightener', 'curler', 'trimmer', 'shaver', 'epilator', 'kettle', 'blender', 'grinder', 'cooktop', 'lighter', 'backpack'];
// A listing that sells more than the maker's product (an explicit combo, or a product noun the maker's own title
// never mentions) is not that product. A maker set ("Dryer & Straightener") keeps its own nouns.
export function isBundle(listingTitle, makerTitle, nouns = BUNDLE_NOUNS) {
  const mt = makerTitle.toLowerCase();
  if (BUNDLE.test(listingTitle) && !BUNDLE.test(makerTitle) && !/&|\+|\band\b/i.test(makerTitle)) return 'listing is a combo / bundle';
  const foreign = nouns.filter((n) => new RegExp(`\\b${n}\\b`, 'i').test(listingTitle) && !mt.includes(n.replace(/s$/, '')));
  if (foreign.length) return `listing also names a ${foreign[0]} the maker page does not`;
  return null;
}
