// Beach water shoes — closed-toe footwear for reef flats, coral rubble, boat steps and wet sand. NOT waterproof
// shoes: a "waterproof sneaker", trekking boot, gumboot or PVC rain shoe keeps water out; a water shoe lets it
// drain and grips when wet. Titles that only say "waterproof" never pass the gate.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const T = require('../lib/trip.cjs');
const { oneOf, yesNo, warrantyMonths } = require('../lib/parse.cjs');

const UPPER = [['neoprene', /neoprene/i], ['mesh', /mesh|knit|breathable\s*fabric|air\s*mesh/i], ['lycra', /lycra|spandex|elastane|stretch\s*fabric|polyester|nylon|textile|fabric/i], ['synthetic', /synthetic|\bpu\b|\btpu\b|rubber|eva/i]];
const CLOSURE = [['bungee', /bungee|drawstring|draw\s*string|toggle|elastic\s*lace|quick\s*lace/i], ['lace', /lace/i], ['velcro', /velcro|hook\s*(?:and|&)\s*loop|strap/i], ['slip', /slip[-\s]?on|pull[-\s]?on|elastic|sock/i], ['zip', /zip/i]];
// The form is read from the title only (identity, unscored): an "aqua sock" is a lycra slipper with a thin film
// sole, a water shoe has a real outsole. The segment keeps them apart so a sock never tops the shoe list.
const HARD = /water\s*-?\s*proof|water\s*-?\s*resist|rain\s*(?:shoes?|boots?|wear|covers?)|gum\s*-?\s*boots?|safety\s*(?:shoes?|boots?)|pvc\s*(?:safety\s*)?(?:shoes?|boots?)|trekking\s*(?:shoes?|boots?)|hiking\s*(?:shoes?|boots?)|shoe\s*covers?|slippers?\b|sandals?\b|flip\s*-?\s*flops?|floaters?|crocs|clogs?\b|sliders?\b|insoles?|cotton\s*socks|ankle\s*socks|yoga\s*socks|grip\s*socks|pilates|trampoline|shoe\s*(?:bags?|racks?|dryers?)|flippers?|\bfins?\b|water\s*(?:bottle|gun|park\s*ticket)|for\s*(?:dogs?|pets?)|cycling|motorcycle|bath(?:room)?\s*(?:slipper|shoe)|shower\s*(?:shoe|slipper)/i;
// A running / casual sneaker with "water sport shoes" tacked on is still a sneaker unless the title also names a wet use.
const SNEAKER = /running\s*(?:shoes?|sneakers?|casual)|casual\s*(?:,\s*)?(?:sports\s*)?(?:shoes?|sneakers?)/i;
const WET_USE = /aqua|beach|swim|snorkel|reef|surf|kayak|river|barefoot|quick[-\s]?dry|drain|neoprene|diving|scuba/i;
const FORM = [['sock', /aqua\s*socks?|swim(?:ming)?\s*socks?|water\s*socks?|beach\s*socks?|neoprene\s*socks?|diving\s*socks?|snorkel(?:l?ing)?\s*socks?|fin\s*socks?/i], ['shoe', /shoes?|boot(?:ie)?s?|footwear|sneakers?/i]];
const DRAIN = /drain|water\s*(?:flow|outlet|out\s*flow)|breathable\s*holes?|holes?\s*(?:on|in)\s*(?:the\s*)?sole|perforated\s*sole|lets?\s*water\s*out|water\s*(?:escape|release)/i;
const TOE = /closed[-\s]?toe|toe\s*(?:cap|guard|bumper|protect|cover)|protective\s*toe|reinforced\s*toe|rubber\s*toe|covered\s*toe/i;
const GRIP = /anti[-\s]?(?:skid|slip)|slip[-\s]?resist|non[-\s]?slip|traction|grip|lugs?\b|wet\s*grip|studded\s*sole/i;
const QUICKDRY = /quick[-\s]?dry(?:ing)?|fast[-\s]?dry|dr(?:y|ies)\s*(?:fast|quickly)|drying\s*time/i;
// A sole the maker measures ("6 mm", "5 mm-thick studded sole") is a real outsole, whatever its material is called.
const THICK = /thick(?:er|ened)?\s*(?:\w+\s*){0,2}sole|\d(?:\.\d+)?\s*mm[-\s]*thick|puncture|sharp\s*(?:rocks?|stones?|shells?|coral)|stone\s*(?:proof|protection)|protects?\s*(?:your\s*)?(?:feet|foot|sole)s?\s*from/i;
const MM = /^\s*\d+(?:\.\d+)?\s*(?:mm|cm)\s*$/i;

