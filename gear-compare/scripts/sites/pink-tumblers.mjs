// Pink tumblers — site schema: raw sources, inclusion rule, verified fields, segments and facets.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { ml, grams, yesNo, oneOf, allOf, warrantyMonths } = require('../lib/parse.cjs');

const BODY = [['steel', /stainless|steel|ss\s*(?:304|316)|\b(?:304|316)\b|metal/i], ['glass', /glass|borosilicate/i], ['tritan', /tritan/i], ['plastic', /plastic|pp\b|polypropylene|abs|acrylic|pc\b|polycarbonate/i]];
const LID = [['straw', /straw/i], ['flip', /flip/i], ['sip', /sip|sipper|spout/i], ['screw', /screw/i], ['slide', /slid/i]];
const capClass = (v) => (v >= 1000 ? 'jumbo' : v >= 600 ? 'large' : v >= 350 ? 'standard' : 'small');
const tumblerMl = (s) => { const v = ml(s); if (v !== null) return v; const oz = /(\d+(?:\.\d+)?)\s*oz\b/i.exec(String(s || '')); return oz ? Math.round(Number(oz[1]) * 29.57) : null; };
const GRADE = (s) => { const m = /\b(?:ss|sus)?\s*-?\s*(304|316|18\/8|18\/10|202)\b/i.exec(String(s)); return m ? m[1] : null; };

