export interface PersonalPick {
  category: string;
  id: string;
  match: string;
}

export const PERSONAL_PICKS = {
  cleanser: { category: 'facewash', id: 'cetaphil-itmadc9349d60faf', match: 'Gentle cleanser' },
  essence: { category: 'essence', id: 'plum-itm33fe342e034e8', match: 'Hyaluronic acid · glycerin · betaine · panthenol' },
  vitaminC: { category: 'vitaminc', id: 'the-derma-co-itme24cdb159aeef', match: 'Vitamin C · niacinamide' },
  pigment: { category: 'txa', id: 'the-derma-co-itmb90a965226cfd', match: 'Tranexamic acid · alpha-arbutin · azelaic acid · niacinamide' },
  kojic: { category: 'txa', id: 'conscious-chemist-itmccf7bcc65fef5', match: 'Kojic acid · tranexamic acid · azelaic acid · niacinamide' },
  calming: { category: 'calmserum', id: 'purito-b0cst174j1', match: 'Green tea · niacinamide · panthenol · madecassoside' },
  moisturizer: { category: 'moisturizer', id: 'axis-y-b0dkshyvnq', match: 'Ceramide NP · madecassoside · allantoin · squalane' },
  sunscreen: { category: 'sunscreen', id: 'aqualogica-itm10498a64f4bfa', match: 'SPF 50 PA++++, as labelled' },
  arencia: { category: 'exfoliator', id: 'arencia-itmc7838baf094ad', match: 'Your named product · formula and 10% strength unverified in the Ledger' },
  cicaToner: { category: 'toner', id: 'cetaphil-b0fdfw49b9', match: 'Centella · panthenol · hyaluronic acid' },
  niacinamideToner: { category: 'toner', id: 'dermatouch-itmffe6cf09c0c2c', match: 'Niacinamide · panthenol · green tea' },
  barrier: { category: 'barriercream', id: 'plum-b0fvfqct76', match: 'Ceramide NP · peptides · squalane' },
  urea: { category: 'handfoot', id: 'proskire-itm5c0aea83ed3a9', match: '20% urea, as labelled · foot roll-on · also contains lactic acid' },
  retinol: { category: 'retinol', id: 'dot-key-itm44e5bcc27a5e0', match: 'Retinol · peptides · squalane' },
  clay: { category: 'facemask', id: 'dot-key-itm24597959e29a7', match: 'Clay mask' },
  benzoyl: { category: 'benzoyl', id: 'the-derma-co-b0f5prp9hl', match: '2.5% benzoyl peroxide spot corrector, as labelled' },
  azelaic: { category: 'azelaic', id: 'the-derma-co-itmb90a965226cfd', match: 'Azelaic acid · tranexamic acid · niacinamide' },
  pdrn: { category: 'pdrn', id: 'minimalist-itm2f2316c56a25c', match: 'PDRN (sodium DNA) · copper peptide' },
  longevity: { category: 'nadnmn', id: 'eqqualberry-b0fgq3j31k', match: 'NAD+ · NMN · peptides, present in the recorded ingredient list' },
  lactic: { category: 'lactic', id: 'the-ordinary-b07ndnpckw', match: 'Lactic acid · hyaluronic acid' },
} satisfies Record<string, PersonalPick>;

export type PickKey = keyof typeof PERSONAL_PICKS;

export const SHELF_PICKS = (Object.keys(PERSONAL_PICKS) as PickKey[]).filter((key, i, keys) =>
  keys.findIndex((other) => PERSONAL_PICKS[other].id === PERSONAL_PICKS[key].id) === i);
