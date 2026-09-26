// Headlamps — reference ceiling. Facts read off petzl.com (INT/en product page) on `checked`.
export default {
  category: 'headlamps',
  brand: 'Petzl',
  name: 'ACTIK® CORE',
  why: 'A headlamp whose maker prints an ANSI/PLATO FL 1 brightness figure (625 lumens) rather than a marketing number, plus weight (88 g), IPX4 weather resistance, a CORE rechargeable battery (1250 mAh, 3.5 h charge) that also accepts three AAA cells, red lighting for night vision, a lock function and a five-year lamp guarantee. Switchback Travel’s headlamp test names it best overall; OutdoorGearLab’s general-purpose pick is the cheaper Petzl Tikkina from the same line. Island power outages and unlit paths are exactly what a rechargeable-or-AAA lamp with a red mode is for.',
  checked: '2026-09-26',
  caution: 'IPX4 is splash resistance, not immersion — this is a night-walk and boat-deck lamp, not a snorkelling light. Petzl is sold in India through distributors; a Petzl listing is matched below only when the title names the ACTIK / ACTIK CORE model. Lumen figures on marketplace headlamps are seller claims unless a standard (ANSI FL 1) is named.',
  maker: {
    label: 'Petzl — official product page (international)',
    url: 'https://www.petzl.com/INT/en/Sport/Headlamps/ACTIK-CORE',
    title: 'ACTIK® CORE — Powerful, rechargeable, and easy-to-use headlamp with red lighting',
    region: 'INT',
  },
  image: {
    url: 'https://www.petzl.com/sfc/servlet.shepherd/version/download/068Tx000006KyizIAC',
    source: 'petzl.com product gallery (ACTIK CORE)',
  },
  facts: [
    { k: 'Brightness', v: '625 lumens (ANSI/PLATO FL 1)' },
    { k: 'Weight', v: '88 g' },
    { k: 'Beam', v: 'Wide or mixed; white plus red lighting' },
    { k: 'Power', v: 'CORE rechargeable battery 1250 mAh / 3.6 V / 4.5 Wh (included) or 3 × AAA; 3.5 h charge' },
    { k: 'Weather', v: 'IPX4 (weather resistant); CE' },
    { k: 'Extras', v: 'Lock function, battery-charge indicator, phosphorescent reflector, tilting plate' },
    { k: 'Guarantee', v: 'Lamp 5 years; CORE battery 2 years or 300 cycles' },
  ],
  evidence: [
    { label: 'Best Headlamps of 2025 — Petzl Actik Core, best overall headlamp', publisher: 'Switchback Travel', url: 'https://www.switchbacktravel.com/best-headlamps' },
    { label: 'Best Headlamp — Petzl Tikkina best for general-purpose use (same ACTIVE line)', publisher: 'OutdoorGearLab', url: 'https://www.outdoorgearlab.com/topics/camping-and-hiking/best-headlamp' },
    { label: 'ACTIK® CORE — specifications (625 lm FL 1, 88 g, IPX4, CORE battery, guarantee)', publisher: 'Petzl', url: 'https://www.petzl.com/INT/en/Sport/Headlamps/ACTIK-CORE' },
  ],
  match: { brand: '^petzl$', model: 'actik', note: 'Petzl ACTIK / ACTIK CORE was not found on Flipkart / Amazon.in in this dataset; other Petzl lamps are not counted as this model.' },
};
