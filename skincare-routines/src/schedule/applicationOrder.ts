/** The order products go on within one slot — thinnest/cleansing first, occlusive and protective last. Category id first,
 * step title as fallback, unknown steps land in the serum layer so they never jump ahead of the cleanse or past sunscreen. */
import type { Step } from './model';

const LAYER: Record<string, number> = {
  cleansingbalm: 0,
  facewash: 1, bodywash: 1, soap: 1, intimatewash: 1, shampoo: 1, antidandruff: 1, hairfall: 1, shaving: 1,
  exfoliator: 2, lactic: 2, salicylic: 2, bodyscrub: 2, scalpscrub: 2, detan: 2,
  toner: 3,
  essence: 4, facemist: 4, sheetmask: 4, facemask: 4, hairmask: 4, conditioner: 4,
  hyaluronic: 5, niacinamide: 5, vitaminc: 5, azelaic: 5, txa: 5, pdrn: 5, nadnmn: 5, peptideserum: 5, calmserum: 5,
  retinol: 5, benzoyl: 5, acnespot: 5, pigmentation: 5, hairserum: 5, hydratingserum: 5, scalptonic: 5,
  eyecream: 6,
  moisturizer: 7, barriercream: 7, bodylotion: 7, kp: 7, handfoot: 7, stretchmark: 7, haircream: 7, hydratingcream: 7, leavein: 7, lipbalm: 7,
  faceoil: 8, bodyoil: 8, hairoil: 8,
  sunscreen: 9, bodysunscreen: 9, heatprotect: 9,
  hairstyling: 10, hairspray: 10, hairperfume: 10, deodorant: 10, hairremoval: 10, keratinkit: 10, dryshampoo: 10, beard: 10,
};

const TITLE_HINTS: [RegExp, number][] = [
  [/\b(balm|makeup remover|micellar|first cleanse|double cleanse)\b/i, 0],
  [/\b(cleanse|cleanser|face ?wash|wash|shampoo|soap|shave|shaving)\b/i, 1],
  [/\b(exfoliat|scrub|peel|aha|bha|glycolic|lactic|mandelic|salicylic)\w*/i, 2],
  [/\btoner\b/i, 3],
  [/\b(essence|mist)\b/i, 4],
  [/\b(eye cream|eye)\b/i, 6],
  [/\b(moisturi[sz]|cream|lotion|barrier|ceramide|lip balm)\w*/i, 7],
  [/\b(oil|squalane)\b/i, 8],
  [/\b(sunscreen|spf|sunblock|heat protect)\w*/i, 9],
  [/\b(serum|ampoule|treatment|retin|niacinamide|vitamin c|azelaic|peptide|pdrn|nad|tranexamic|benzoyl|spot)\w*/i, 5],
];

const UNKNOWN_LAYER = 5.5;

export type OrderableStep = Pick<Step, 'category' | 'title'>;

export function applicationLayer(step: OrderableStep): number {
  if (step.category && step.category in LAYER) return LAYER[step.category];
  const hit = TITLE_HINTS.find(([re]) => re.test(step.title));
  return hit ? hit[1] : UNKNOWN_LAYER;
}

/** Stable: steps in the same layer keep the order they already had. */
export const byApplicationOrder = <T extends OrderableStep>(steps: T[]): T[] =>
  steps.map((s, i) => ({ s, i, layer: applicationLayer(s) })).sort((a, b) => a.layer - b.layer || a.i - b.i).map((x) => x.s);

/** 1-based place a new step should take among `siblings` (already in display order) so it goes on after everything of the same or an earlier layer. */
export function applicationPosition(step: OrderableStep, siblings: OrderableStep[]): number {
  const layer = applicationLayer(step);
  let at = siblings.length;
  for (let i = siblings.length - 1; i >= 0 && applicationLayer(siblings[i]) > layer; i -= 1) at = i;
  return at + 1;
}
