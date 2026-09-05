// Trimmers — site schema: raw sources, inclusion rule, verified fields, segments and facets.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { num, minutes, yesNo, oneOf, warrantyMonths } = require('../lib/parse.cjs');

const BLADES = [['titanium', /titanium/i], ['ceramic', /ceramic/i], ['carbon-steel', /carbon\s*steel/i], ['stainless', /stainless|steel/i]];
const POWER = [['cordless', /cordless|rechargeable|battery|usb/i], ['corded', /corded|mains|ac\s*power/i]];
const runClass = (v) => (v >= 120 ? 'long' : v >= 60 ? 'standard' : 'short');
// Run time named as such ("90 min runtime", "runtime: 120 mins") — a bare "60 min" in a title may be the charge time.
const runMinutes = (s) => {
  const t = String(s || '');
  const m = /\b(\d{2,3})\s*-?\s*min(?:ute)?s?\s*(?:of\s*)?(?:run|usage|cordless|trimming|working|use|shaving)/i.exec(t) || /run\s*-?\s*time\s*(?:of|:)?\s*(\d{2,3})\s*-?\s*min/i.exec(t);
  return m ? Number(m[1]) : null;
};
const ipOf = (s) => { const m = /\bipx?\s*-?\s*(\d)\b/i.exec(String(s || '')); return m ? Number(m[1]) : null; };
const mmRange = (s) => { const t = String(s || '').replace(/,/g, '.'); const m = /(\d+(?:\.\d+)?)\s*(?:mm)?\s*(?:-|–|to)\s*(\d+(?:\.\d+)?)\s*mm/i.exec(t); return m ? Number(m[2]) : (/^\s*(\d+(?:\.\d+)?)\s*mm/i.test(t) ? Number(/(\d+(?:\.\d+)?)/.exec(t)[1]) : null); };
const count = (s) => { const n = num(s); return n !== null && Number.isInteger(n) && n >= 1 && n <= 60 ? n : null; };

