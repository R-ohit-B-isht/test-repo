// Hair dryers — site schema: raw sources, inclusion rule, verified fields, segments and facets.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { num, watts, grams, yesNo, allOf, warrantyMonths } = require('../lib/parse.cjs');

const ATTACH = [['concentrator', /concentrator|nozzle|nozel/i], ['diffuser', /diffuser/i], ['comb', /comb|brush/i]];
const TECH = [['ionic', /\bionic|negative ion|ion\s*(?:care|technology)/i], ['ceramic', /ceramic/i], ['tourmaline', /tourmaline/i], ['ac-motor', /\bac\s*motor|brushless|bldc|digital motor/i]];
const count = (s) => { const n = num(s); return n !== null && Number.isInteger(n) && n >= 1 && n <= 12 ? n : null; };
const wattClass = (v) => (v >= 1800 ? 'salon' : v >= 1200 ? 'everyday' : 'travel');
// Makers rate some dryers as a range ("1400-1600 W", varies with mains voltage): credit the lower bound.
const ratedWatts = (s) => { const r = /(\d{3,4})\s*-\s*(\d{3,4})\s*-?\s*w(?:atts?)?\b/i.exec(String(s || '')); return r ? Number(r[1]) : watts(s); };
const metres = (s) => { const t = String(s || ''); const m = /(\d+(?:\.\d+)?)\s*(?:m|mtr|metres?|meters?)\b/i.exec(t); const cm = /(\d+(?:\.\d+)?)\s*cm\b/i.exec(t); return cm ? Number(cm[1]) / 100 : m ? Number(m[1]) : null; };

