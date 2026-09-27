// Headlamps (head torches) — island power cuts, unlit beach paths, pre-dawn boat transfers. Hands-free light
// scored on the numbers a maker page or spec table states: lumens, battery, runtime, charging port, water rating.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const T = require('../lib/trip.cjs');
const { num, mah, oneOf, yesNo, warrantyMonths } = require('../lib/parse.cjs');

const lumens = (s) => { const m = /(\d{2,5})\s*(?:lm|lumens?)\b/i.exec(String(s)); if (m) return Number(m[1]); const n = num(s); return /lumen|lm\b/i.test(String(s)) && n ? n : null; };
const hours = (s) => { const t = String(s); const m = /(\d+(?:\.\d+)?)\s*(?:-|–|to)?\s*(\d+(?:\.\d+)?)?\s*(?:h|hrs?|hours?)\b/i.exec(t); if (!m) return null; return Number(m[2] || m[1]); };
const metres = (s) => { const m = /(\d{2,4})\s*(?:m|mtrs?|meters?|metres?)\b/i.exec(String(s)); return m ? Number(m[1]) : null; };
const POWER = [['rechargeable', /rechargeable|li[-\s]?ion|lithium|18650|21700|polymer|built[-\s]?in\s*battery|usb/i], ['aaa', /\baaa\b|\baa\b|alkaline|dry\s*cell|pencil\s*cell|cr2032|button\s*cell/i]];
const PORT = [['usb-c', /type[-\s]?c|usb[-\s]?c\b/i], ['micro', /micro[-\s]?usb/i], ['magnetic', /magnetic/i], ['usb', /\busb\b/i]];
const IP = /\bip\s?([x0-9])([0-9])\b/i;
const ipRating = (s) => { const m = IP.exec(String(s)); if (!m) return null; return `IP${m[1].toUpperCase()}${m[2]}`; };
const ipPoints = (v) => { const w = Number(v[3]); return w >= 7 ? 1 : w >= 6 ? 0.9 : w >= 5 ? 0.8 : w >= 4 ? 0.7 : 0.4; };
// "red light mode" in prose, or "Red" as its own entry in a maker's list of lighting types (never the body colour).
const RED = /red\s*(?:light|led|mode|beam|night)|(?:^|,)\s*red\s*(?:,|$)/i;
const SENSOR = /wave|motion\s*sensor|gesture|sensor\s*(?:mode|switch|control)|induction\s*(?:switch|sensor)/i;
const VEHICLE = /(?:car|bike|motorcycle|scooter|scooty|bicycle|cycle|auto)\s*(?:head\s*)?(?:light|lamp|led)s?\b|for\s*(?:cars?|bikes?|motorcycles?|scooters?|bullet|royal\s*enfield|splendor|activa|pulsar|apache|classic\s*350|bicycles?|cycles?|tractors?|trucks?)\b|\bh4\b|\bh7\b|\bh11\b|9005|9006|\bhid\b|halogen|projector|fog\s*lamp|headlight\s*(?:assembly|glass|cover|bulb|restoration|visor|protector|film|sticker)|headlamp\s*(?:assembly|glass|cover|bulb|restoration|visor|protector|film)|\bdrl\b|xenon|bulbs?\s*for|royal\s*enfield|enfield|\bbullet\s*350|classic\s*350|hunter\s*350|meteor\s*350|himalayan|splendor|activa|pulsar|apache|\bktm\b|dominar|xpulse|ntorq|\br15\b|\bmt\s*15\b|\bdio\b|burgman|gixxer|intruder|maruti|hyundai|mahindra|toyota|\bswift\b|\balto\b|wagon\s*r\b|\bcreta\b|\bi20\b|\bi10\b|\bnexon\b|\bscorpio\b|\bbolero\b|\binnova\b|fortuner|\bbrezza\b|\bertiga\b|\bbaleno\b|\bverna\b|\bseltos\b|\bsonet\b|\bkia\b|\bxuv\b|\bharrier\b|\baltroz\b|\btigor\b|\bciaz\b|\bdzire\b|\bcelerio\b|\bignis\b|\beeco\b|\bxl6\b|grand\s*vitara|\bjimny\b|\bfronx\b|\bexter\b|\bsantro\b|\bcarens\b|\bcarnival\b/i;