export default {
  id: 'trimmers',
  label: 'Trimmers',
  kicker: 'GROOM',
  family: 'grooming',
  unit: 'trimmer',
  blurb: 'Beard and body trimmers sold on Flipkart and Amazon.in — scored on stated run time, charge time, length range, blade material, washability and IP rating; seller adjectives count for nothing.',
  sources: { flipkart: 'tr_pages.json', amazon: 'amz_tr_pages.json' },
  include: (title) => /trimmer|clipper|grooming\s*kit|shaver/i.test(title) && !/blade only|replacement (?:head|blade)|comb only|pouch|cover|stand only|nose hair only|epilator|women'?s? razor/i.test(title),
  segment: {
    key: 'seg', label: 'Run time class',
    options: [
      { id: 'long', label: 'Long · 120 min +' },
      { id: 'standard', label: 'Standard · 60–119 min' },
      { id: 'short', label: 'Short · under 60 min' },
      { id: 'unstated', label: 'Run time not stated' },
    ],
    of: (F) => (F.runtime && F.runtime.tier !== 'rejected' ? runClass(F.runtime.value) : 'unstated'),
  },
  fields: [
    { key: 'runtime', label: 'Battery run time', group: 'Battery', dim: 'specs', weight: 3, title: true,
      listing: ['Battery Run Time', 'Run Time', 'Runtime', 'Usage Time', 'Working Time'], official: ['run time', 'runtime', 'usage time', 'working time', 'battery life', 'operating time'],
      parse: minutes, display: (v) => (v >= 60 && v % 60 === 0 ? `${v / 60} h` : `${v} min`),
      plausible: (v) => (v >= 20 && v <= 600) || `${v} min run time is not plausible for a trimmer`,
      points: (v) => (v >= 180 ? 1 : v >= 120 ? 0.9 : v >= 90 ? 0.75 : v >= 60 ? 0.6 : v >= 45 ? 0.45 : 0.3) },
    { key: 'charge', label: 'Charging time', group: 'Battery', dim: 'specs', weight: 1.5,
      listing: ['Charging Time', 'Charge Time', 'Full Charge Time'], official: ['charging time', 'charge time', 'full charge'],
      parse: minutes, display: (v) => (v >= 60 && v % 60 === 0 ? `${v / 60} h` : `${v} min`),
      plausible: (v) => (v >= 15 && v <= 960) || `${v} min charge time is not plausible`,
      points: (v) => (v <= 60 ? 1 : v <= 90 ? 0.85 : v <= 120 ? 0.7 : v <= 240 ? 0.5 : 0.3) },
    { key: 'usbc', label: 'Charging port', group: 'Battery', dim: 'specs', weight: 1, title: true,
      listing: ['Power Source', 'Charging Type', 'Charger Type', 'Other Power Features'], official: ['charging', 'charging port', 'power source', 'charger'],
      parse: (s) => (/type[-\s]?c|usb[-\s]?c\b/i.test(s) ? 'usb-c' : /micro[-\s]?usb/i.test(s) ? 'micro-usb' : /usb/i.test(s) ? 'usb' : /adapter|adaptor|dock|cradle|stand/i.test(s) ? 'adapter' : null),
      display: (v) => ({ 'usb-c': 'USB-C', 'micro-usb': 'Micro-USB', usb: 'USB (type not stated)', adapter: 'Adapter / stand' })[v], points: (v) => (v === 'usb-c' ? 1 : v === 'usb' ? 0.7 : 0.5) },
    { key: 'range', label: 'Max trimming length', group: 'Cutting', dim: 'specs', weight: 2, title: true,
      listing: ['Trimming Range', 'Length Range', 'Cutting Length', 'Trimming Length'], official: ['trimming range', 'length settings', 'cutting length', 'length range', 'trimming length'],
      parse: mmRange, display: (v) => `up to ${v} mm`, plausible: (v) => (v >= 1 && v <= 50) || `${v} mm is not a plausible trimming length`,
      points: (v) => (v >= 20 ? 1 : v >= 12 ? 0.85 : v >= 7 ? 0.7 : 0.5) },
    { key: 'lengths', label: 'Length settings', group: 'Cutting', dim: 'specs', weight: 1.5, title: true,
      listing: ['Length Adjustments', 'Number of Length Settings', 'Length Settings', 'Precision Settings'], official: ['length settings', 'length adjustments', 'precision settings', 'lock-in length settings'],
      parse: count, display: (v) => `${v}`, points: (v) => (v >= 20 ? 1 : v >= 10 ? 0.85 : v >= 4 ? 0.65 : 0.4) },
    { key: 'blade', label: 'Blade material', group: 'Cutting', dim: 'specs', weight: 1.5, title: true,
      listing: ['Blade Material', 'Blade Type', 'Blade'], official: ['blade material', 'blade', 'blades', 'cutting element'],
      parse: (s) => oneOf(s, BLADES), display: (v) => ({ titanium: 'Titanium-coated', ceramic: 'Ceramic', 'carbon-steel': 'Carbon steel', stainless: 'Stainless steel' })[v],
      points: (v) => (v === 'stainless' ? 0.8 : 1) },
    { key: 'selfsharpen', label: 'Self-sharpening blades', group: 'Cutting', dim: 'specs', weight: 0.5,
      listing: ['Self Sharpening Blades', 'Self-Sharpening', 'Blade Features'], official: ['self-sharpening', 'self sharpening', 'skin-friendly blades'],
      parse: (s) => (yesNo(s) !== null ? yesNo(s) : /self[-\s]?sharpen/i.test(s) ? true : null), display: (v) => (v ? 'Yes' : 'No'), points: (v) => (v ? 1 : 0.4) },
    { key: 'washable', label: 'Washable head', group: 'Build', dim: 'specs', weight: 1,
      listing: ['Washable Head', 'Washable', 'Water Resistant', 'Waterproof'], official: ['washable', 'water resistant', 'waterproof', 'fully washable', 'wet & dry'],
      parse: (s) => (yesNo(s) !== null ? yesNo(s) : /washable|water\s*resistant|waterproof|wet\s*&\s*dry/i.test(s) ? true : null), display: (v) => (v ? 'Yes' : 'No'), points: (v) => (v ? 1 : 0.3) },
    { key: 'ip', label: 'Water-resistance rating', group: 'Build', dim: 'specs', weight: 1, title: true,
      listing: ['Water Proof Ratings', 'Waterproof Rating', 'IP Rating', 'Water Resistance Rating'], official: ['ip rating', 'ipx', 'water resistance', 'waterproof rating'],
      parse: ipOf, display: (v) => `IPX${v}`, points: (v) => (v >= 7 ? 1 : v >= 5 ? 0.8 : 0.5) },
    { key: 'power', label: 'Power source', group: 'Battery', dim: 'specs', weight: 0.5, title: true,
      listing: ['Type', 'Power Source', 'Power Type'], official: ['power source', 'power type', 'corded'],
      parse: (s) => oneOf(s, POWER), display: (v) => (v === 'cordless' ? 'Cordless (rechargeable)' : 'Corded'), points: (v) => (v === 'cordless' ? 1 : 0.6) },
    { key: 'indicator', label: 'Battery indicator', group: 'Battery', dim: 'specs', weight: 0.5,
      listing: ['Battery Indicator', 'Charging Indicator', 'Display', 'LED Indicator'], official: ['battery indicator', 'led indicator', 'display', 'charge indicator'],
      parse: (s) => (yesNo(s) !== null ? yesNo(s) : /led|digital|display|indicator|%/i.test(s) ? true : null), display: (v) => (v ? 'Yes' : 'No'), points: (v) => (v ? 1 : 0.3) },
    { key: 'skinsafe', label: 'Skin-guard / rounded tips', group: 'Safety', dim: 'safety', weight: 3, title: true,
      listing: ['Skin Friendly', 'Skin Protection', 'Blade Features', 'Other Features', 'Safety Features'], official: ['skin-friendly', 'skin friendly', 'rounded tips', 'skin guard', 'safety'],
      parse: (s) => (yesNo(s) !== null ? yesNo(s) : /skin[-\s]?(?:friendly|safe|guard|protect)|rounded\s*(?:tips?|edges?)|no\s*nicks?|anti[-\s]?nick/i.test(s) ? true : null), display: (v) => (v ? 'Stated' : 'Not stated'), points: (v) => (v ? 1 : 0) },
    { key: 'overcharge', label: 'Over-charge protection', group: 'Safety', dim: 'safety', weight: 1.5,
      listing: ['Over Charge Protection', 'Overcharge Protection', 'Other Power Features', 'Safety Features'], official: ['overcharge protection', 'over-charge protection', 'battery protection'],
      parse: (s) => (yesNo(s) !== null ? yesNo(s) : /over[-\s]?charg/i.test(s) ? true : null), display: (v) => (v ? 'Stated' : 'Not stated'), points: (v) => (v ? 1 : 0) },
    { key: 'certification', label: 'Safety certification', group: 'Safety', dim: 'safety', weight: 1,
      listing: ['Certification', 'Certifications', 'BIS Certified', 'Safety Certification'], official: ['certification', 'certifications', 'bis', 'ce', 'compliance'],
      parse: (s) => (/\bbis\b|is\s*\d{3,5}|\bce\b|\bul\b|\brohs\b|r-\d{6,}/i.test(s) ? true : yesNo(s)), display: (v) => (v ? 'Stated' : 'Not stated'), points: (v) => (v ? 1 : 0) },
    { key: 'warranty', label: 'Warranty', group: 'Support', dim: 'maker', weight: 0, title: true,
      listing: ['Warranty Summary', 'Warranty', 'Domestic Warranty', 'Warranty Period'], official: ['warranty', 'warranty period'],
      parse: warrantyMonths, display: (v) => (v % 12 === 0 ? `${v / 12} year${v > 12 ? 's' : ''}` : `${v} months`), plausible: (v) => (v <= 60 && v >= 1) || `${v} months warranty is not plausible` },
  ],
  // Official-page matcher: category words that never identify a model, product nouns a maker's own title would have
  // to mention, and the one quantity (run time) both sides state that must agree.
  match: {
    descriptive: ['trimmer', 'trimmers', 'clipper', 'clippers', 'shaver', 'grooming', 'groomer', 'kit', 'beard', 'hair', 'body', 'face', 'nose', 'ear', 'cordless', 'corded', 'rechargeable', 'usb', 'charging',
      'runtime', 'run', 'time', 'min', 'mins', 'minutes', 'hrs', 'battery', 'lithium', 'waterproof', 'washable', 'wet', 'dry', 'blade', 'blades', 'steel', 'stainless', 'titanium', 'ceramic', 'comb', 'combs', 'length', 'settings',
      'skin', 'friendly', 'safe', 'fast', 'charge', 'travel', 'lock', 'precision', 'multigroom', 'multi', 'in', 'one', 'all', 'with', 'for', 'and', 'the'],
    bundleNouns: ['dryer', 'straightener', 'epilator', 'massager', 'speaker', 'perfume', 'wallet', 'watch', 'earbuds', 'toothbrush', 'kettle', 'bag'],
    numeric: [
      { label: 'run time', show: (v) => `${v} min`, tol: 5,
        listing: (l) => runMinutes(l.title) ?? minutes((l.listingSpec || {})['Battery Run Time'] || (l.listingSpec || {})['Run Time'] || (l.listingSpec || {}).Runtime),
        catalog: (c) => { const k = Object.entries(c.kv).find(([key, v]) => /run\s*time|runtime|usage time|working time|operating time/i.test(key) && minutes(v) !== null); return k ? minutes(k[1]) : runMinutes(c.title); } },
    ],
  },
  officialProse: {
    'run time (page text)': (t) => { const all = [...new Set([...t.matchAll(/\b(\d{2,3})\s*-?\s*min(?:ute)?s?\s*(?:of\s*)?(?:run|usage|cordless|trimming|working)/gi)].map((m) => m[1]))]; return all.length === 1 ? `${all[0]} min` : null; },
    'charging time (page text)': (t) => { const m = /(\d+(?:\.\d+)?)\s*-?\s*(hours?|hrs?|min(?:ute)?s?)\s*(?:of\s*)?(?:full\s*)?charg/i.exec(t) || /charg(?:e|ing)\s*time\s*(?:of|:)?\s*(\d+(?:\.\d+)?)\s*-?\s*(hours?|hrs?|min(?:ute)?s?)/i.exec(t); return m ? `${m[1]} ${m[2]}` : null; },
    'length settings (page text)': (t) => { const m = /\b(\d{1,2})\s*(?:lock-in\s*)?length\s*settings/i.exec(t); return m ? m[1] : null; },
    'warranty (page text)': (t) => { const m = /(\d+)\s*[-\s]?(months?|years?)\s*(?:of\s*)?(?:brand\s*|manufacturer'?s?\s*|domestic\s*)?warranty/i.exec(t) || /warranty\s*(?:of|:)?\s*(\d+)\s*[-\s]?(months?|years?)/i.exec(t); return m ? `${m[1]} ${m[2]}` : null; },
    'ip rating (page text)': (t) => { const m = /\b(ipx\s*\d)\b/i.exec(t); return m ? m[1] : null; },
  },
  facets: [
    { group: 'run', label: 'Run time', hint: 'As stated; implausible values shown separately', of: (F) => (F.runtime ? (F.runtime.tier === 'rejected' ? 'implausible' : runClass(F.runtime.value)) : null),
      labels: { long: '120 min +', standard: '60–119 min', short: 'Under 60 min', implausible: 'Implausible claim (rejected)' } },
    { group: 'chg', label: 'Charging', hint: '', multi: true, of: (F) => [F.usbc && F.usbc.value === 'usb-c' ? 'usb-c' : null, F.charge && F.charge.value <= 90 ? 'fast' : null].filter(Boolean),
      labels: { 'usb-c': 'USB-C charging', fast: 'Charges in ≤ 90 min' } },
    { group: 'blade', label: 'Blade', hint: '', of: (F) => (F.blade ? F.blade.value : null), labels: { titanium: 'Titanium-coated', ceramic: 'Ceramic', 'carbon-steel': 'Carbon steel', stainless: 'Stainless steel' } },
    { group: 'len', label: 'Length settings', hint: '', of: (F) => (F.lengths ? (F.lengths.value >= 20 ? '20plus' : F.lengths.value >= 10 ? '10-19' : 'lt10') : null), labels: { '20plus': '20 + settings', '10-19': '10–19 settings', lt10: 'Under 10 settings' } },
    { group: 'wet', label: 'Water resistance', hint: '', multi: true, of: (F) => [F.washable && F.washable.value ? 'washable' : null, F.ip && F.ip.value >= 7 ? 'ipx7' : null].filter(Boolean), labels: { washable: 'Washable head', ipx7: 'IPX7 (fully waterproof)' } },
    { group: 'safe', label: 'Safety', hint: 'Stated protections', multi: true, of: (F) => [F.skinsafe && F.skinsafe.value ? 'skin' : null, F.overcharge && F.overcharge.value ? 'overcharge' : null, F.certification && F.certification.value ? 'certified' : null].filter(Boolean),
      labels: { skin: 'Skin-guard / rounded tips', overcharge: 'Over-charge protection', certified: 'Certification stated' } },
  ],
  featured: ['seg:long', 'seg:standard', 'chg:usb-c', 'chg:fast', 'blade:titanium', 'len:20plus', 'wet:ipx7', 'wet:washable', 'safe:skin', 'ev:official', 'maker:global', 'maker:india'],
  lines: {
    q: (F) => [F.runtime && F.runtime.tier !== 'rejected' ? `${F.runtime.display} run` : null, F.charge && F.charge.tier !== 'rejected' ? `${F.charge.display} charge` : null, F.range ? F.range.display : null].filter(Boolean).join(' · '),
    f: (F) => [F.blade ? F.blade.display : null, F.lengths ? `${F.lengths.display} lengths` : null, F.ip ? F.ip.display : F.washable && F.washable.value ? 'washable' : null].filter(Boolean).join(' · '),
  },
};
