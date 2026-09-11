// Skin-concern facet (`target:*`): acne · dark spots · aging · irritation. A listing gets a concern tag only from
//   (a) an evidence-graded A/B active on its *verified* INCI list, declared above the 1% marker, or
//   (b) the product type it was classified into (an acne spot gel is for acne whatever its INCI says).
// Seller adjectives in the title never qualify — those stay in the separate `claim:*` group, scored 0.
// The tag is matching metadata for finding products, not evidence that the product works. Hair pages keep their own
// `concern:*` group and never receive a skin-concern tag.

const { HAIR } = require('./inci-score.cjs');

const CONCERNS = [
  ['acne', 'Acne'],
  ['dark-spots', 'Dark spots'],
  ['aging', 'Aging'],
  ['irritation', 'Irritation'],
];

// INCI names from inci-kb.cjs ACTIVES with the concern the cited evidence is for.
const ACTIVE_CONCERNS = {
  'benzoyl peroxide': ['acne'], 'salicylic acid': ['acne'], 'betaine salicylate': ['acne'], sulfur: ['acne'],
  adapalene: ['acne', 'aging'], tretinoin: ['acne', 'aging', 'dark-spots'], clindamycin: ['acne'], 'clindamycin phosphate': ['acne'],
  'azelaic acid': ['acne', 'dark-spots', 'irritation'], 'zinc pca': ['acne'], 'melaleuca alternifolia leaf oil': ['acne'],
  niacinamide: ['dark-spots', 'acne'], 'tranexamic acid': ['dark-spots'], 'alpha-arbutin': ['dark-spots'], arbutin: ['dark-spots'],
  'kojic acid': ['dark-spots'], 'kojic dipalmitate': ['dark-spots'], hydroquinone: ['dark-spots'], cysteamine: ['dark-spots'],
  'glycyrrhiza glabra root extract': ['dark-spots'], 'dipotassium glycyrrhizate': ['dark-spots'], glabridin: ['dark-spots'],
  hexylresorcinol: ['dark-spots'], '4-butylresorcinol': ['dark-spots'], 'isobutylamido thiazolyl resorcinol': ['dark-spots'],
  'ascorbic acid': ['dark-spots', 'aging'], '3-o-ethyl ascorbic acid': ['dark-spots', 'aging'], 'ethyl ascorbic acid': ['dark-spots', 'aging'],
  'ascorbyl glucoside': ['dark-spots', 'aging'], 'sodium ascorbyl phosphate': ['dark-spots'], 'magnesium ascorbyl phosphate': ['dark-spots'],
  'tetrahexyldecyl ascorbate': ['dark-spots', 'aging'], 'ascorbyl tetraisopalmitate': ['dark-spots', 'aging'],
  retinol: ['aging'], retinal: ['aging'], retinaldehyde: ['aging'], 'hydroxypinacolone retinoate': ['aging'], 'retinyl propionate': ['aging'],
  bakuchiol: ['aging'], 'palmitoyl tripeptide-1': ['aging'], 'palmitoyl tetrapeptide-7': ['aging'], 'palmitoyl pentapeptide-4': ['aging'],
  'acetyl hexapeptide-8': ['aging'], 'copper tripeptide-1': ['aging'], adenosine: ['aging'],
  'centella asiatica extract': ['irritation'], madecassoside: ['irritation'], asiaticoside: ['irritation'], bisabolol: ['irritation'],
  'beta-glucan': ['irritation'], panthenol: ['irritation'], 'aloe barbadensis leaf juice': ['irritation'], 'aloe barbadensis leaf extract': ['irritation'],
  'ceramide np': ['irritation'], 'ceramide ap': ['irritation'], 'ceramide eop': ['irritation'], 'ceramide ns': ['irritation'], 'ceramide eos': ['irritation'],
  'colloidal oatmeal': ['irritation'], 'avena sativa kernel flour': ['irritation'], 'avena sativa kernel extract': ['irritation'],
};

// Product types whose whole purpose is one of the concerns (the classifier placed the listing there by its stated
// form + purpose, e.g. "acne spot gel", "azelaic acid serum", "barrier repair cream").
const CATEGORY_CONCERNS = {
  acnespot: ['acne'], salicylic: ['acne'], azelaic: ['acne', 'dark-spots', 'irritation'],
  pigmentation: ['dark-spots'], detan: ['dark-spots'], vitaminc: ['dark-spots'],
  retinol: ['aging'], peptideserum: ['aging'],
  barriercream: ['irritation'], calmserum: ['irritation'],
  txa: ['dark-spots'], benzoyl: ['acne'], nadnmn: ['aging'], pdrn: ['aging'],
};

/**
 * @param {string} category registry id the listing is filed under
 * @param {{inci: string, actives: {name: string, grade: string, trace: boolean, position: number}[]}} evidence from scoreProduct
 * @returns {{tags: string[], basis: string|null}} `target:*` tags plus a human-readable line naming what each rests on
 */
function concernTags(category, evidence) {
  if (HAIR.has(category)) return { tags: [], basis: null };
  const why = new Map();
  const add = (id, reason) => { if (!why.has(id)) why.set(id, []); why.get(id).push(reason); };
  for (const c of CATEGORY_CONCERNS[category] || []) add(c, `product type`);
  if (evidence.inci === 'full') {
    for (const a of evidence.actives) {
      if (a.trace || !['A', 'B'].includes(a.grade)) continue;
      for (const c of ACTIVE_CONCERNS[a.name] || []) add(c, `${a.name} #${a.position} on INCI`);
    }
  }
  const tags = CONCERNS.filter(([id]) => why.has(id)).map(([id]) => `target:${id}`);
  const basis = tags.length
    ? CONCERNS.filter(([id]) => why.has(id)).map(([id, label]) => `${label} — ${[...new Set(why.get(id))].join(', ')}`).join('; ')
    : null;
  return { tags, basis };
}

module.exports = { CONCERNS, ACTIVE_CONCERNS, CATEGORY_CONCERNS, concernTags };