export default {
  id: 'hair-dryers',
  label: 'Hair dryers',
  kicker: 'DRY',
  family: 'grooming',
  unit: 'hair dryer',
  blurb: 'Hair dryers sold on Flipkart and Amazon.in — scored on wattage, heat/speed control, cool shot, motor and safety features a maker page or the marketplace spec table actually states.',
  sources: { flipkart: 'hd_pages.json', amazon: 'amz_hd_pages.json' },
  include: (title) => /hair\s*dryer|blow\s*dryer|\bdryer\b/i.test(title) && !/straightener only|curler only|diffuser only|stand only|holder|bag|pouch|cover|nozzle only|towel/i.test(title) && !/^(?!.*dryer).*(?:straightener|curler)/i.test(title),
  segment: {
    key: 'seg', label: 'Power class',
    options: [
      { id: 'travel', label: 'Travel · under 1,200 W' },
      { id: 'everyday', label: 'Everyday · 1,200–1,799 W' },
      { id: 'salon', label: 'Salon · 1,800 W +' },
      { id: 'unstated', label: 'Wattage not stated' },
    ],
    of: (F) => (F.wattage && F.wattage.tier !== 'rejected' ? wattClass(F.wattage.value) : 'unstated'),
  },
  fields: [
    { key: 'wattage', label: 'Rated power', group: 'Motor', dim: 'specs', weight: 3, title: true,
      listing: ['Wattage', 'Power Consumption', 'Power', 'Power Requirements'], official: ['wattage', 'power', 'rated power', 'power consumption', 'watt'],
      parse: ratedWatts, display: (v) => `${v} W`,
      plausible: (v) => (v >= 300 && v <= 2800) || `${v} W is not a plausible hair-dryer rating (household and salon dryers are 300–2,800 W)`,
      points: (v) => (v >= 2000 ? 1 : v >= 1800 ? 0.9 : v >= 1400 ? 0.75 : v >= 1200 ? 0.6 : v >= 1000 ? 0.45 : 0.3) },
    { key: 'heat', label: 'Heat settings', group: 'Control', dim: 'specs', weight: 2,
      listing: ['Number of Heat Settings', 'Heat Settings', 'Temperature Settings'], official: ['heat settings', 'temperature settings', 'heat levels', 'temperature levels'],
      parse: count, display: (v) => `${v}`, points: (v) => (v >= 3 ? 1 : v === 2 ? 0.6 : 0.3) },
    { key: 'speed', label: 'Speed settings', group: 'Control', dim: 'specs', weight: 1.5,
      listing: ['Number of Speed Settings', 'Speed Settings'], official: ['speed settings', 'speed levels', 'speeds', 'airflow settings'],
      parse: count, display: (v) => `${v}`, points: (v) => (v >= 3 ? 1 : v === 2 ? 0.7 : 0.3) },
    { key: 'coolshot', label: 'Cool shot', group: 'Control', dim: 'specs', weight: 1.5, title: true,
      listing: ['Cold Air Feature', 'Cool Shot', 'Cool Air', 'Cold Shot'], official: ['cool shot', 'cold shot', 'cool air', 'cold air', 'cool setting'],
      parse: (s) => (yesNo(s) !== null ? yesNo(s) : /cool\s*shot|cold\s*shot|cool\s*(?:air|setting)/i.test(s) ? true : null), display: (v) => (v ? 'Yes' : 'No'), points: (v) => (v ? 1 : 0.2) },
    { key: 'tech', label: 'Motor / heat technology', group: 'Motor', dim: 'specs', weight: 2, title: true,
      listing: ['Technology Used', 'Technology', 'Ionic Technology', 'Motor Type', 'Motor'], official: ['motor', 'motor type', 'technology', 'ionic', 'ion'],
      parse: (s) => allOf(s, TECH), display: (v) => v.map((t) => ({ ionic: 'Ionic', ceramic: 'Ceramic', tourmaline: 'Tourmaline', 'ac-motor': 'AC / brushless motor' })[t]).join(', '),
      points: (v) => Math.min(1, (v.includes('ac-motor') ? 0.5 : 0) + (v.includes('ionic') ? 0.4 : 0) + (v.includes('ceramic') || v.includes('tourmaline') ? 0.2 : 0)) },
    { key: 'attachments', label: 'Attachments', group: 'Styling', dim: 'specs', weight: 1, title: true,
      listing: ['Attachment Types', 'Attachments', 'Nozzle/Concentrator', 'Accessories'], official: ['attachments', 'accessories', 'in the box', 'nozzle', 'concentrator', 'diffuser'],
      parse: (s) => allOf(s, ATTACH), display: (v) => v.map((t) => ({ concentrator: 'Concentrator', diffuser: 'Diffuser', comb: 'Comb / brush' })[t]).join(', '),
      points: (v) => Math.min(1, 0.5 + 0.25 * v.length) },
    { key: 'cord', label: 'Cord length', group: 'Build', dim: 'specs', weight: 0.5,
      listing: ['Cord Length', 'Cable Length'], official: ['cord length', 'cable length', 'cord'],
      parse: metres, display: (v) => `${v} m`, plausible: (v) => (v >= 0.5 && v <= 4) || `${v} m cord is not plausible`, points: (v) => (v >= 2.5 ? 1 : v >= 1.8 ? 0.8 : 0.5) },
    { key: 'weight', label: 'Weight', group: 'Build', dim: 'specs', weight: 0.5,
      listing: ['Weight', 'Item Weight', 'Net Weight'], official: ['weight', 'net weight', 'product weight'],
      parse: grams, display: (v) => `${v} g`, plausible: (v) => (v >= 150 && v <= 1500) || `${v} g is not a plausible hair-dryer weight`, points: (v) => (v <= 500 ? 1 : v <= 700 ? 0.8 : 0.6) },
    { key: 'foldable', label: 'Foldable handle', group: 'Build', dim: 'specs', weight: 0.5,
      listing: ['Foldable', 'Foldable Handle'], official: ['foldable', 'folding handle'], parse: yesNo, display: (v) => (v ? 'Yes' : 'No'), points: () => 0.8 },
    { key: 'filter', label: 'Removable filter', group: 'Build', dim: 'specs', weight: 0.5,
      listing: ['Removable Filter', 'Detachable Filter'], official: ['removable filter', 'detachable filter', 'filter'], parse: yesNo, display: (v) => (v ? 'Yes' : 'No'), points: (v) => (v ? 1 : 0.3) },
    { key: 'overheat', label: 'Overheat protection', group: 'Safety', dim: 'safety', weight: 3, title: true,
      listing: ['Overheat Protection', 'Over Heat Protection', 'Safety Features', 'Other Features', 'Thermal Protection'], official: ['overheat protection', 'thermal protection', 'safety', 'over heat', 'thermo'],
      parse: (s) => (yesNo(s) !== null ? yesNo(s) : /over\s*-?heat|thermal\s*(?:cut|protect|fuse)|thermo\s*protect|auto\s*(?:cut|shut)/i.test(s) ? true : null), display: (v) => (v ? 'Stated' : 'Not stated'), points: (v) => (v ? 1 : 0) },
    { key: 'voltage', label: 'Universal voltage', group: 'Safety', dim: 'safety', weight: 1,
      listing: ['Universal Voltage', 'Dual Voltage', 'Power Required (Volts)', 'Voltage'], official: ['voltage', 'dual voltage', 'universal voltage'],
      parse: (s) => (yesNo(s) !== null ? yesNo(s) : /110\s*-\s*2[24]0|100\s*-\s*240|dual/i.test(s) ? true : /^\s*2[234]0\s*v?/i.test(s) ? false : null), display: (v) => (v ? 'Yes (110–240 V)' : 'No (single voltage)'), points: (v) => (v ? 1 : 0.6) },
    { key: 'certification', label: 'Safety certification', group: 'Safety', dim: 'safety', weight: 1,
      listing: ['Certification', 'Certifications', 'BIS Certified', 'Safety Certification'], official: ['certification', 'certifications', 'bis', 'ce', 'compliance'],
      parse: (s) => (/\bbis\b|is\s*\d{3,5}|\bce\b|\bul\b|\brohs\b|r-\d{6,}/i.test(s) ? true : yesNo(s)), display: (v) => (v ? 'Stated' : 'Not stated'), points: (v) => (v ? 1 : 0) },
    { key: 'warranty', label: 'Warranty', group: 'Support', dim: 'maker', weight: 0, title: true,
      listing: ['Warranty Summary', 'Warranty', 'Domestic Warranty', 'Warranty Period'], official: ['warranty', 'warranty period'],
      parse: warrantyMonths, display: (v) => (v % 12 === 0 ? `${v / 12} year${v > 12 ? 's' : ''}` : `${v} months`), plausible: (v) => (v <= 60 && v >= 1) || `${v} months warranty is not plausible` },
  ],
  match: {
    descriptive: ['hair', 'dryer', 'dryers', 'hairdryer', 'blow', 'watts', 'watt', 'w', 'power', 'foldable', 'folding', 'heat', 'speed', 'settings', 'cool', 'shot', 'nozzle', 'concentrator', 'diffuser',
      'styling', 'styler', 'salon', 'travel', 'home', 'use', 'quick', 'drying', 'dry', 'overheat', 'protection', 'handle', 'lightweight', 'light', 'weight', 'volt', 'cord', 'hot', 'cold', 'air'],
    bundleNouns: ['straightener', 'curler', 'crimper', 'brush', 'clip', 'clips', 'massager', 'gun', 'trimmer', 'shaver', 'epilator', 'kettle', 'speaker', 'styler', 'volumizer'],
    numeric: [
      { label: 'wattage', show: (v) => `${v} W`,
        listing: (l) => watts(l.title) ?? watts((l.listingSpec || {}).Wattage || (l.listingSpec || {})['Power Consumption'] || (l.listingSpec || {}).Power),
        catalog: (c) => {
          const RANGE = /(\d{3,4})\s*-\s*(\d{3,4})\s*-?\s*w(?:atts?)?\b/i;
          const k = Object.entries(c.kv).find(([key, v]) => /wattage|rated power|power consumption|^power$/i.test(key) && watts(v) !== null);
          for (const s of [c.title, k ? k[1] : '']) { const r = RANGE.exec(s); if (r) return [Number(r[1]), Number(r[2])]; }
          return k ? watts(k[1]) : watts(c.title);
        } },
    ],
  },
  officialProse: {
    // A maker range ("2200-2400 Watts", rating varies with mains voltage) is kept as a range; the field parser
    // rates it at the lower bound.
    'wattage (page text)': (t) => {
      const ranges = [...new Set([...t.matchAll(/\b(\d{3,4})\s*-\s*(\d{3,4})\s*-?\s*w(?:atts?)?\b/gi)].map((m) => `${m[1]}-${m[2]} W`))];
      if (ranges.length) return ranges.length === 1 ? ranges[0] : null;
      const all = [...new Set([...t.matchAll(/\b(\d{3,4})\s*-?\s*w(?:atts?)?\b/gi)].map((m) => m[1]))].filter((w) => Number(w) >= 300 && Number(w) <= 2800);
      return all.length === 1 ? `${all[0]} W` : null;
    },
    'warranty (page text)': (t) => { const m = /(\d+)\s*[-\s]?(months?|years?)\s*(?:of\s*)?(?:brand\s*|manufacturer'?s?\s*|domestic\s*)?warranty/i.exec(t) || /warranty\s*(?:of|:)?\s*(\d+)\s*[-\s]?(months?|years?)/i.exec(t); return m ? `${m[1]} ${m[2]}` : null; },
    'heat settings (page text)': (t) => { const m = /\b(\d)\s*(?:heat|temperature)\s*(?:settings?|levels?|modes?)/i.exec(t); return m ? m[1] : null; },
    'speed settings (page text)': (t) => { const m = /\b(\d)\s*speed\s*(?:settings?|levels?|modes?)/i.exec(t); return m ? m[1] : null; },
    'overheat protection (page text)': (t) => (/over\s*-?heat(?:ing)?\s*protect|thermal\s*(?:cut[-\s]?off|protect|fuse)|thermo\s*protect/i.test(t) ? 'Yes' : null),
  },
  facets: [
    { group: 'watt', label: 'Rated power', hint: 'As stated; implausible values shown separately', of: (F) => (F.wattage ? (F.wattage.tier === 'rejected' ? 'implausible' : wattClass(F.wattage.value)) : null),
      labels: { travel: 'Under 1,200 W', everyday: '1,200–1,799 W', salon: '1,800 W +', implausible: 'Implausible claim (rejected)' } },
    { group: 'heat', label: 'Heat settings', hint: '', of: (F) => (F.heat ? (F.heat.value >= 3 ? '3plus' : String(F.heat.value)) : null), labels: { '1': '1 heat setting', '2': '2 heat settings', '3plus': '3 + heat settings' } },
    { group: 'cool', label: 'Cool shot', hint: 'Cold-air button stated', of: (F) => (F.coolshot && F.coolshot.value ? 'yes' : null), labels: { yes: 'Cool shot' } },
    { group: 'tech', label: 'Technology', hint: 'Named motor / heater technology', multi: true, of: (F) => (F.tech ? F.tech.value : null),
      labels: { ionic: 'Ionic', ceramic: 'Ceramic', tourmaline: 'Tourmaline', 'ac-motor': 'AC / brushless motor' } },
    { group: 'attach', label: 'Attachments', hint: '', multi: true, of: (F) => (F.attachments ? F.attachments.value : null), labels: { concentrator: 'Concentrator', diffuser: 'Diffuser', comb: 'Comb / brush' } },
    { group: 'fold', label: 'Foldable', hint: '', of: (F) => (F.foldable && F.foldable.value ? 'yes' : null), labels: { yes: 'Foldable handle' } },
    { group: 'safe', label: 'Safety', hint: 'Stated protections', multi: true, of: (F) => [F.overheat && F.overheat.value ? 'overheat' : null, F.voltage && F.voltage.value ? 'dual-voltage' : null, F.certification && F.certification.value ? 'certified' : null].filter(Boolean),
      labels: { overheat: 'Overheat protection', 'dual-voltage': 'Universal voltage', certified: 'Certification stated' } },
  ],
  featured: ['seg:salon', 'seg:everyday', 'cool:yes', 'tech:ionic', 'tech:ac-motor', 'heat:3plus', 'attach:diffuser', 'safe:overheat', 'fold:yes', 'ev:official', 'maker:global', 'maker:india'],
  lines: {
    q: (F) => [F.wattage && F.wattage.tier !== 'rejected' ? F.wattage.display : null, F.heat ? `${F.heat.display} heat` : null, F.speed ? `${F.speed.display} speed` : null].filter(Boolean).join(' · '),
    f: (F) => [F.coolshot && F.coolshot.value ? 'cool shot' : null, F.tech ? F.tech.display : null, F.attachments ? F.attachments.display : null].filter(Boolean).join(' · '),
  },
};
