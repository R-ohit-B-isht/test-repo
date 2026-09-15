import type { PickKey } from './personalPicks';

export interface PersonalStep {
  id: string;
  title: string;
  ingredients: string;
  picks: PickKey[];
  note?: string;
  alternatives?: PickKey[];
  bodyOnly?: boolean;
}

export interface PersonalDay {
  name: string;
  short: string;
  theme: string;
  focus: string;
  steps: PersonalStep[];
}

const cleanser: PersonalStep = { id: 'cleanser', title: 'Cleanser', ingredients: 'Start with a clean canvas', picks: ['cleanser'] };
const dryCleanser: PersonalStep = { ...cleanser, note: 'Dry skin completely before the exfoliant.' };
const essence: PersonalStep = { id: 'essence', title: 'Hydrating essence', ingredients: 'Hyaluronic acid · glycerin · betaine', picks: ['essence'] };
const barrier: PersonalStep = { id: 'barrier', title: 'Barrier balm', ingredients: 'Ceramide NP · squalane', picks: ['barrier'], note: 'A cream-format match for your barrier-balm step.' };
const ceramide: PersonalStep = { id: 'moisturizer', title: 'Moisturizer', ingredients: 'Ceramide NP', picks: ['barrier'] };
const body: PersonalStep = { id: 'body', title: 'Body only', ingredients: 'Urea 20%', picks: ['urea'], bodyOnly: true, note: 'The selected listing is for feet. Keep it off the face; use only on the areas its label permits.' };
const retinoid: PersonalStep[] = [
  cleanser,
  { id: 'toner', title: 'Toner', ingredients: 'Niacinamide · panthenol', picks: ['niacinamideToner'] },
  { id: 'retinol', title: 'Retinol', ingredients: 'Your retinoid night', picks: ['retinol'] },
  { id: 'cream', title: 'Cream', ingredients: 'Peptides · Ceramide NP', picks: ['barrier'] },
];
const recovery: PersonalStep[] = [
  cleanser, essence,
  { id: 'longevity', title: 'Longevity serums', ingredients: 'PDRN · NAD+ · NMN · peptides', picks: ['pdrn', 'longevity'], note: '“Longevity” is your schedule label. Ingredient presence does not establish anti-aging results.' },
  barrier,
];

export const MORNING: PersonalStep[] = [
  cleanser,
  { ...essence, title: 'Toner / essence', ingredients: 'Hyaluronic acid · glycerin · betaine · panthenol' },
  { id: 'pigment', title: 'Antioxidant & pigment serums', ingredients: 'Vitamin C · tranexamic acid · alpha-arbutin · kojic acid',
    picks: ['vitaminC', 'pigment'], alternatives: ['kojic'],
    note: 'These are ingredient-matched options. The kojic cream is an alternative to the pigment serum; alpha-arbutin also appears in your moisturizer. This is not an instruction to layer every active.' },
  { id: 'clarifying', title: 'Clarifying serums', ingredients: 'Niacinamide · azelaic acid · green tea', picks: ['calming'],
    note: 'The Tran-Zelaic serum above already covers azelaic acid and niacinamide. Do not apply a second dose for this step.' },
  { id: 'moisturizer', title: 'Moisturizer', ingredients: 'Ceramides · madecassoside · allantoin', picks: ['moisturizer'] },
  { id: 'sunscreen', title: 'Sunscreen', ingredients: 'SPF 50+', picks: ['sunscreen'], note: 'Follow the sunscreen label for application and reapplication.' },
];

export const PERSONAL_WEEK: PersonalDay[] = [
  { name: 'Monday', short: 'Mon', theme: 'Exfoliation', focus: 'Glycolic + BHA', steps: [
    dryCleanser,
    { id: 'exfoliant', title: 'Arencia Eraser Shot', ingredients: '10% Glycolic + BHA — your requested formula', picks: ['arencia'],
      note: 'The site lists this product without a verified ingredient list or buyer rating. Confirm the exact formula and directions on your bottle before use.' },
    { id: 'toner', title: 'Toner', ingredients: 'Cica (Centella) · panthenol · hyaluronic acid', picks: ['cicaToner'] },
    ceramide, body,
  ] },
  { name: 'Tuesday', short: 'Tue', theme: 'Retinoid', focus: 'Retinol + barrier care', steps: retinoid },
  { name: 'Wednesday', short: 'Wed', theme: 'Clarifying', focus: 'Clay + benzoyl peroxide', steps: [
    cleanser,
    { id: 'mask', title: 'Clay mask', ingredients: 'Rinse off before the next step', picks: ['clay'] },
    { id: 'benzoyl', title: 'Benzoyl peroxide', ingredients: 'Short-contact therapy', picks: ['benzoyl'],
      note: 'Your schedule: leave on for 3–5 minutes, then wash off completely. This spot-corrector listing does not verify that timing; confirm it with the product directions or your clinician.' },
    { id: 'azelaic', title: 'Azelaic acid serum', ingredients: 'Azelaic acid', picks: ['azelaic'] },
    { id: 'moisturizer', title: 'Moisturizer', ingredients: 'Squalane · madecassoside', picks: ['moisturizer'] },
    body,
  ] },
  { name: 'Thursday', short: 'Thu', theme: 'Recovery & longevity', focus: 'Hydrate + replenish', steps: recovery },
  { name: 'Friday', short: 'Fri', theme: 'Retinoid', focus: 'Retinol + barrier care', steps: [...retinoid, body] },
  { name: 'Saturday', short: 'Sat', theme: 'Exfoliation', focus: 'Lactic acid', steps: [
    dryCleanser,
    { id: 'exfoliant', title: 'Lactic acid', ingredients: 'Your second exfoliation night', picks: ['lactic'] },
    { id: 'toner', title: 'Toner', ingredients: 'Hyaluronic acid', picks: ['cicaToner'] },
    ceramide,
  ] },
  { name: 'Sunday', short: 'Sun', theme: 'Recovery & longevity', focus: 'Hydrate + replenish', steps: recovery },
];
