// Power banks — site schema: raw sources, inclusion rule, verified fields, segments and facets.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { mah, watts, grams, portCount, yesNo, allOf, oneOf, warrantyMonths } = require('../lib/parse.cjs');

const inr = (n) => n.toLocaleString('en-IN');
const CONNECTORS = [['usb-c', /type[-\s]?c|usb[-\s]?c\b/i], ['usb-a', /type[-\s]?a\b|usb[-\s]?a\b|\busb\b(?![-\s]?c)/i], ['micro-usb', /micro/i], ['lightning', /lightning/i]];
const PROTOCOLS = [['pd', /power\s*delivery|\bpd\b|\bpd\d/i], ['qc', /quick\s*charge|\bqc\s*\d|\bqc\b/i], ['pps', /\bpps\b/i], ['scp', /\bscp\b|super\s*charge/i], ['vooc', /vooc|dart|warp/i], ['fast', /fast\s*charg/i]];
const CELLS = [['li-polymer', /polymer|li-?po\b|lipo/i], ['lifepo4', /lifepo|iron\s*phosphate/i], ['li-ion', /lithium[-\s]?ion|li-?ion|\blithium\b/i]];
const PROTECTIONS = [['short-circuit', /short[-\s]*circuit/i], ['over-charge', /over[-\s]*charg/i], ['over-discharge', /over[-\s]*discharg/i], ['over-current', /over[-\s]*current/i], ['over-voltage', /over[-\s]*voltage|surge/i], ['temperature', /temperature|thermal|overheat/i]];

const capClass = (v) => (v >= 20000 ? 'travel' : v >= 10000 ? 'daily' : 'pocket');

