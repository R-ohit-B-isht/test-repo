// Formula + skin-safety scores computed ONLY from a verified (status 'full') INCI list.
// Position on the list is the concentration proxy the law gives us: ingredients are declared in descending
// order down to 1%, and anything after the first preservative-type marker is ≤1% (EU 1223/2009 Art. 19).
const { ACTIVES, HAIR_ACTIVES, MILD_SURFACTANTS, ONE_PERCENT_MARKERS } = require('./inci-kb.cjs');
const { FLAGS } = require('./inci-flags.cjs');

const GRADE_PTS = { A: 2.0, B: 1.2, C: 0.4 };
// Hair: shampoos, conditioners and masks are rinsed; oils, serums and the hair-fall page (mostly leave-on scalp
// serums / minoxidil, shampoos only a minority) are judged as leave-on — the stricter, honest default.
const HAIR = new Set(['shampoo', 'antidandruff', 'hairfall', 'conditioner', 'hairmask', 'hairoil', 'hairserum', 'haircream', 'heatprotect', 'hairstyling', 'hydratingcream', 'hydratingserum']);
// Hydration pages are the leave-in cream / serum forms judged on the same core actives, plus humectants as core.
const ROLE_ALIAS = { hydratingcream: 'haircream', hydratingserum: 'hairserum' };
const HYDRATION = new Set(['hydratingcream', 'hydratingserum']);
const RINSE_OFF = new Set(['facewash', 'bodywash', 'exfoliator', 'facemask', 'shampoo', 'antidandruff', 'conditioner', 'hairmask']);
const FACE = new Set(['facewash', 'toner', 'essence', 'vitaminc', 'niacinamide', 'retinol', 'exfoliator', 'salicylic',
  'moisturizer', 'sunscreen', 'facemask', 'eyecream', 'faceoil', 'detan', 'pigmentation']);
const WASH = new Set(['facewash', 'bodywash', 'shampoo', 'antidandruff']);
const UVA_FILTERS = new Set(['zinc oxide', 'butyl methoxydibenzoylmethane', 'avobenzone', 'bis-ethylhexyloxyphenol methoxyphenyl triazine',
  'methylene bis-benzotriazolyl tetramethylbutylphenol', 'diethylamino hydroxybenzoyl hexyl benzoate', 'terephthalylidene dicamphor sulfonic acid',
  'drometrizole trisiloxane', 'methoxypropylamino cyclohexenylidene ethoxyethylcyanoacetate', 'tris-biphenyl triazine']);
const STABILISERS = new Set(['octocrylene', 'bis-ethylhexyloxyphenol methoxyphenyl triazine', 'methylene bis-benzotriazolyl tetramethylbutylphenol', 'zinc oxide', 'titanium dioxide']);
const HUMECTANTS = new Set(['glycerin', 'sodium hyaluronate', 'hyaluronic acid', 'hydrolyzed hyaluronic acid', 'panthenol', 'urea', 'sodium pca', 'betaine', 'propanediol', 'butylene glycol']);
const BARRIER = new Set(['ceramide np', 'ceramide ap', 'ceramide eop', 'ceramide ns', 'ceramide eos', 'cholesterol', 'squalane', 'petrolatum', 'dimethicone', 'shea butter', 'butyrospermum parkii butter', 'niacinamide']);

const toMap = (list) => new Map(list.map(([name, grade, src, roles]) => [name, { name, grade, src, roles: new Set(roles) }]));
const ACTIVE_BY_NAME = toMap(ACTIVES);
const HAIR_ACTIVE_BY_NAME = toMap(HAIR_ACTIVES);
const r1 = (v) => Math.round(v * 10) / 10;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Weight by declared position: top 5 ≈ the bulk of the formula; below the 1% marker ≈ trace.
function positionWeight(idx, markerIdx) {
  if (markerIdx >= 0 && idx > markerIdx) return 0.35;
  if (idx < 5) return 1.0;
  if (idx < 10) return 0.75;
  return 0.5;
}

function firstMarker(known) {
  return known.findIndex((k) => k && ONE_PERCENT_MARKERS.includes(k));
}

// → { score 0–10, actives: [{name, grade, position, core}], support: [names], notes }
function formulaScore(category, known) {
  const marker = firstMarker(known);
  const actives = [];
  const support = new Set();
  const seen = new Set();
  let core = 0, other = 0;
  const table = HAIR.has(category) ? HAIR_ACTIVE_BY_NAME : ACTIVE_BY_NAME;
  const role = ROLE_ALIAS[category] || category;
  known.forEach((k, i) => {
    if (!k || seen.has(k)) return;                  // a name declared twice counts once, at its first (highest) position
    seen.add(k);
    const a = table.get(k);
    const w = positionWeight(i, marker);
    if (a) {
      const isCore = a.roles.has(role);
      const pts = GRADE_PTS[a.grade] * w;
      if (isCore) core += pts; else other += pts * 0.35;
      actives.push({ name: k, grade: a.grade, position: i + 1, core: isCore, src: a.src });
    }
    if (WASH.has(category) && MILD_SURFACTANTS.includes(k)) { core += 1.2 * w; support.add(k); }
    if (HYDRATION.has(category) && HUMECTANTS.has(k) && !table.has(k)) { core += 0.8 * w; }
    if (HUMECTANTS.has(k) || BARRIER.has(k)) support.add(k);
  });
  let s = 3.0 + clamp(core, 0, 5.0) + clamp(other, 0, 1.0) + clamp(support.size * 0.25, 0, 1.0);
  const notes = [];
  if (category === 'sunscreen') {
    const hasUVA = known.some((k) => UVA_FILTERS.has(k));
    const stable = known.some((k) => STABILISERS.has(k));
    if (!hasUVA) { s -= 2.5; notes.push('No recognised UVA filter on the list'); }
    else if (!stable) { s -= 0.5; notes.push('Avobenzone-type UVA filter without a photostabiliser'); }
  }
  return { score: r1(clamp(s, 0, 10)), actives, support: [...support], notes };
}

// → { score 0–10, flags: [{id, label, names, penalty, src}] }
function safetyScore(category, known, tokens) {
  const rinse = RINSE_OFF.has(category);
  const face = FACE.has(category);
  const flags = [];
  let penalty = 0;
  for (const f of FLAGS) {
    if (f.faceOnly && !face) continue;
    const hits = [];
    known.forEach((k, i) => {
      if (!k || !f.names.includes(k)) return;
      if (f.topN && i >= f.topN) return;
      hits.push(tokens[i]);
    });
    if (!hits.length) continue;
    let base = rinse ? f.rinseOff : f.leaveOn;
    if (f.sunscreen !== undefined && category === 'sunscreen') base = f.sunscreen;
    const p = f.perItem ? Math.min(f.cap, base * hits.length) : base;
    penalty += p;
    flags.push({ id: f.id, label: f.label, names: [...new Set(hits)], penalty: r1(p), src: f.src });
  }
  return { score: r1(clamp(10 - penalty, 1, 10)), flags };
}

module.exports = { formulaScore, safetyScore, RINSE_OFF, FACE, HAIR };