export default {
  id: 'pink-tumblers',
  label: 'Pink tumblers',
  kicker: 'SIP',
  family: 'drinkware',
  unit: 'tumbler',
  blurb: 'Pink tumblers, sippers and insulated cups sold on Flipkart and Amazon.in — scored on stated capacity, body material and steel grade, insulation, lid type, leak-proofing and food-safety statements; "premium" and "aesthetic" count for nothing.',
  sources: { flipkart: 'tumbler_pages.json', amazon: 'amz_tumblers.json' },
  include: (title) => /tumbler|sipper|sipping|cup|mug|bottle/i.test(title) && /pink|rose|blush|peach|coral|magenta|fuchsia|barbie/i.test(title) && !/lid only|straw only|replacement|sleeve only|cover only|bag|holder|sticker|set of \d+ (?:glass|glasses)|disposable|paper cup|shot glass|wine glass|beer|kids? sipper bottle for baby|feeding/i.test(title),
  segment: {
    key: 'seg', label: 'Capacity',
    options: [
      { id: 'jumbo', label: 'Jumbo · 1 L +' },
      { id: 'large', label: 'Large · 600–999 ml' },
      { id: 'standard', label: 'Standard · 350–599 ml' },
      { id: 'small', label: 'Small · under 350 ml' },
      { id: 'unstated', label: 'Capacity not stated' },
    ],
    of: (F) => (F.capacity && F.capacity.tier !== 'rejected' ? capClass(F.capacity.value) : 'unstated'),
  },
  fields: [
    { key: 'capacity', label: 'Capacity', group: 'Size', dim: 'specs', weight: 2, title: true,
      listing: ['Capacity', 'Volume', 'Size'], official: ['capacity', 'volume', 'size', 'ml', 'oz'],
      parse: (s) => { const v = ml(s); if (v !== null) return v; const oz = /(\d+(?:\.\d+)?)\s*oz\b/i.exec(String(s)); if (oz) return Math.round(Number(oz[1]) * 29.57); const n = Number(String(s).trim()); return Number.isFinite(n) && n >= 100 && n <= 3000 ? n : null; }, display: (v) => (v >= 1000 ? `${(v / 1000).toFixed(v % 1000 ? 1 : 0)} L` : `${v} ml`),
      plausible: (v) => (v >= 100 && v <= 3000) || `${v} ml is not a plausible tumbler capacity`, points: (v) => (v >= 900 ? 1 : v >= 600 ? 0.9 : v >= 400 ? 0.8 : 0.6) },
    { key: 'body', label: 'Body material', group: 'Materials', dim: 'specs', weight: 2.5, title: true,
      listing: ['Body Material', 'Material', 'Bottle Material', 'Cup Material'], official: ['material', 'body material', 'made of', 'stainless steel', 'tritan'],
      parse: (s) => oneOf(s, BODY), display: (v) => ({ steel: 'Stainless steel', glass: 'Glass', tritan: 'Tritan (BPA-free copolyester)', plastic: 'Plastic (type not stated)' })[v], points: (v) => (v === 'steel' ? 1 : v === 'glass' || v === 'tritan' ? 0.85 : 0.4) },
    { key: 'grade', label: 'Steel grade', group: 'Materials', dim: 'specs', weight: 1.5, title: true,
      listing: ['Body Material', 'Material', 'Steel Grade', 'Grade'], official: ['steel grade', 'grade', '304', '316', '18/8'],
      parse: GRADE, display: (v) => (v === '202' ? 'SS 202 (lower grade)' : `SS ${v}${v === '304' || v === '18/8' ? ' (18/8 food grade)' : v === '316' ? ' (marine grade)' : ''}`), points: (v) => (v === '316' ? 1 : v === '304' || v === '18/8' || v === '18/10' ? 0.95 : 0.4) },
    { key: 'insulated', label: 'Double-wall vacuum insulation', group: 'Insulation', dim: 'specs', weight: 2.5, title: true,
      listing: ['Double Insulated Wall', 'Insulated', 'Insulation', 'Vacuum Insulated', 'Thermal Insulation'], official: ['insulation', 'insulated', 'double wall', 'vacuum', 'double-wall'],
      parse: (s) => (yesNo(s) !== null ? yesNo(s) : /double[-\s]?wall|vacuum|insulat|thermos/i.test(s) ? true : null), display: (v) => (v ? 'Yes' : 'No'), points: (v) => (v ? 1 : 0.2) },
    { key: 'hot', label: 'Stated hot retention', group: 'Insulation', dim: 'specs', weight: 1, title: true,
      listing: ['Hot Retention', 'Keeps Hot', 'Hot For', 'Temperature Retention', 'Retention Time'], official: ['hot', 'keeps hot', 'hot retention', 'hours hot'],
      parse: (s) => { const m = /(\d{1,2})\s*(?:\+\s*)?(?:h|hr|hrs|hours?)\b[^.]{0,20}?(?:hot|warm)|(?:hot|warm)[^.]{0,20}?(\d{1,2})\s*(?:\+\s*)?(?:h|hr|hrs|hours?)\b/i.exec(String(s)); const h = m ? Number(m[1] || m[2]) : null; return h && h >= 1 && h <= 48 ? h : null; }, display: (v) => `${v} h hot`, points: (v) => (v >= 12 ? 1 : v >= 6 ? 0.8 : 0.6) },
    { key: 'cold', label: 'Stated cold retention', group: 'Insulation', dim: 'specs', weight: 1, title: true,
      listing: ['Cold Retention', 'Keeps Cold', 'Cold For', 'Temperature Retention', 'Retention Time'], official: ['cold', 'keeps cold', 'cold retention', 'hours cold', 'iced'],
      parse: (s) => { const m = /(\d{1,2})\s*(?:\+\s*)?(?:h|hr|hrs|hours?)\b[^.]{0,20}?(?:cold|cool|ice)|(?:cold|cool|ice)[^.]{0,20}?(\d{1,2})\s*(?:\+\s*)?(?:h|hr|hrs|hours?)\b/i.exec(String(s)); const h = m ? Number(m[1] || m[2]) : null; return h && h >= 1 && h <= 72 ? h : null; }, display: (v) => `${v} h cold`, points: (v) => (v >= 24 ? 1 : v >= 12 ? 0.8 : 0.6) },
    { key: 'lid', label: 'Lid type', group: 'Lid', dim: 'specs', weight: 1, title: true,
      listing: ['Lid Type', 'Lid', 'Cap Type', 'Closure Type', 'Type'], official: ['lid', 'lid type', 'cap', 'straw'],
      parse: (s) => allOf(s, LID), display: (v) => v.map((t) => ({ straw: 'Straw', flip: 'Flip lid', sip: 'Sip / spout', screw: 'Screw cap', slide: 'Slide lid' })[t]).join(' + '), points: (v) => (v.length >= 2 ? 1 : 0.8) },
    { key: 'leak', label: 'Leak-proof', group: 'Lid', dim: 'specs', weight: 1.5, title: true,
      listing: ['Leak Proof', 'Leak-Proof', 'Spill Proof', 'Leakproof'], official: ['leak proof', 'leak-proof', 'leakproof', 'spill proof', 'spill-proof'],
      parse: (s) => (yesNo(s) !== null ? yesNo(s) : /leak|spill/i.test(s) ? true : null), display: (v) => (v ? 'Yes' : 'No'), points: (v) => (v ? 1 : 0.2) },
    { key: 'handle', label: 'Handle', group: 'Lid', dim: 'specs', weight: 0.5, title: true,
      listing: ['With Handle', 'Handle', 'Handle Material'], official: ['handle'], parse: (s) => (yesNo(s) !== null ? yesNo(s) : /handle/i.test(s) ? true : null), display: (v) => (v ? 'Yes' : 'No'), points: () => 0.8 },
    { key: 'bpa', label: 'BPA-free', group: 'Safety', dim: 'safety', weight: 3, title: true,
      listing: ['BPA Free', 'BPA-Free', 'Food Grade'], official: ['bpa free', 'bpa-free', 'food grade', 'food-grade'],
      parse: (s) => (yesNo(s) !== null ? yesNo(s) : /bpa[-\s]?free|food[-\s]?grade/i.test(s) ? true : null), display: (v) => (v ? 'Stated' : 'Not stated'), points: (v) => (v ? 1 : 0) },
    { key: 'foodsafe', label: 'Food-contact standard (FDA / LFGB / IS)', group: 'Safety', dim: 'safety', weight: 2.5,
      listing: ['Certification', 'Certifications', 'Food Safe', 'Standards'], official: ['fda', 'lfgb', 'food safe', 'certification', 'is 14', 'bis', 'food contact'],
      parse: (s) => (/\bfda\b|\blfgb\b|\bbis\b|is\s*\d{4,5}|food[-\s]?(?:safe|contact)|\bce\b/i.test(s) ? true : yesNo(s)), display: (v) => (v ? 'Stated' : 'Not stated'), points: (v) => (v ? 1 : 0) },
    { key: 'dishwasher', label: 'Dishwasher safe', group: 'Care', dim: 'specs', weight: 0.5,
      listing: ['Dishwasher Safe', 'Dishwasher-Safe'], official: ['dishwasher safe', 'dishwasher-safe', 'dishwasher'], parse: yesNo, display: (v) => (v ? 'Yes' : 'No'), points: (v) => (v ? 1 : 0.5) },
    { key: 'microwave', label: 'Microwave safe', group: 'Care', dim: 'specs', weight: 0,
      listing: ['Microwave Safe', 'Microwave-Safe'], official: ['microwave safe', 'microwave'], parse: yesNo, display: (v) => (v ? 'Yes' : 'No (not for steel)') },
    { key: 'weight', label: 'Weight', group: 'Size', dim: 'specs', weight: 0.5,
      listing: ['Weight', 'Item Weight', 'Net Weight'], official: ['weight', 'net weight'],
      parse: grams, display: (v) => `${v} g`, plausible: (v) => (v >= 50 && v <= 2000) || `${v} g is not a plausible tumbler weight`, points: () => 0.8 },
    { key: 'sweat', label: 'Sweat-free exterior', group: 'Insulation', dim: 'specs', weight: 0.5, title: true,
      listing: ['Sweat Proof', 'Condensation Free', 'Other Features'], official: ['sweat', 'condensation'], parse: (s) => (yesNo(s) !== null ? yesNo(s) : /sweat|condensation/i.test(s) ? true : null), display: (v) => (v ? 'Yes' : 'No'), points: (v) => (v ? 1 : 0.4) },
    { key: 'warranty', label: 'Warranty', group: 'Support', dim: 'maker', weight: 0, title: true,
      listing: ['Warranty Summary', 'Warranty', 'Domestic Warranty', 'Warranty Period'], official: ['warranty', 'warranty period', 'lifetime warranty', 'guarantee'],
      parse: (s) => (/lifetime|life\s*time|forever/i.test(s) ? 240 : warrantyMonths(s)), display: (v) => (v >= 240 ? 'Lifetime' : v % 12 === 0 ? `${v / 12} year${v > 12 ? 's' : ''}` : `${v} months`), plausible: (v) => (v <= 240 && v >= 1) || `${v} months warranty is not plausible` },
  ],
  // Official-page matcher: category words that never identify a model, and the capacity both sides must agree on.
  match: {
    descriptive: ['tumbler', 'tumblers', 'sipper', 'bottle', 'bottles', 'flask', 'mug', 'cup', 'glass', 'water', 'coffee', 'tea', 'ml', 'l', 'ltr', 'litre', 'liter', 'oz', 'capacity', 'insulated', 'insulation', 'vacuum', 'thermos', 'thermosteel',
      'double', 'wall', 'stainless', 'steel', 'ss', 'hot', 'cold', 'hours', 'hrs', 'leak', 'proof', 'spill', 'straw', 'lid', 'handle', 'sipper', 'flip', 'kids', 'school', 'office', 'gym', 'travel', 'car', 'with', 'for', 'and', 'the'],
    bundleNouns: ['lunch', 'tiffin', 'casserole', 'jar', 'blender', 'kettle', 'plate', 'spoon', 'bag', 'cooker', 'combo'],
    numeric: [
      { label: 'capacity', show: (v) => `${v} ml`, tol: 30,
        listing: (l) => tumblerMl(l.title) ?? tumblerMl((l.listingSpec || {}).Capacity || (l.listingSpec || {}).Volume),
        catalog: (c) => { const k = Object.entries(c.kv).find(([key, v]) => /capacity|volume|size/i.test(key) && tumblerMl(v) !== null); return k ? tumblerMl(k[1]) : tumblerMl(c.title); } },
    ],
  },
  officialProse: {
    'capacity (page text)': (t) => { const all = [...new Set([...t.matchAll(/\b(\d{3,4})\s*ml\b/gi)].map((m) => m[1]))].filter((v) => Number(v) >= 100 && Number(v) <= 3000); if (all.length === 1) return `${all[0]} ml`; const oz = [...new Set([...t.matchAll(/\b(\d{1,2})\s*oz\b/gi)].map((m) => m[1]))]; return oz.length === 1 ? `${oz[0]} oz` : null; },
    'steel grade (page text)': (t) => { const m = /\b(?:ss|sus|stainless\s*steel)\s*-?\s*(304|316|18\/8)\b|\b(304|316|18\/8)\s*(?:grade\s*)?stainless/i.exec(t); return m ? `SS ${m[1] || m[2]}` : null; },
    'insulation (page text)': (t) => (/double[-\s]?wall(?:ed)?\s*(?:vacuum\s*)?insulat|vacuum[-\s]?insulat/i.test(t) ? 'Yes' : null),
    'hot retention (page text)': (t) => { const m = /(?:hot|warm)\s*(?:for|up\s*to)\s*(\d{1,2})\s*(?:\+\s*)?(?:h|hr|hrs|hours?)|(\d{1,2})\s*(?:\+\s*)?(?:h|hr|hrs|hours?)\s*(?:of\s*)?(?:hot|warm)/i.exec(t); return m ? `${m[1] || m[2]} hours hot` : null; },
    'cold retention (page text)': (t) => { const m = /(?:cold|cool|iced?)\s*(?:for|up\s*to)\s*(\d{1,2})\s*(?:\+\s*)?(?:h|hr|hrs|hours?)|(\d{1,2})\s*(?:\+\s*)?(?:h|hr|hrs|hours?)\s*(?:of\s*)?(?:cold|cool|ice)/i.exec(t); return m ? `${m[1] || m[2]} hours cold` : null; },
    'bpa free (page text)': (t) => (/bpa[-\s]?free/i.test(t) ? 'Yes' : null),
    'leak proof (page text)': (t) => (/leak[-\s]?proof|spill[-\s]?proof/i.test(t) ? 'Yes' : null),
    'warranty (page text)': (t) => { if (/lifetime\s*(?:warranty|guarantee)/i.test(t)) return 'Lifetime'; const m = /(\d+)\s*[-\s]?(months?|years?)\s*(?:of\s*)?(?:brand\s*|manufacturer'?s?\s*)?warranty/i.exec(t) || /warranty\s*(?:of|:)?\s*(\d+)\s*[-\s]?(months?|years?)/i.exec(t); return m ? `${m[1]} ${m[2]}` : null; },
  },
  facets: [
    { group: 'cap', label: 'Capacity', hint: 'As stated; implausible values shown separately', of: (F) => (F.capacity ? (F.capacity.tier === 'rejected' ? 'implausible' : capClass(F.capacity.value)) : null),
      labels: { jumbo: '1 L +', large: '600–999 ml', standard: '350–599 ml', small: 'Under 350 ml', implausible: 'Implausible claim (rejected)' } },
    { group: 'body', label: 'Body', hint: '', of: (F) => (F.body ? F.body.value : null), labels: { steel: 'Stainless steel', glass: 'Glass', tritan: 'Tritan', plastic: 'Plastic (type not stated)' } },
    { group: 'grade', label: 'Steel grade', hint: 'Only when the grade is printed', of: (F) => (F.grade ? (F.grade.value === '316' ? '316' : F.grade.value === '202' ? '202' : '304') : null), labels: { '316': 'SS 316', '304': 'SS 304 / 18-8', '202': 'SS 202' } },
    { group: 'ins', label: 'Insulation', hint: '', multi: true, of: (F) => [F.insulated && F.insulated.value ? 'vacuum' : null, F.hot && F.hot.value >= 6 ? 'hot6' : null, F.cold && F.cold.value >= 12 ? 'cold12' : null].filter(Boolean), labels: { vacuum: 'Double-wall / vacuum', hot6: 'Hot 6 h +', cold12: 'Cold 12 h +' } },
    { group: 'lid', label: 'Lid', hint: '', multi: true, of: (F) => [...(F.lid ? F.lid.value : []), F.leak && F.leak.value ? 'leak' : null, F.handle && F.handle.value ? 'handle' : null].filter(Boolean), labels: { straw: 'Straw', flip: 'Flip lid', sip: 'Sip / spout', screw: 'Screw cap', slide: 'Slide lid', leak: 'Leak-proof', handle: 'Handle' } },
    { group: 'safe', label: 'Food safety', hint: 'Stated', multi: true, of: (F) => [F.bpa && F.bpa.value ? 'bpa' : null, F.foodsafe && F.foodsafe.value ? 'standard' : null, F.dishwasher && F.dishwasher.value ? 'dishwasher' : null].filter(Boolean), labels: { bpa: 'BPA-free stated', standard: 'Food-contact standard stated', dishwasher: 'Dishwasher safe' } },
  ],
  featured: ['seg:jumbo', 'seg:large', 'body:steel', 'grade:304', 'ins:vacuum', 'lid:straw', 'lid:leak', 'lid:handle', 'safe:bpa', 'ev:official', 'maker:global', 'maker:india'],
  lines: {
    q: (F) => [F.capacity && F.capacity.tier !== 'rejected' ? F.capacity.display : null, F.body ? (F.grade ? `SS ${F.grade.value}` : F.body.display) : null, F.insulated && F.insulated.value ? 'vacuum insulated' : null].filter(Boolean).join(' · '),
    f: (F) => [F.lid ? F.lid.display : null, F.leak && F.leak.value ? 'leak-proof' : null, F.hot ? F.hot.display : F.cold ? F.cold.display : null].filter(Boolean).join(' · '),
  },
};