export default {
  id: 'power-banks',
  label: 'Power banks',
  kicker: 'CHARGE',
  family: 'power',
  unit: 'power bank',
  blurb: 'Portable chargers sold on Flipkart and Amazon.in — scored on capacity, output, protocols and protections that a maker page or the marketplace spec table actually states.',
  sources: { flipkart: 'pb_pages.json', amazon: 'amz_pb_pages.json' },
  include: (title) => /power\s*bank|powerbank|\bmah\b/i.test(title) && !/case|cover|pouch|cable only|stand|holder|solar panel only/i.test(title),
  segment: {
    key: 'seg', label: 'Capacity class',
    options: [
      { id: 'pocket', label: 'Pocket · under 10,000 mAh' },
      { id: 'daily', label: 'Daily · 10,000–19,999 mAh' },
      { id: 'travel', label: 'Travel · 20,000 mAh +' },
      { id: 'unstated', label: 'Capacity not stated' },
    ],
    of: (F) => (F.capacity && F.capacity.tier !== 'rejected' ? capClass(F.capacity.value) : 'unstated'),
  },
  fields: [
    { key: 'capacity', label: 'Rated capacity', group: 'Battery', dim: 'specs', weight: 3, title: true,
      listing: ['Battery Capacity', 'Capacity'], official: ['capacity', 'battery capacity', 'rated capacity', 'cell capacity'],
      parse: mah, display: (v) => `${inr(v)} mAh`,
      plausible: (v) => (v <= 60000 && v >= 1000) || `${inr(v)} mAh is not a plausible portable pack (airline limit is 100 Wh ≈ 27,000 mAh; the largest real consumer packs are ~50,000 mAh)`,
      points: (v) => (v >= 25000 ? 1 : v >= 20000 ? 0.85 : v >= 10000 ? 0.6 : v >= 5000 ? 0.4 : 0.25) },
    { key: 'output', label: 'Max output', group: 'Charging', dim: 'specs', weight: 3, title: true,
      listing: ['Maximum Power Output', 'Output Power', 'Power Output', 'Wattage'], official: ['max output', 'total output', 'output power', 'power output', 'wattage', 'max power', 'output'],
      parse: watts, display: (v) => `${v} W`,
      plausible: (v) => (v <= 300 && v >= 5) || `${v} W output is not plausible for a consumer power bank`,
      points: (v) => (v >= 65 ? 1 : v >= 45 ? 0.9 : v >= 30 ? 0.8 : v >= 22.5 ? 0.7 : v >= 18 ? 0.55 : v >= 12 ? 0.4 : 0.25) },
    { key: 'input', label: 'Max input (recharge)', group: 'Charging', dim: 'specs', weight: 1,
      listing: ['Input Power', 'Input', 'Power Input', 'Charging Input'], official: ['max input', 'input power', 'input'],
      parse: watts, display: (v) => `${v} W`, plausible: (v) => (v <= 200 && v >= 5) || `${v} W input is not plausible`,
      points: (v) => (v >= 45 ? 1 : v >= 30 ? 0.85 : v >= 18 ? 0.7 : v >= 12 ? 0.5 : 0.3) },
    { key: 'ports', label: 'Output ports', group: 'Charging', dim: 'specs', weight: 1,
      listing: ['Number of Output Ports', 'Output Ports', 'Number of Ports'], official: ['output ports', 'number of ports', 'ports'],
      parse: (s) => { const n = portCount(s); return n !== null && n >= 1 && n <= 8 ? n : null; }, display: (v) => `${v} port${v > 1 ? 's' : ''}`,
      points: (v) => (v >= 3 ? 1 : v === 2 ? 0.7 : 0.4) },
    { key: 'connectors', label: 'Connectors', group: 'Charging', dim: 'specs', weight: 1.5, title: true,
      listing: ['Connectors', 'Connector Type', 'Output Connector', 'Port Type'], official: ['connectors', 'ports', 'output ports', 'interface', 'connector'],
      parse: (s) => allOf(s, CONNECTORS), display: (v) => v.map((c) => ({ 'usb-c': 'USB-C', 'usb-a': 'USB-A', 'micro-usb': 'Micro-USB', lightning: 'Lightning' })[c]).join(', '),
      points: (v) => (v.includes('usb-c') ? 1 : 0.4) },
    { key: 'protocols', label: 'Fast-charge protocols', group: 'Charging', dim: 'specs', weight: 2, title: true,
      listing: ['Charging Type', 'Fast Charging Technology', 'Charging Technology', 'Fast Charging'], official: ['protocol', 'fast charging', 'charging technology', 'compatible protocols', 'charging type'],
      parse: (s) => allOf(s, PROTOCOLS), display: (v) => v.map((p) => ({ pd: 'USB PD', qc: 'Quick Charge', pps: 'PPS', scp: 'SCP', vooc: 'VOOC / Dart', fast: 'Fast charging (unspecified)' })[p]).join(', '),
      points: (v) => Math.min(1, (v.includes('pd') ? 0.6 : 0) + (v.includes('qc') ? 0.2 : 0) + (v.includes('pps') ? 0.2 : 0) + (v.includes('scp') || v.includes('vooc') ? 0.1 : 0) + (v.length === 1 && v[0] === 'fast' ? 0.3 : 0)) },
    { key: 'cell', label: 'Cell chemistry', group: 'Battery', dim: 'specs', weight: 1, title: true,
      listing: ['Battery Type', 'Cell Type', 'Battery Cell Type'], official: ['battery type', 'cell type', 'cell', 'battery'],
      parse: (s) => oneOf(s, CELLS), display: (v) => ({ 'li-polymer': 'Lithium polymer', 'li-ion': 'Lithium-ion', lifepo4: 'LiFePO4' })[v],
      points: (v) => (v === 'li-ion' ? 0.8 : 1) },
    { key: 'weight', label: 'Weight', group: 'Build', dim: 'specs', weight: 1,
      listing: ['Weight', 'Net Weight', 'Item Weight'], official: ['weight', 'net weight'],
      parse: grams, display: (v) => `${v} g`, plausible: (v) => (v >= 60 && v <= 3000) || `${v} g is not a plausible power-bank weight`,
      points: () => 0.8 },
    { key: 'display', label: 'Charge indicator', group: 'Build', dim: 'specs', weight: 0.5,
      listing: ['Display', 'Power Indicator', 'LED Indicator', 'Battery Indicator'], official: ['display', 'indicator', 'battery indicator'],
      parse: (s) => (yesNo(s) !== null ? yesNo(s) : /led|digital|display|indicator|%/i.test(s) ? true : null), display: (v) => (v ? 'Yes' : 'No'),
      points: (v) => (v ? 1 : 0.3) },
    { key: 'passthrough', label: 'Pass-through charging', group: 'Charging', dim: 'specs', weight: 0.5,
      listing: ['Pass Through Charging', 'Pass-through Charging', 'Charge While Charging'], official: ['pass-through', 'pass through', 'charge while charging'],
      parse: yesNo, display: (v) => (v ? 'Yes' : 'No'), points: (v) => (v ? 1 : 0.3) },
    { key: 'protections', label: 'Circuit protections', group: 'Safety', dim: 'safety', weight: 3,
      listing: ['Protection', 'Safety Features', 'Protections', 'Other Features', 'Key Features'], official: ['protection', 'safety', 'protections', 'safety features'],
      parse: (s) => allOf(s, PROTECTIONS), display: (v) => v.map((p) => p.replace('-', ' ')).join(', '),
      points: (v) => Math.min(1, v.length / 4) },
    { key: 'bis', label: 'BIS registration (IS 13252)', group: 'Safety', dim: 'safety', weight: 2,
      listing: ['BIS Certified', 'BIS Registration', 'Certification', 'Certifications', 'Safety Certification'], official: ['bis', 'certification', 'certifications', 'compliance', 'is 13252'],
      parse: (s) => (/\bbis\b|is\s*13252|r-\d{6,}/i.test(s) ? true : yesNo(s)), display: (v) => (v ? 'Stated' : 'Not stated'), points: (v) => (v ? 1 : 0) },
    { key: 'warranty', label: 'Warranty', group: 'Support', dim: 'maker', weight: 0, title: true,
      listing: ['Warranty Summary', 'Warranty', 'Domestic Warranty', 'Warranty Period'], official: ['warranty', 'warranty period'],
      parse: warrantyMonths, display: (v) => (v % 12 === 0 ? `${v / 12} year${v > 12 ? 's' : ''}` : `${v} months`), plausible: (v) => (v <= 60 && v >= 1) || `${v} months warranty is not plausible` },
  ],
  // Maker pages that publish prose instead of a spec table: only unambiguous statements are lifted into the kv map
  // (keys carry "(page text)" so the sheet shows where the value came from). Anything ambiguous stays absent.
  officialProse: {
    'capacity (page text)': (t) => { const all = [...new Set([...t.matchAll(/(\d{1,3}(?:,?\d{3})+|\d{4,5})\s*m\s*ah\b/gi)].map((m) => m[1].replace(/,/g, '')))]; return all.length === 1 ? `${all[0]} mAh` : null; },
    'warranty (page text)': (t) => { const m = /(\d+)\s*[-\s]?(months?|years?)\s*(?:of\s*)?(?:brand\s*|manufacturer'?s?\s*|domestic\s*)?warranty/i.exec(t) || /warranty\s*(?:of|:)?\s*(\d+)\s*[-\s]?(months?|years?)/i.exec(t); return m ? `${m[1]} ${m[2]}` : null; },
    'battery type (page text)': (t) => { const m = /\b(lithium[-\s]?polymer|li[-\s]?po(?:lymer)?|lithium[-\s]?ion|li[-\s]?ion|lifepo4)\b/i.exec(t); return m ? m[1] : null; },
    'protections (page text)': (t) => { const hits = ['short circuit', 'over charge', 'over-charge', 'overcharge', 'over discharge', 'over-discharge', 'over current', 'over-current', 'overcurrent', 'over voltage', 'over-voltage', 'overvoltage', 'surge', 'temperature', 'overheat'].filter((w) => new RegExp(w.replace(/[-\s]/g, '[-\\s]?') + '\\s*protect', 'i').test(t)); return hits.length ? hits.join(', ') : null; },
  },
  facets: [
    { group: 'cap', label: 'Capacity', hint: 'As stated (maker page, spec table or title); implausible values shown separately', of: (F) => (F.capacity ? (F.capacity.tier === 'rejected' ? 'implausible' : capClass(F.capacity.value)) : null),
      labels: { pocket: 'Under 10,000 mAh', daily: '10,000–19,999 mAh', travel: '20,000 mAh +', implausible: 'Implausible claim (rejected)' } },
    { group: 'out', label: 'Max output', hint: 'Watts stated for the strongest port', of: (F) => (F.output && F.output.tier !== 'rejected' ? (F.output.value >= 65 ? '65w' : F.output.value >= 30 ? '30w' : F.output.value >= 20 ? '20w' : 'lt20w') : null),
      labels: { '65w': '65 W and above (laptop-class)', '30w': '30–64 W', '20w': '20–29 W', lt20w: 'Under 20 W' } },
    { group: 'port', label: 'Connectors', hint: 'Every stated connector type', multi: true, of: (F) => (F.connectors ? F.connectors.value : null),
      labels: { 'usb-c': 'USB-C', 'usb-a': 'USB-A', 'micro-usb': 'Micro-USB', lightning: 'Lightning' } },
    { group: 'proto', label: 'Fast-charge protocol', hint: 'Named standards only; "fast charging" alone is unspecified', multi: true, of: (F) => (F.protocols ? F.protocols.value.filter((p) => p !== 'fast') : null),
      labels: { pd: 'USB Power Delivery', qc: 'Qualcomm Quick Charge', pps: 'PPS', scp: 'Huawei SCP', vooc: 'VOOC / Dart / Warp' } },
    { group: 'cell', label: 'Cell chemistry', hint: '', of: (F) => (F.cell ? F.cell.value : null), labels: { 'li-polymer': 'Lithium polymer', 'li-ion': 'Lithium-ion', lifepo4: 'LiFePO4' } },
    { group: 'prot', label: 'Protections', hint: 'Named circuit protections', multi: true, of: (F) => (F.protections ? F.protections.value : null),
      labels: { 'short-circuit': 'Short-circuit', 'over-charge': 'Over-charge', 'over-discharge': 'Over-discharge', 'over-current': 'Over-current', 'over-voltage': 'Over-voltage / surge', temperature: 'Temperature' } },
    { group: 'bis', label: 'BIS registration', hint: 'IS 13252 registration stated', of: (F) => (F.bis && F.bis.value ? 'yes' : null), labels: { yes: 'BIS registration stated' } },
  ],
  featured: ['seg:travel', 'seg:daily', 'out:65w', 'out:30w', 'port:usb-c', 'proto:pd', 'proto:qc', 'cell:li-polymer', 'prot:short-circuit', 'bis:yes', 'ev:official', 'maker:global', 'maker:india'],
  lines: {
    q: (F) => [F.capacity && F.capacity.tier !== 'rejected' ? F.capacity.display : null, F.output && F.output.tier !== 'rejected' ? F.output.display : null].filter(Boolean).join(' · '),
    f: (F) => [F.connectors ? F.connectors.display : null, F.protocols ? F.protocols.display.replace('Fast charging (unspecified)', 'fast charging') : null, F.cell ? F.cell.display : null].filter(Boolean).join(' · '),
  },
};
