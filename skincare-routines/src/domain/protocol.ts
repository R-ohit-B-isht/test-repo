/** The 4-step old-tan / pigmentation protocol; each step's tag is a real `step:*` facet in the pigmentation data. */
export const PROTOCOL_STEPS = [
  { tag: 'step:exfoliate', n: '01', name: 'EXFOLIATE', when: 'Night · 2–3× a week to start', what: 'Glycolic / lactic / AHA toner or peel on the darkened area. Lifts the pigmented dead-cell layer.' },
  { tag: 'step:treat', n: '02', name: 'TREAT', when: 'Night · daily once tolerated', what: 'Kojic acid, alpha arbutin, tranexamic acid or vitamin C — tyrosinase inhibitors that slow new pigment.' },
  { tag: 'step:moisturize', n: '03', name: 'MOISTURIZE', when: 'Every night, after actives', what: 'Pigmentation cream or acid body lotion; keeps the barrier calm so you can keep using acids.' },
  { tag: 'step:protect', n: '04', name: 'PROTECT', when: 'Every morning · reapply outdoors', what: 'SPF 30+ on the area. Skipping it undoes everything — acids also make skin more sun-sensitive.' },
];
