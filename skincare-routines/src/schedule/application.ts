/** Where a step goes on, derived at render time from what a saved step already carries (category → title → zone).
 * General placement for the product type only — never this listing's own directions, which are not verified here. */
import type { SourceRef } from '../lib/types';
import type { PlanZone, Step } from './model';

export type ApplicationArea =
  | 'face' | 'face-neck' | 'face-neck-ears' | 'spots' | 'eye-contour' | 'lips'
  | 'body' | 'underarms' | 'feet'
  | 'scalp' | 'lengths' | 'beard'
  | 'mouth' | 'other';

export interface ApplicationGuide {
  area: ApplicationArea;
  label: string;
  apply: string;
  avoid: string;
  method: string;
  /** What the guidance rests on — general placement for the product type, stated as such. */
  basis: string;
  source: SourceRef | null;
  /** Hatch the nose corners too (retinoids, acids): the map shows them as keep-clear. */
  excludeNoseCorners: boolean;
  /** Which saved field the guide was read from. */
  from: 'category' | 'title' | 'zone';
}

type Rule = Omit<ApplicationGuide, 'from'>;

const AAD_SUNSCREEN: SourceRef = { label: 'AAD: how to apply sunscreen', url: 'https://www.aad.org/public/everyday-care/sun-protection/shade-clothing-sunscreen/how-to-apply-sunscreen' };
const AAD_EXFOLIATE: SourceRef = { label: 'AAD: how to safely exfoliate at home', url: 'https://www.aad.org/public/everyday-care/skin-care-secrets/routine/safely-exfoliate-at-home' };
const FDA_AHA: SourceRef = { label: 'US FDA: alpha hydroxy acids in cosmetics', url: 'https://www.fda.gov/cosmetics/cosmetic-ingredients/alpha-hydroxy-acids' };

const EYE_LIPS = 'Keep the eye contour (including under the eyes) and lips clear unless the label says otherwise.';
const GENERAL = 'General placement for this kind of product. This listing’s own directions have not been verified — follow the label where they differ.';