export default {
  id: 'headlamps',
  label: 'Headlamp torch',
  kicker: 'LIGHT',
  family: 'trip',
  brandStore: true,
  collapseVariants: true,
  unit: 'headlamp',
  blurb: 'LED headlamps / head torches on Flipkart and Amazon.in — scored on the lumens, battery type and capacity, runtime, charging port, beam distance, red-light mode, weight and IP water rating a maker page or the marketplace spec table states. Vehicle headlights and bulbs never enter; "super bright 10000 W" in a title earns nothing.',
  sources: { flipkart: ['lk2_fk_pages.0.json', 'lk2_fk_pages.1.json', 'lk2_fk_pages.2.json'], amazon: ['lk2_amz_pages.json', 'lk2_amz_pages.rev.json', 'lk2_amz_pages.mid.json'] },
  include: T.includer({
    strong: /head\s*-?\s*lamps?\b|(?:led\s*)?head\s*-?\s*lights?\b(?=.*(?:torch|rechargeable|lumen|led|battery|camping|trekking|hiking|fishing|adjustable|modes?|cob|sensor|waterproof))|head\s*-?\s*torch(?:es)?|head\s*-?\s*(?:mount(?:ed)?|band|wear(?:able)?|strap)\b[^|,]{0,30}?(?:torch|light|lamp)|head\s*flash\s*-?\s*light|head\s*-?\s*lights?\s*(?:with|torch|led|rechargeable|waterproof|cob|sensor)|(?:led\s*)?head\s*-?\s*lights?\s*(?:torch|for\s*(?:camping|trekking|hiking|fishing|running|cycling|reading|night|outdoor|repair|mining|work))|(?:camping|trekking|hiking|fishing|running|outdoor|rechargeable|cob|sensor|induction)\s*(?:led\s*)?head\s*-?\s*lights?\b|headlight\s*(?:led\s*)?(?:rechargeable|torch|cob)/i,
    hard: new RegExp(`${VEHICLE.source}|cap\\s*(?:clip\\s*)?light|clip[-\\s]?on\\s*cap|toy|kids?\\s*(?:toy|projector)|book\\s*light|reading\\s*lamp\\s*(?!.*head)|for\\s*helmet\\s*(?!.*head\\s*lamp)|welding|dental|surgical|loupe|magnif|binocular|night\\s*vision\\s*(?:goggles?|scope|binocular|camera|device)|hunting\\s*scope|lantern\\s*(?!.*head)|table\\s*lamp|study\\s*lamp|emergency\\s*light\\s*(?!.*head)|solar\\s*(?:panel|street|garden)|battery\\s*only|charger\\s*only|strap\\s*only|holder\\s*only|mount\\s*only`, 'i'),
  }),
  segment: {
    key: 'seg', label: 'Power',
    options: [
      { id: 'rechargeable', label: 'Rechargeable (built-in / li-ion)' },
      { id: 'aaa', label: 'AAA / AA cells' },
      { id: 'unstated', label: 'Power not stated' },
    ],
    of: (F) => (F.power && F.power.tier !== 'claimed' ? F.power.value : F.port && F.port.tier !== 'claimed' ? 'rechargeable' : 'unstated'),
  },
  fields: [
    { key: 'lumens', label: 'Brightness (lumens)', group: 'Light', dim: 'specs', weight: 3, title: true,
      listing: ['Lumens', 'Brightness', 'Light Output', 'Luminous Flux', 'Lumen', 'Max Brightness', 'Brightness (Lumens)', 'Light Intensity', 'Luminous Intensity'], official: ['lumens', 'brightness', 'light output', 'luminous flux', 'max output'],
      parse: lumens, display: (v) => `${v.toLocaleString('en-IN')} lm`, plausible: (v) => (v >= 20 && v <= 3000) || `${v} lm is not a plausible headlamp output (20–3,000)`, points: (v) => (v >= 300 ? 1 : v >= 150 ? 0.9 : v >= 80 ? 0.75 : 0.5) },
    { key: 'power', label: 'Power source', group: 'Battery', dim: 'specs', weight: 2, title: true,
      listing: ['Power Source', 'Battery Type', 'Battery', 'Battery Cell Type', 'Power Type', 'Type of Battery', 'Battery Cell Composition', 'Rechargeable', 'Battery Description'], official: ['battery', 'power source', 'rechargeable', 'cell'],
      parse: (s) => oneOf(s, POWER) || (yesNo(s) === true ? 'rechargeable' : null), display: (v) => (v === 'rechargeable' ? 'Rechargeable (built-in / li-ion)' : 'AAA / AA cells'), points: (v) => (v === 'rechargeable' ? 1 : 0.7) },
    { key: 'capacity', label: 'Battery capacity', group: 'Battery', dim: 'specs', weight: 1.5, title: true,
      listing: ['Battery Capacity', 'Capacity', 'Battery Capacity (mAh)', 'Battery', 'Battery Power Rating'], official: ['capacity', 'mah', 'battery capacity'],
      parse: mah, display: (v) => `${v.toLocaleString('en-IN')} mAh`, plausible: (v) => (v >= 200 && v <= 12000) || `${v} mAh is not a plausible headlamp battery (200–12,000)`, points: (v) => (v >= 2000 ? 1 : v >= 1200 ? 0.9 : v >= 800 ? 0.75 : 0.6) },
    { key: 'runtime', label: 'Runtime (max stated)', group: 'Battery', dim: 'specs', weight: 2, title: true,
      listing: ['Runtime', 'Run Time', 'Battery Life', 'Backup Time', 'Working Time', 'Usage Time', 'Battery Backup', 'Lighting Time', 'Burn Time', 'Operating Time'], official: ['runtime', 'run time', 'battery life', 'burn time', 'autonomy'],
      parse: hours, display: (v) => `${v} h`, plausible: (v) => (v >= 1 && v <= 300) || `${v} h is not a plausible runtime (1–300)`, points: (v) => (v >= 12 ? 1 : v >= 6 ? 0.85 : v >= 3 ? 0.7 : 0.5) },
    { key: 'port', label: 'Charging port', group: 'Battery', dim: 'specs', weight: 1, title: true,
      listing: ['Charging Port', 'Charging Type', 'Connector Type', 'Charging Interface', 'Charger Type', 'Input', 'Connectivity'], official: ['charging', 'port', 'usb-c', 'type-c', 'micro usb'],
      parse: (s) => oneOf(s, PORT), display: (v) => ({ 'usb-c': 'USB-C', micro: 'Micro-USB', magnetic: 'Magnetic', usb: 'USB (type not stated)' })[v], points: (v) => (v === 'usb-c' ? 1 : v === 'magnetic' ? 0.9 : v === 'micro' ? 0.7 : 0.6) },
    { key: 'beam', label: 'Beam distance', group: 'Light', dim: 'specs', weight: 1, title: true,
      listing: ['Beam Distance', 'Range', 'Lighting Distance', 'Light Range', 'Throw', 'Beam Range', 'Irradiation Distance', 'Illumination Distance'], official: ['beam distance', 'range', 'throw', 'distance'],
      parse: metres, display: (v) => `${v} m`, plausible: (v) => (v >= 10 && v <= 600) || `${v} m is not a plausible beam distance (10–600)`, points: (v) => (v >= 100 ? 1 : v >= 50 ? 0.85 : 0.7) },
    T.feature('red', 'Red-light mode', 'Light', RED, { weight: 1, listing: ['Light Modes', 'Modes', 'Lighting Modes', 'Light Color', 'Light Colour', 'Colour Of Light', 'Color Of Light', 'Features', 'Special Feature', 'Other Details', 'Additional Features'], official: ['red light', 'red mode', 'red led', 'lighting types', 'light modes', 'modes'], noPts: 0.4 }),
    T.feature('sensor', 'Wave / motion sensor switch', 'Light', SENSOR, { weight: 0.5, listing: ['Sensor', 'Motion Sensor', 'Switch Type', 'Features', 'Special Feature', 'Other Details', 'Additional Features'], official: ['sensor', 'wave', 'gesture'], noPts: 0.6 }),
    { key: 'modes', label: 'Light modes (count)', group: 'Light', dim: 'specs', weight: 0.5, title: true,
      listing: ['Light Modes', 'Modes', 'Lighting Modes', 'Number of Modes', 'Number Of Modes', 'Mode'], official: ['modes', 'lighting modes', 'lighting types'],
      // "6 modes" / "Modes: 3", else a spec row that lists the modes by name ("White wide, Red, Flash/SOS…") is counted.
      parse: (s) => { const t = String(s); const m = /(\d)\s*(?:light(?:ing)?\s*)?modes?\b/i.exec(t) || /modes?\s*[:-]?\s*(\d)\b/i.exec(t); let n = m ? Number(m[1]) : null; if (!n && /,/.test(t) && !/\d\s*(?:lm|lumens?|mah|h\b)/i.test(t)) n = t.split(/,|\s+\/\s+/).map((x) => x.trim()).filter(Boolean).length; return n && n >= 1 && n <= 9 ? n : null; }, display: (v) => `${v} modes`, points: (v) => (v >= 3 ? 1 : 0.7) },
    T.weightField({ min: 20, max: 700, light: 90, mid: 150, label: 'Weight (as stated)' }),
    { key: 'ip', label: 'Water / dust rating (IP)', group: 'Protection', dim: 'safety', weight: 4, title: true,
      listing: ['Water Resistance', 'Water Resistant', 'Waterproof', 'IP Rating', 'Ip Rating', 'Water Resistance Level', 'Protection Rating', 'Waterproof Rating', 'Weather Resistance', 'Special Feature', 'Features', 'Other Details', 'Additional Features'], official: ['ip rating', 'ipx', 'ip6', 'ip5', 'ip4', 'water resistance', 'waterproof'],
      parse: ipRating, display: (v) => v, points: ipPoints },
    T.feature('water', 'Water resistance stated (no IP code)', 'Protection', /water[-\s]?(?:proof|resist|repellent)|rain[-\s]?proof|splash[-\s]?proof|weather[-\s]?(?:proof|resist)/i, { dim: 'safety', weight: 1.5, listing: ['Water Resistance', 'Water Resistant', 'Waterproof', 'Water Resistance Level', 'Weather Resistance', 'Special Feature', 'Features', 'Other Details', 'Additional Features'], official: ['water resistant', 'waterproof', 'splash'], noPts: 0.2 }),
    T.feature('lowbatt', 'Low-battery indicator / lock-out', 'Protection', /battery\s*(?:indicator|level|status|display)|power\s*indicator|charge\s*indicator|low[-\s]?battery|lock[-\s]?(?:out|mode)|reserve\s*mode/i, { dim: 'safety', weight: 1, listing: ['Indicator', 'Battery Indicator', 'Features', 'Special Feature', 'Other Details', 'Additional Features'], official: ['indicator', 'lock', 'reserve', 'lighting types'], noPts: 0.3 }),
    T.feature('cert', 'Safety certification stated (BIS / CE / RoHS)', 'Protection', /\bbis\b|\bce\b|\brohs\b|\bfcc\b|\bul\b|\bis\s*\d{4,5}\b|certif/i, { dim: 'safety', weight: 1, listing: ['Certification', 'Certifications', 'Standards', 'Safety Standard', 'Compliance'], official: ['certif', 'bis', 'ce', 'rohs'], noPts: 0 }),
    { key: 'warranty', label: 'Warranty', group: 'Support', dim: 'maker', weight: 0, title: true,
      listing: ['Warranty Summary', 'Warranty', 'Domestic Warranty', 'Warranty Period', 'Manufacturer Warranty', 'Covered in Warranty'], official: ['warranty', 'warranty period', 'guarantee'],
      parse: warrantyMonths, display: (v) => (v % 12 === 0 ? `${v / 12} year${v > 12 ? 's' : ''}` : `${v} months`), plausible: (v) => (v <= 60 && v >= 1) || `${v} months warranty is not plausible` },
  ],
  match: {
    descriptive: [...T.DESCRIPTIVE, 'headlamp', 'headlamps', 'head', 'lamp', 'torch', 'light', 'lights', 'led', 'rechargeable', 'usb', 'camping', 'trekking', 'hiking', 'fishing', 'running', 'outdoor', 'bright', 'super', 'ultra', 'high', 'power', 'powerful', 'zoomable', 'zoom', 'adjustable', 'sensor', 'motion', 'cob', 'lumens', 'lumen', 'lm', 'mah', 'battery', 'modes', 'mode', 'red', 'white', 'strap', 'band'],
    bundleNouns: ['torch', 'lantern', 'tent', 'knife', 'batteries', 'charger', 'power bank'],
    numeric: [
      { label: 'lumens', show: (v) => `${v} lm`, tol: 0.1, listing: (l) => lumens(`${l.title} ${(l.listingSpec || {}).Lumens || (l.listingSpec || {}).Brightness || ''}`), catalog: (c) => lumens(`${c.title} ${c.kv.Lumens || c.kv.Brightness || c.kv['Max Output'] || ''}`) },
    ],
  },
  officialProse: {
    'lumens (page text)': (t) => { const m = /(\d{2,4})\s*(?:lm|lumens?)\b/i.exec(t); return m ? m[0] : null; },
    'battery (page text)': (t) => { const m = /(\d{3,5})\s*mah/i.exec(t); return m ? m[0] : /\baaa\b/i.test(t) ? 'AAA' : /rechargeable/i.test(t) ? 'Rechargeable' : null; },
    'runtime (page text)': (t) => { const m = /(?:up\s*to\s*)?(\d+(?:\.\d+)?)\s*(?:h|hrs?|hours?)\b/i.exec(t); return m ? m[0] : null; },
    'ip rating (page text)': (t) => ipRating(t),
    'charging (page text)': (t) => { const m = /(type[-\s]?c|usb[-\s]?c|micro[-\s]?usb|magnetic\s*charg\w*)/i.exec(t); return m ? m[1] : null; },
    'beam distance (page text)': (t) => { const m = /(\d{2,3})\s*(?:m|metres?|meters?)\b/i.exec(t); return m ? m[0] : null; },
    'red light (page text)': (t) => (RED.test(t) ? 'Yes' : null),
    'weight (page text)': (t) => { const m = /(\d{2,3})\s*(?:g|gm|grams?)\b/i.exec(t); return m ? m[0] : null; },
  },
  facets: [
    { group: 'power', label: 'Power', hint: 'Built-in rechargeable vs replaceable cells', of: (F) => (F.power && F.power.tier !== 'claimed' ? F.power.value : null), labels: { rechargeable: 'Rechargeable', aaa: 'AAA / AA cells' } },
    { group: 'lm', label: 'Brightness', hint: 'Stated lumens, spec row or maker page', of: (F) => (F.lumens && F.lumens.tier !== 'claimed' && F.lumens.tier !== 'rejected' ? (F.lumens.value >= 300 ? '300' : F.lumens.value >= 150 ? '150' : '0') : null), labels: { 300: '300 lm +', 150: '150–299 lm', 0: 'Under 150 lm' } },
    { group: 'ip', label: 'Water rating', hint: 'IP code stated', of: (F) => (F.ip && F.ip.tier !== 'claimed' ? (Number(F.ip.value[3]) >= 7 ? 'ipx7' : Number(F.ip.value[3]) >= 5 ? 'ipx5' : 'ipx4') : null), labels: { ipx7: 'IPX7 / IP67 + (immersion)', ipx5: 'IPX5 / IPX6 (jets)', ipx4: 'IPX4 or lower (splash)' } },
    { group: 'port', label: 'Charging', hint: '', of: (F) => (F.port && F.port.tier !== 'claimed' ? F.port.value : null), labels: { 'usb-c': 'USB-C', micro: 'Micro-USB', magnetic: 'Magnetic', usb: 'USB (type not stated)' } },
    { group: 'fx', label: 'Stated features', hint: 'Spec row or maker page', multi: true,
      of: (F) => [F.red && F.red.value && F.red.tier !== 'claimed' ? 'red' : null, F.sensor && F.sensor.value && F.sensor.tier !== 'claimed' ? 'sensor' : null, F.runtime && F.runtime.tier !== 'claimed' && F.runtime.tier !== 'rejected' ? 'runtime' : null, F.lowbatt && F.lowbatt.value && F.lowbatt.tier !== 'claimed' ? 'lowbatt' : null].filter(Boolean),
      labels: { red: 'Red-light mode', sensor: 'Wave sensor', runtime: 'Runtime stated', lowbatt: 'Battery indicator' } },
  ],
  featured: ['seg:rechargeable', 'seg:aaa', 'ip:ipx7', 'ip:ipx5', 'lm:300', 'port:usb-c', 'fx:red', 'fx:runtime', 'ev:official', 'maker:global', 'maker:india'],
  lines: {
    q: (F) => [F.lumens && F.lumens.tier !== 'rejected' ? F.lumens.display : null, F.ip ? F.ip.display : null, F.runtime && F.runtime.tier !== 'rejected' ? `${F.runtime.display} runtime` : null].filter(Boolean).join(' · '),
    f: (F) => [F.power ? (F.power.value === 'rechargeable' ? (F.capacity && F.capacity.tier !== 'rejected' ? `${F.capacity.display} rechargeable` : 'rechargeable') : 'AAA / AA') : null, F.port ? F.port.display : null, F.red && F.red.value ? 'red light' : null, F.weight && F.weight.tier !== 'rejected' ? F.weight.display : null].filter(Boolean).join(' · '),
  },
};