export default {
  id: 'water-shoes',
  label: 'Beach water shoes',
  kicker: 'REEF',
  family: 'trip',
  brandStore: true,
  collapseVariants: true,
  unit: 'water shoe',
  blurb: 'Aqua / beach / snorkelling shoes on Flipkart and Amazon.in — scored on the outsole material, closed toe, drainage, wet-surface grip, upper and closure a maker page or the marketplace spec table states. "Waterproof shoes", trekking boots, gumboots and rain shoes are a different product and never enter this list; thin aqua socks are kept apart in their own segment.',
  sources: { flipkart: ['lk2_fk_pages.0.json', 'lk2_fk_pages.1.json', 'lk2_fk_pages.2.json'], amazon: ['lk2_amz_pages.json', 'lk2_amz_pages.rev.json', 'lk2_amz_pages.mid.json'] },
  include: T.includer({
    strong: /aqua\s*(?:shoes?|socks?|footwear|sneakers?|boot(?:ie)?s?)|aquashoes?|water\s*(?:sports?\s*)?(?:shoes?|socks?|footwear|sneakers?)|beach\s*(?:shoes?|socks?|footwear|sneakers?)|swim(?:ming)?\s*(?:shoes?|socks?|footwear)|snorkel(?:l?ing)?\s*(?:shoes?|boot(?:ie)?s?|socks?)|reef\s*(?:shoes?|boot(?:ie)?s?|walkers?|socks?)|wet\s*(?:shoes?|socks?)|neoprene\s*(?:socks?|boot(?:ie)?s?|shoes?)|diving\s*(?:socks?|boot(?:ie)?s?|shoes?)|scuba\s*(?:socks?|boot(?:ie)?s?|shoes?)|surf(?:ing)?\s*(?:shoes?|boot(?:ie)?s?|socks?)|kayak(?:ing)?\s*shoes?|river\s*(?:trek(?:king)?\s*)?shoes?|barefoot\s*(?:quick[-\s]?dry\s*)?(?:aqua|water|beach)/i,
    hard: (t) => HARD.test(t) || (SNEAKER.test(t) && !WET_USE.test(t)),
    noKids: true,
  }),
  segment: {
    key: 'seg', label: 'Type',
    options: [
      { id: 'shoe', label: 'Water shoe (outsole named or measured)' },
      { id: 'sock', label: 'Aqua sock (thin sole)' },
      { id: 'unstated', label: 'Sole not stated' },
    ],
    // A stated real outsole (material named, or its thickness measured on the maker page / spec row) makes it a shoe
    // unless a spec row / maker page itself calls it a sock; "aqua socks" stuffed into a title outranks nothing.
    of: (F) => {
      const statedSock = !!F.form && F.form.value === 'sock' && (F.form.tier === 'official' || F.form.tier === 'listing');
      if (F.sole && F.sole.tier !== 'rejected') return ['rubber', 'tpr', 'pu', 'pvc', 'eva'].includes(F.sole.value) && !statedSock ? 'shoe' : 'sock';
      if (F.thick && F.thick.value && (F.thick.tier === 'official' || F.thick.tier === 'listing') && !statedSock) return 'shoe';
      return F.form && F.form.value === 'sock' ? 'sock' : 'unstated';
    },
  },
  fields: [
    { key: 'sole', label: 'Outsole material', group: 'Materials', dim: 'specs', weight: 3, title: true,
      listing: ['Sole material', 'Sole Material', 'Outsole', 'Outsole Material', 'Sole', 'Outer Sole Material'], official: ['outsole', 'sole', 'sole material', 'outsole material'],
      parse: (s) => oneOf(s, T.SOLE), display: (v) => T.SOLE_LABEL[v], points: (v) => (v === 'rubber' ? 1 : v === 'tpr' ? 0.9 : v === 'pu' ? 0.6 : v === 'pvc' ? 0.5 : v === 'eva' ? 0.4 : 0.1) },
    { key: 'upper', label: 'Upper material', group: 'Materials', dim: 'specs', weight: 1.5, title: true,
      listing: ['Outer material', 'Outer Material', 'Upper Material', 'Upper', 'Material', 'Fabric'], official: ['upper', 'upper material', 'outer material', 'material', 'fabric'],
      parse: (s) => oneOf(s, UPPER), display: (v) => ({ neoprene: 'Neoprene', mesh: 'Mesh / knit', lycra: 'Lycra / stretch fabric', synthetic: 'Synthetic' })[v], points: (v) => (v === 'neoprene' ? 1 : v === 'mesh' ? 0.9 : v === 'lycra' ? 0.7 : 0.6) },
    T.feature('drain', 'Drainage (holes / outlets named)', 'Wet use', DRAIN, { weight: 2.5, listing: ['Drainage', 'Sole Features', 'Technology used', 'Technology Used', 'Other Details', 'Features', 'Special Feature', 'Additional Features'], official: ['drain', 'drainage', 'water flow', 'holes'] }),
    { key: 'closure', label: 'Closure', group: 'Fit', dim: 'specs', weight: 1, title: true,
      listing: ['Closure', 'Closure Type', 'Fastening'], official: ['closure', 'lacing', 'fastening', 'tightening'],
      parse: (s) => oneOf(s, CLOSURE), display: (v) => ({ bungee: 'Bungee / drawstring', lace: 'Lace-up', velcro: 'Velcro strap', slip: 'Slip-on / elastic', zip: 'Zip' })[v], points: (v) => (v === 'bungee' ? 1 : v === 'lace' ? 0.9 : v === 'velcro' ? 0.8 : 0.6) },
    T.feature('quickdry', 'Quick-dry upper stated', 'Wet use', QUICKDRY, { weight: 1, listing: ['Quick Dry', 'Technology used', 'Technology Used', 'Other Details', 'Features', 'Special Feature', 'Additional Features', 'Fabric Care'], official: ['quick dry', 'quick-dry', 'dries', 'drying'] }),
    T.weightField({ min: 80, max: 1500, light: 250, mid: 400, label: 'Weight (per shoe / pair as stated)' }),
    { key: 'form', label: 'Form (shoe vs aqua sock)', group: 'Identity', dim: 'specs', weight: 0, title: true,
      listing: ['Type', 'Type For Sports', 'Style', 'Product Type'], official: ['type', 'style'],
      parse: (s) => oneOf(s, FORM), display: (v) => (v === 'sock' ? 'Aqua sock' : 'Shoe / bootie') },
    T.feature('toe', 'Closed / protected toe', 'Protection', TOE, { dim: 'safety', weight: 3, listing: ['Toe Cap', 'Toe Protection', 'Toe Style', 'Technology used', 'Technology Used', 'Other Details', 'Upper Features', 'Features', 'Special Feature', 'Style'], official: ['toe', 'closed toe', 'toe cap', 'toe guard', 'toe protection'], negative: /open[-\s]?toe|peep[-\s]?toe/i }),
    T.feature('grip', 'Anti-slip / wet grip outsole', 'Protection', GRIP, { dim: 'safety', weight: 3, listing: ['Anti Skid', 'Anti-Skid', 'Anti Slip', 'Slip Resistant', 'Sole Features', 'Technology used', 'Technology Used', 'Other Details', 'Features', 'Special Feature'], official: ['anti-skid', 'anti skid', 'anti-slip', 'slip resistant', 'non-slip', 'traction', 'grip'] }),
    { ...T.feature('thick', 'Thick / puncture-resistant sole stated', 'Protection', THICK, { dim: 'safety', weight: 1.5, listing: ['Sole Features', 'Sole Thickness', 'Technology used', 'Technology Used', 'Other Details', 'Features', 'Special Feature'], official: ['thick sole', 'sole thickness', 'outsole thickness', 'puncture', 'sharp'], noPts: 0.3 }),
      parse: (s) => (MM.test(String(s)) ? true : yesNo(s) !== null ? yesNo(s) : THICK.test(String(s)) ? true : null) },
    { key: 'warranty', label: 'Warranty', group: 'Support', dim: 'maker', weight: 0, title: true,
      listing: ['Warranty Summary', 'Warranty', 'Domestic Warranty', 'Warranty Period'], official: ['warranty', 'warranty period'],
      parse: warrantyMonths, display: (v) => (v % 12 === 0 ? `${v / 12} year${v > 12 ? 's' : ''}` : `${v} months`), plausible: (v) => (v <= 36 && v >= 1) || `${v} months warranty is not plausible` },
  ],
  match: {
    descriptive: [...T.DESCRIPTIVE, 'aqua', 'water', 'beach', 'swimming', 'swim', 'snorkeling', 'snorkelling', 'reef', 'shoes', 'shoe', 'socks', 'sock', 'footwear', 'barefoot', 'sports', 'outdoor', 'surf', 'diving', 'kayak', 'yoga', 'mesh', 'neoprene', 'rubber', 'sole', 'closed', 'toe', 'drainage', 'breathable', 'unisex'],
    bundleNouns: ['goggles', 'cap', 'mask', 'snorkel', 'towel', 'bag', 'fins'],
    numeric: [T.wearerNumeric],
  },
  officialProse: {
    'outsole (page text)': (t) => { const m = /([^.\n]{0,25}(?:rubber|tpr|eva)\s*(?:out)?sole[^.\n]{0,30})/i.exec(t); return m ? m[1].trim() : null; },
    'drainage (page text)': (t) => (DRAIN.test(t) ? 'Yes' : null),
    'closed toe (page text)': (t) => (TOE.test(t) ? 'Yes' : null),
    'grip (page text)': (t) => (GRIP.test(t) ? 'Yes' : null),
    'upper (page text)': (t) => { const m = /(?:upper|made\s*(?:of|from|with))\s*:?\s*([^.\n]{3,60})/i.exec(t); return m ? m[1].trim() : null; },
    'weight (page text)': (t) => { const m = /(\d{2,4})\s*(?:g|gm|grams?)\b(?:\s*(?:per|\/)\s*(?:shoe|pair|half\s*pair))?/i.exec(t); return m ? m[0] : null; },
  },
  facets: [
    { group: 'sole', label: 'Outsole', hint: 'Rubber / TPR grips wet rock; EVA alone slips; a lycra "sole" is a sock', of: (F) => (F.sole && F.sole.tier !== 'rejected' ? F.sole.value : null), labels: { rubber: 'Rubber', tpr: 'TPR', eva: 'EVA', pu: 'PU', pvc: 'PVC', fabric: 'Fabric (sock)' } },
    { group: 'upper', label: 'Upper', hint: '', of: (F) => (F.upper ? F.upper.value : null), labels: { neoprene: 'Neoprene', mesh: 'Mesh / knit', lycra: 'Lycra / stretch', synthetic: 'Synthetic' } },
    { group: 'close', label: 'Closure', hint: '', of: (F) => (F.closure ? F.closure.value : null), labels: { bungee: 'Bungee / drawstring', lace: 'Lace-up', velcro: 'Velcro', slip: 'Slip-on', zip: 'Zip' } },
    { group: 'reef', label: 'Reef-ready features', hint: 'Stated in a spec row or on the maker page', multi: true,
      of: (F) => [F.toe && F.toe.value && F.toe.tier !== 'claimed' ? 'toe' : null, F.grip && F.grip.value && F.grip.tier !== 'claimed' ? 'grip' : null, F.drain && F.drain.value && F.drain.tier !== 'claimed' ? 'drain' : null, F.thick && F.thick.value && F.thick.tier !== 'claimed' ? 'thick' : null, F.quickdry && F.quickdry.value && F.quickdry.tier !== 'claimed' ? 'quickdry' : null].filter(Boolean),
      labels: { toe: 'Closed / protected toe', grip: 'Anti-slip outsole', drain: 'Drainage named', thick: 'Thick / puncture-resistant sole', quickdry: 'Quick-dry upper' } },
  ],
  featured: ['seg:shoe', 'seg:sock', 'sole:rubber', 'sole:tpr', 'reef:toe', 'reef:grip', 'reef:drain', 'upper:neoprene', 'close:bungee', 'ev:official', 'maker:global', 'maker:india'],
  lines: {
    q: (F) => [F.sole && F.sole.tier !== 'rejected' ? `${F.sole.display.split(' (')[0]} sole` : null, F.toe && F.toe.value ? 'closed toe' : null, F.drain && F.drain.value ? 'drainage' : null, F.grip && F.grip.value ? 'anti-slip' : null].filter(Boolean).join(' · '),
    f: (F) => [F.upper ? `${F.upper.display.split(' /')[0]} upper` : null, F.closure ? F.closure.display : null, F.weight && F.weight.tier !== 'rejected' ? F.weight.display : null].filter(Boolean).join(' · '),
  },
};