const FACE: Rule = { area: 'face', label: 'Face · eye area excluded', apply: 'Forehead, cheeks, nose and chin, where the label permits.', avoid: EYE_LIPS, method: 'Spread gently on clean skin. Use the amount and frequency on the bottle.', basis: GENERAL, source: null, excludeNoseCorners: false };
const FACE_NECK: Rule = { ...FACE, area: 'face-neck', label: 'Face & neck', apply: 'Face and neck, where the label permits. Keep the eye contour clear.', method: 'Pat or smooth gently onto clean skin. Follow the label for the amount.' };
const CLEANSE: Rule = { ...FACE_NECK, label: 'Face & neck · rinse off', apply: 'Massage over the whole face and neck, then rinse with lukewarm water.', avoid: 'Keep out of the eyes unless the label says it is eye-safe. Do not scrub.', method: 'Wet skin, work in for 30–60 seconds, rinse, pat dry.' };
const BALM: Rule = { ...CLEANSE, apply: 'Massage onto dry skin over face and neck to lift sunscreen and makeup, add water to emulsify, rinse.', method: 'Dry hands, dry face. Emulsify with a little water before rinsing; follow with a water-based cleanser if the label suggests it.' };
const ACTIVE: Rule = { ...FACE, excludeNoseCorners: true, avoid: 'Keep clear of the eye contour, lips and the corners of the nose; skip broken or irritated skin.', method: 'A thin layer on dry skin after cleansing. Start at the frequency on the label and build up; buffer with moisturiser if it stings.' };
const RETINOID: Rule = { ...ACTIVE, label: 'Face · eyes, lips & nose corners excluded', apply: 'A pea-sized amount for the whole face — forehead, cheeks, nose and chin — dotted then spread thin.', method: 'Night only, on fully dry skin. Begin 2–3 nights a week. Wear sunscreen in the morning.' };
const ACID: Rule = { ...ACTIVE, label: 'Face · eyes, lips & nose corners excluded', apply: 'Forehead, cheeks, nose and chin, as the label permits.', method: 'On clean, dry skin. Leave-on acids go on thin; peels follow the label’s contact time exactly. Use daily sun protection.', basis: 'General placement for leave-on and rinse-off acids; the FDA notes AHAs increase sun sensitivity. This listing’s directions are not verified here.', source: FDA_AHA };
const SCRUB: Rule = { ...CLEANSE, label: 'Face & neck · rinse off · gentle', apply: 'Damp face and neck, light circles, rinse.', avoid: 'Never over the eye contour or lips; skip active breakouts and irritated skin.', method: 'Light pressure only — let the product do the work. Once or twice a week unless the label says otherwise.', basis: 'General guidance from the AAD on exfoliating at home; this listing’s directions are not verified here.', source: AAD_EXFOLIATE };
const SPOTS: Rule = { area: 'spots', label: 'Spots only', apply: 'Dab only on the blemish or the affected patch — not the whole face.', avoid: 'Keep off surrounding skin, the eye contour and lips. Benzoyl peroxide bleaches fabric — let it dry before pillows and towels.', method: 'A thin dab on clean, dry skin. Once daily to start; follow the label.', basis: GENERAL, source: null, excludeNoseCorners: false };
const EYE: Rule = { area: 'eye-contour', label: 'Eye contour · orbital bone', apply: 'Along the orbital bone under the eye and at the outer corner.', avoid: 'Not on the lid or the lash line unless the label says so. Keep out of the eye itself.', method: 'A grain-of-rice amount per eye, patted in with the ring finger.', basis: GENERAL, source: null, excludeNoseCorners: false };
const LIPS: Rule = { area: 'lips', label: 'Lips', apply: 'Lips and the lip line.', avoid: 'Nothing else — this is a lip product.', method: 'Reapply as needed; a layer before sunscreen in the morning if it carries SPF.', basis: GENERAL, source: null, excludeNoseCorners: false };
const OIL: Rule = { ...FACE_NECK, label: 'Face & neck · last leave-on step', apply: 'A few drops pressed over face and neck.', method: 'Warm 2–4 drops between the palms and press in — after serums and moisturiser, before or after sunscreen only as the label says.' };
const SUNSCREEN: Rule = { area: 'face-neck-ears', label: 'Face, neck & ears', apply: 'Cover exposed face, neck and ears evenly. Protect any other uncovered skin too.', avoid: 'Keep sunscreen out of the eyes. Eye-area use for this bottle is unverified — use label-approved protection and sunglasses around the eyes; SPF lip balm on the lips.', method: 'Apply before going outdoors and follow the bottle’s directions. The AAD recommends reapplying every two hours outdoors and after swimming or sweating.', basis: 'General sun-protection guidance from the AAD, not verification of this sunscreen’s eye-area suitability.', source: AAD_SUNSCREEN, excludeNoseCorners: false };
const BODY: Rule = { area: 'body', label: 'Body · not the face', apply: 'Arms, legs, torso — the areas the label names.', avoid: 'Keep off the face and any broken skin unless the label allows it.', method: 'Smooth in after a shower while skin is slightly damp, or as the label directs.', basis: GENERAL, source: null, excludeNoseCorners: false };
const BODY_RINSE: Rule = { ...BODY, label: 'Body · rinse off', apply: 'Whole body in the shower, then rinse.', method: 'Lather with hands or a soft cloth, rinse well, pat dry, moisturise.' };
const BODY_SCRUB: Rule = { ...BODY_RINSE, label: 'Body · rinse off · gentle', apply: 'Damp skin on arms, legs and torso in light circles, then rinse.', avoid: 'Never on the face, irritated or freshly shaved skin.', method: 'Light pressure, once or twice a week unless the label says otherwise.', basis: 'General guidance from the AAD on exfoliating at home; this listing’s directions are not verified here.', source: AAD_EXFOLIATE };
const KP: Rule = { ...BODY, label: 'Rough body areas · never the face', apply: 'Rough or bumpy patches — upper arms, thighs, elbows, knees.', avoid: 'Not for the face; urea and acids at body strength are too strong there. Skip broken skin.', method: 'A thin layer once or twice daily as the label directs; daily sunscreen where the skin is exposed.' };
const BODY_SUN: Rule = { ...SUNSCREEN, area: 'body', label: 'All exposed skin', apply: 'Every uncovered area — arms, legs, shoulders, back of the neck, hands and feet.', avoid: 'Keep out of the eyes. Cover the face with a face sunscreen unless this label permits face use.' };
const UNDERARMS: Rule = { area: 'underarms', label: 'Underarms', apply: 'Clean, dry underarms only.', avoid: 'Not on broken or freshly shaved skin; keep off the face.', method: 'Apply to dry skin and let it dry before dressing.', basis: GENERAL, source: null, excludeNoseCorners: false };
const INTIMATE: Rule = { area: 'body', label: 'External intimate area only', apply: 'External skin only, then rinse.', avoid: 'Never internally. Stop if it stings.', method: 'A small amount with water, rinse thoroughly.', basis: GENERAL, source: null, excludeNoseCorners: false };
const FEET: Rule = { area: 'feet', label: 'Hands & feet', apply: 'Heels, soles and the rough sides of the feet; backs of the hands and cuticles.', avoid: 'Never on the face — foot creams run far stronger than face products.', method: 'A thick layer at night; socks help it stay put.', basis: GENERAL, source: null, excludeNoseCorners: false };
const SCALP: Rule = { area: 'scalp', label: 'Scalp', apply: 'The scalp and roots, parted section by section.', avoid: 'Keep off the face and out of the eyes; rinse-off products come off the lengths too.', method: 'Massage into the scalp with fingertips (not nails); follow the label for how long to leave it.', basis: GENERAL, source: null, excludeNoseCorners: false };
const LENGTHS: Rule = { area: 'lengths', label: 'Mid-lengths to ends', apply: 'Mid-lengths and ends, kept away from the roots.', avoid: 'Not on the scalp unless the label says so — it weighs roots down.', method: 'Work through damp or dry hair as the label directs; less near the roots.', basis: GENERAL, source: null, excludeNoseCorners: false };
const HEAT: Rule = { ...LENGTHS, label: 'Lengths · before heat', apply: 'Mist or comb evenly through damp lengths and ends before drying or styling.', method: 'Section the hair so every strand gets a light, even coat; let it distribute before heat.' };
const BEARD: Rule = { area: 'beard', label: 'Beard & the skin beneath', apply: 'Beard hair and the skin under it, jaw to neck.', avoid: 'Keep off the lips and out of the eyes.', method: 'Work through with fingers or a comb; oils and balms go on after washing, on towel-dry hair.', basis: GENERAL, source: null, excludeNoseCorners: false };
const MOUTH: Rule = { area: 'mouth', label: 'Teeth & mouth', apply: 'Teeth, gums and tongue as the product directs.', avoid: 'Not for skin. Do not swallow unless the label says it is safe to.', method: 'Follow the label for amount, contact time and rinsing.', basis: 'This site ranks no oral-care products, so nothing about this step is verified here — it only keeps its place in the schedule.', source: null, excludeNoseCorners: false };
const OTHER: Rule = { area: 'other', label: 'As the label directs', apply: 'Wherever the label names.', avoid: 'Anywhere the label excludes.', method: 'Follow the label.', basis: 'No ranked page covers this kind of step, so no placement guidance is offered.', source: null, excludeNoseCorners: false };
const SHAVE: Rule = { ...BEARD, label: 'Beard area · jaw & neck', apply: 'The area being shaved — cheeks, jaw and neck.', avoid: 'Keep off the lips and eyes; aftershave stays off broken skin.', method: 'Prep on damp skin; aftershave on clean, dry skin.' };

const BY_CATEGORY: Record<string, Rule> = {
  facewash: CLEANSE, cleansingbalm: BALM,
  toner: FACE_NECK, essence: FACE_NECK, facemist: FACE_NECK, hyaluronic: FACE_NECK, calmserum: FACE_NECK, peptideserum: FACE_NECK,
  pdrn: FACE_NECK, nadnmn: FACE_NECK, niacinamide: FACE_NECK, moisturizer: FACE_NECK, barriercream: FACE_NECK, sheetmask: FACE_NECK,
  facemask: FACE_NECK, vitaminc: FACE_NECK,
  retinol: RETINOID,
  exfoliator: ACID, lactic: ACID, salicylic: ACID, azelaic: ACTIVE, txa: ACTIVE, pigmentation: ACTIVE, detan: ACTIVE,
  acnespot: SPOTS, benzoyl: SPOTS,
  eyecream: EYE, lipbalm: LIPS, faceoil: OIL, sunscreen: SUNSCREEN,
  bodywash: BODY_RINSE, soap: BODY_RINSE, intimatewash: INTIMATE, bodyscrub: BODY_SCRUB,
  bodylotion: BODY, bodyoil: BODY, stretchmark: BODY, hairremoval: BODY, kp: KP, bodysunscreen: BODY_SUN,
  deodorant: UNDERARMS, handfoot: FEET,
  shampoo: SCALP, antidandruff: SCALP, hairfall: SCALP, scalpscrub: SCALP, scalptonic: SCALP, dryshampoo: SCALP,
  conditioner: LENGTHS, hairmask: LENGTHS, hairoil: LENGTHS, hairserum: LENGTHS, haircream: LENGTHS, hydratingcream: LENGTHS,
  hydratingserum: LENGTHS, hairstyling: LENGTHS, hairspray: LENGTHS, leavein: LENGTHS, keratinkit: LENGTHS, hairperfume: LENGTHS,
  heatprotect: HEAT, beard: BEARD, shaving: SHAVE,
};

const BY_TITLE: [RegExp, Rule][] = [
  [/\b(teeth|tooth|toothpaste|toothbrush|floss|mouth ?wash|tongue|gums?)\b/i, MOUTH],
  [/\b(balm|makeup remover|micellar|double cleanse)\b/i, BALM],
  [/\b(cleanse|cleanser|face ?wash)\b/i, CLEANSE],
  [/\b(retin|tretinoin|adapalene|bakuchiol)\w*/i, RETINOID],
  [/\b(scrub)\b/i, SCRUB],
  [/\b(exfoliat|peel|aha|bha|glycolic|lactic|mandelic|salicylic)\w*/i, ACID],
  [/\b(benzoyl|spot)\w*/i, SPOTS],
  [/\b(eye cream|under.?eye|eye)\b/i, EYE],
  [/\b(lip)\b/i, LIPS],
  [/\b(sunscreen|spf|sunblock)\w*/i, SUNSCREEN],
  [/\b(oil|squalane)\b/i, OIL],
  [/\b(azelaic|tranexamic|kojic|alpha arbutin|pigment)\w*/i, ACTIVE],
  [/\b(deodorant|antiperspirant)\b/i, UNDERARMS],
  [/\b(foot|feet|heel|hand cream)\b/i, FEET],
  [/\b(urea|keratosis|kp)\b/i, KP],
  [/\b(shampoo|scalp|dandruff)\b/i, SCALP],
  [/\b(conditioner|hair mask|hair oil|hair serum|leave.?in|heat protect)\w*/i, LENGTHS],
  [/\b(beard|shav)\w*/i, BEARD],
];

const BY_ZONE: Record<PlanZone, Rule> = {
  face: { ...FACE, basis: 'This step has no category, so only general face placement is shown. Check the label for where this product goes.' },
  body: { ...BODY, basis: 'This step has no category, so only general body placement is shown. Check the label for where this product goes.' },
  scalp: SCALP,
  lengths: LENGTHS,
  beard: BEARD,
  oral: MOUTH,
  other: OTHER,
};

/** Body-zone steps in face categories (e.g. a body-scope moisturiser) follow the zone, not the face map. */
const forZone = (rule: Rule, zone: PlanZone): Rule => {
  if (zone === 'oral' || zone === 'other') return BY_ZONE[zone];
  if (zone === 'face' || rule.area === 'body' || rule.area === 'underarms' || rule.area === 'feet' || rule.area === 'mouth') return rule;
  if (zone === 'body') return rule.area === 'face-neck-ears' ? BODY_SUN : rule.area === 'spots' ? { ...SPOTS, avoid: 'Keep off surrounding skin and any broken skin.' } : BODY;
  return BY_ZONE[zone];
};

export type GuidedStep = Pick<Step, 'category' | 'title' | 'zone'>;

export function applicationGuide(step: GuidedStep): ApplicationGuide {
  const byCategory = step.category ? BY_CATEGORY[step.category] : undefined;
  if (byCategory) return { ...forZone(byCategory, step.zone), from: 'category' };
  const byTitle = BY_TITLE.find(([re]) => re.test(step.title));
  if (byTitle) return { ...forZone(byTitle[1], step.zone), from: 'title' };
  return { ...BY_ZONE[step.zone], from: 'zone' };
}
