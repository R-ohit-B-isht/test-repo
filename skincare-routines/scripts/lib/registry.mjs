// Category registry — the single place that knows which generated data file backs
// which route, how it is grouped in the hub, and which facet groups matter most.
// The build emits this (minus file/global) into public/data/manifest.json for the UI.

const FACE = 'face';
const BODY = 'body';
const BOTH = 'both';
const HAIR = 'hair';

const CORE_FACETS = ['inci', 'scope', 'format', 'ing', 'claim', 'free', 'skin', 'aud', 'size', 'rating', 'store'];
const SUN_FACETS = ['inci', 'scope', 'spf', 'pa', 'sun', 'format', 'ing', 'claim', 'free', 'skin', 'aud', 'size', 'rating', 'store'];
// Hair pages swap face/body scope for scalp/lengths, skin type for hair type, and benefit claims for hair concerns.
const HAIR_FACETS = ['inci', 'area', 'format', 'ing', 'concern', 'free', 'hair', 'aud', 'size', 'rating', 'store'];

/** The segmented "where does it go" control on a category page reads this group; hair uses `area`, skincare `scope`. */
export const SCOPE_KEYS = {
  scope: ['face', 'both', 'body', 'unstated'],
  area: ['scalp', 'both', 'lengths', 'unstated'],
};
export const scopeGroupOf = (cat) => (cat.zone === HAIR ? 'area' : 'scope');

export const CATEGORIES = [
  {
    id: 'facewash', label: 'Face wash', kicker: 'CLEANSE', zone: FACE,
    blurb: 'Gel, foam, oil and micellar cleansers — the twice-daily step every routine starts with.',
    file: 'ct-data-facewash.js', global: 'CTPRODUCTS', facets: CORE_FACETS,
    featured: ['format:gel', 'format:foam', 'format:micellar', 'ing:salicylic-acid-bha', 'ing:vitamin-c', 'claim:acne', 'claim:brightening', 'free:sulfate', 'skin:oily', 'skin:dry'],
  },
  {
    id: 'toner', label: 'Toner', kicker: 'TONE', zone: FACE,
    blurb: 'Hydrating, exfoliating and balancing toners — the prep layer after cleansing.',
    file: 'ct-data-toner.js', global: 'CTPRODUCTS', facets: CORE_FACETS,
    featured: ['ing:glycolic-acid', 'ing:rose', 'ing:rice-water', 'ing:niacinamide', 'ing:hyaluronic-acid', 'free:alcohol', 'claim:pores', 'claim:hydrating', 'format:mist'],
  },
  {
    id: 'essence', label: 'Essence', kicker: 'ESSENCE', zone: FACE,
    blurb: 'Watery hydration layers from the Korean and Japanese routines — 7-skin, glass-skin, mochi-skin.',
    file: 'ct-data-essence.js', global: 'CTPRODUCTS', facets: CORE_FACETS,
    featured: ['ing:snail-mucin', 'ing:rice-water', 'ing:centella-cica', 'ing:niacinamide', 'ing:hyaluronic-acid', 'claim:korean', 'claim:brightening'],
  },
  {
    id: 'vitaminc', label: 'Vitamin C', kicker: 'SERUM', zone: FACE,
    blurb: 'Vitamin C serums and creams — the morning antioxidant, brightening step.',
    file: 'ct-data-vitaminc.js', global: 'CTPRODUCTS', facets: CORE_FACETS,
    featured: ['format:serum', 'format:cream', 'ing:ferulic-acid', 'ing:hyaluronic-acid', 'ing:niacinamide', 'claim:dark-spots', 'claim:brightening', 'claim:de-tan'],
  },
  {
    id: 'niacinamide', label: 'Niacinamide', kicker: 'SERUM', zone: FACE,
    blurb: 'Niacinamide serums for pores, oil control and even tone — the most forgiving active.',
    file: 'ct-data-niacinamide.js', global: 'CTPRODUCTS', facets: CORE_FACETS,
    featured: ['format:serum', 'ing:zinc', 'ing:hyaluronic-acid', 'ing:salicylic-acid-bha', 'claim:pores', 'claim:oil-control', 'claim:acne', 'claim:dark-spots'],
  },
  {
    id: 'retinol', label: 'Retinol', kicker: 'RETINOID', zone: FACE,
    blurb: 'Retinol, retinal and bakuchiol — the evidence-backed night-time anti-aging and texture step.',
    file: 'ct-data-retinol.js', global: 'CTPRODUCTS', facets: CORE_FACETS,
    featured: ['ing:retinol', 'ing:retinal', 'ing:bakuchiol', 'ing:peptides', 'format:serum', 'format:cream', 'claim:anti-aging', 'claim:dark-circles'],
  },
  {
    id: 'exfoliator', label: 'Exfoliator / AHA', kicker: 'EXFOLIATE', zone: BOTH,
    blurb: 'Chemical peels, AHA/PHA toners and physical scrubs — face and body, 2–3× a week.',
    file: 'ct-data-exfoliator.js', global: 'CTPRODUCTS', facets: CORE_FACETS,
    featured: ['scope:face', 'scope:body', 'ing:aha', 'ing:glycolic-acid', 'ing:lactic-acid', 'ing:mandelic-acid', 'ing:pha', 'ing:salicylic-acid-bha', 'format:scrub', 'format:peel', 'format:pads', 'claim:kp'],
  },
  {
    id: 'salicylic', label: 'Salicylic / BHA', kicker: 'EXFOLIATE', zone: BOTH,
    blurb: 'Salicylic acid for oily, acne-prone and congested skin — washes, serums, pads and body sprays.',
    file: 'ct-data-salicylic.js', global: 'CTPRODUCTS', facets: CORE_FACETS,
    featured: ['scope:face', 'scope:body', 'format:wash', 'format:serum', 'format:mist', 'format:pads', 'claim:acne', 'claim:pores', 'ing:niacinamide', 'ing:tea-tree'],
  },
  {
    id: 'moisturizer', label: 'Moisturizer', kicker: 'SEAL', zone: BOTH,
    blurb: 'Gels, creams and barrier balms — face moisturizers, with body creams kept clearly separate.',
    file: 'ct-data-moisturizer.js', global: 'CTPRODUCTS', facets: CORE_FACETS,
    featured: ['scope:face', 'scope:body', 'format:gel', 'format:cream', 'format:balm', 'ing:ceramides', 'ing:hyaluronic-acid', 'ing:urea', 'claim:barrier', 'free:non-comedogenic', 'skin:oily', 'skin:dry'],
  },
  {
    id: 'sunscreen', label: 'Sunscreen', kicker: 'PROTECT', zone: BOTH,
    blurb: 'SPF for face and body — mineral, chemical and hybrid; gels, sticks, sprays and tinted.',
    file: 'ct-data-sunscreen.js', global: 'CTPRODUCTS', facets: SUN_FACETS,
    featured: ['scope:face', 'scope:body', 'spf:50', 'spf:50+', 'pa:++++', 'sun:mineral', 'format:gel', 'format:stick', 'format:mist', 'claim:tinted', 'claim:no-white-cast', 'claim:water-resistant', 'claim:de-tan', 'ing:green-tea', 'ing:vitamin-c', 'ing:niacinamide'],
  },
  {
    id: 'facemask', label: 'Face masks', kicker: 'MASK', zone: FACE,
    blurb: 'Sheet, clay, peel-off and overnight masks — the weekly treatment step.',
    file: 'ct-data-facemask.js', global: 'CTPRODUCTS', facets: CORE_FACETS,
    featured: ['format:sheet-mask', 'format:clay-mask', 'format:peel-off', 'format:sleeping-mask', 'ing:charcoal', 'ing:turmeric', 'claim:brightening', 'claim:de-tan', 'claim:pores'],
  },
  {
    id: 'eyecream', label: 'Eye cream', kicker: 'EYE', zone: FACE,
    blurb: 'Under-eye creams, gels and patches for dark circles, puffiness and fine lines.',
    file: 'ct-data-eyecream.js', global: 'CTPRODUCTS', facets: CORE_FACETS,
    featured: ['ing:caffeine', 'ing:retinol', 'ing:peptides', 'ing:vitamin-c', 'format:patch', 'format:gel', 'claim:dark-circles', 'claim:anti-aging'],
  },
  {
    id: 'faceoil', label: 'Face oil', kicker: 'OIL', zone: FACE,
    blurb: 'Kumkumadi, rosehip, squalane and blended facial oils — the last night-time seal.',
    file: 'ct-data-faceoil.js', global: 'CTPRODUCTS', facets: CORE_FACETS,
    featured: ['ing:kumkumadi', 'ing:rosehip', 'ing:squalane', 'ing:saffron', 'ing:argan-oil', 'ing:vitamin-c', 'claim:brightening', 'claim:ayurvedic'],
  },
  {
    id: 'bodywash', label: 'Body wash', kicker: 'BATHE', zone: BODY,
    blurb: 'Body washes and shower gels — sulfate-free, moisturizing, exfoliating; men and women.',
    file: 'bw-data.js', global: 'WASHES', facets: CORE_FACETS,
    featured: ['free:sulfate', 'free:paraben', 'claim:hydrating', 'claim:exfoliating', 'claim:acne', 'claim:ayurvedic', 'ing:shea-butter', 'ing:aloe-vera', 'aud:men', 'aud:women'],
  },
  {
    id: 'bodylotion', label: 'Body lotion', kicker: 'SEAL', zone: BODY,
    blurb: 'Body lotions, creams and butters — daily moisture for legs, arms and very dry skin.',
    file: 'ct-data-bodylotion.js', global: 'CTPRODUCTS', facets: CORE_FACETS,
    featured: ['format:lotion', 'format:cream', 'format:balm', 'ing:shea-butter', 'ing:cocoa-butter', 'ing:ceramides', 'ing:urea', 'claim:dry-skin-relief', 'claim:long-lasting', 'free:fragrance'],
  },
  {
    id: 'kp', label: 'Keratosis pilaris', kicker: 'TREAT', zone: BODY,
    blurb: 'Urea, lactic-acid and ammonium-lactate body care for rough, bumpy "strawberry" skin.',
    file: 'ct-data-kp.js', global: 'CTPRODUCTS', facets: CORE_FACETS,
    featured: ['ing:urea', 'ing:lactic-acid', 'ing:ammonium-lactate', 'ing:salicylic-acid-bha', 'ing:glycolic-acid', 'claim:kp', 'format:lotion', 'format:scrub', 'format:wash'],
  },
  {
    id: 'detan', label: 'De-tan', kicker: 'TREAT', zone: BOTH,
    blurb: 'De-tan packs, scrubs, kits and washes — for fresh sun tan on face and body.',
    file: 'dt-data.js', global: 'DETANS', facets: CORE_FACETS,
    featured: ['scope:face', 'scope:body', 'format:pack', 'format:scrub', 'format:kit', 'format:wash', 'ing:coffee', 'ing:ubtan', 'ing:vitamin-c', 'ing:kojic-acid', 'aud:men', 'aud:women'],
  },
  {
    id: 'pigmentation', label: 'Old tan / pigmentation', kicker: 'PROTOCOL', zone: BOTH,
    blurb: 'The 4-step protocol for years-old tan and pigmentation — exfoliate, treat, moisturize, protect.',
    file: 'pg-data.js', global: 'PIGPRODUCTS', facets: ['step', ...SUN_FACETS],
    featured: ['step:exfoliate', 'step:treat', 'step:moisturize', 'step:protect', 'scope:face', 'scope:body', 'ing:glycolic-acid', 'ing:kojic-acid', 'ing:alpha-arbutin', 'ing:tranexamic-acid', 'ing:vitamin-c', 'ing:niacinamide'],
  },
  {
    id: 'shampoo', label: 'Shampoo', kicker: 'WASH', zone: HAIR,
    blurb: 'Everyday shampoos — sulfate-free, mild, keratin, volumising and colour-safe cleansers for the scalp.',
    file: 'hr-data-shampoo.js', global: 'HAIRPRODUCTS', facets: HAIR_FACETS,
    featured: ['free:sulfate', 'free:paraben', 'free:silicone', 'ing:keratin', 'ing:onion', 'ing:hydrolysed-protein', 'concern:dryness', 'concern:frizz', 'concern:volume', 'concern:colour-protect', 'hair:dry', 'hair:oily', 'hair:curly', 'hair:coloured'],
  },
  {
    id: 'antidandruff', label: 'Anti-dandruff', kicker: 'SCALP', zone: HAIR,
    blurb: 'Antifungal and keratolytic shampoos, lotions and scalp scrubs — ketoconazole, zinc pyrithione, piroctone olamine.',
    file: 'hr-data-antidandruff.js', global: 'HAIRPRODUCTS', facets: HAIR_FACETS,
    featured: ['ing:ketoconazole', 'ing:zinc-pyrithione', 'ing:piroctone-olamine', 'ing:selenium-sulfide', 'ing:salicylic-acid-bha', 'ing:tea-tree', 'concern:dandruff', 'concern:scalp-itch', 'concern:scalp-buildup', 'format:shampoo', 'format:scrub'],
  },
  {
    id: 'hairfall', label: 'Hair fall & growth', kicker: 'SCALP', zone: HAIR,
    blurb: 'Scalp serums, tonics and minoxidil solutions marketed for shedding and density — claims kept separate from formula evidence.',
    file: 'hr-data-hairfall.js', global: 'HAIRPRODUCTS', facets: HAIR_FACETS,
    featured: ['ing:minoxidil', 'ing:redensyl', 'ing:procapil', 'ing:anagain', 'ing:capixyl', 'ing:caffeine', 'ing:rosemary', 'ing:peptides', 'concern:hair-fall', 'concern:hair-growth', 'concern:thinning', 'format:serum', 'format:solution', 'format:shampoo'],
  },
  {
    id: 'conditioner', label: 'Conditioner', kicker: 'CONDITION', zone: HAIR,
    blurb: 'Rinse-out and leave-in conditioners — the detangling, friction-reducing step after every wash.',
    file: 'hr-data-conditioner.js', global: 'HAIRPRODUCTS', facets: HAIR_FACETS,
    featured: ['format:leave-in', 'ing:keratin', 'ing:hydrolysed-protein', 'ing:amino-acids', 'ing:argan-oil', 'concern:frizz', 'concern:damage-repair', 'concern:smoothing', 'concern:curl-definition', 'free:sulfate', 'free:silicone', 'hair:curly', 'hair:coloured'],
  },
  {
    id: 'hairmask', label: 'Hair mask', kicker: 'TREAT', zone: HAIR,
    blurb: 'Deep-conditioning masks, hair spa creams and bond-repair treatments — the weekly lengths treatment.',
    file: 'hr-data-hairmask.js', global: 'HAIRPRODUCTS', facets: HAIR_FACETS,
    featured: ['ing:keratin', 'ing:bond-builder', 'ing:hydrolysed-protein', 'ing:argan-oil', 'ing:shea-butter', 'concern:damage-repair', 'concern:split-ends', 'concern:frizz', 'concern:dryness', 'hair:damaged', 'hair:coloured', 'hair:curly'],
  },
  {
    id: 'hairoil', label: 'Hair oil', kicker: 'OIL', zone: HAIR,
    blurb: 'Pre-wash and scalp oils — coconut, almond, argan, onion and ayurvedic bhringraj / amla blends.',
    file: 'hr-data-hairoil.js', global: 'HAIRPRODUCTS', facets: HAIR_FACETS,
    featured: ['ing:coconut', 'ing:almond', 'ing:argan-oil', 'ing:onion', 'ing:bhringraj', 'ing:amla', 'ing:rosemary', 'ing:castor-oil', 'ing:hibiscus', 'concern:hair-fall', 'concern:dryness', 'concern:dandruff', 'concern:greying'],
  },
  {
    id: 'hairserum', label: 'Hair serum', kicker: 'FINISH', zone: HAIR,
    blurb: 'Leave-in serums for the lengths — frizz, shine and smoothing, usually silicone- or oil-based.',
    file: 'hr-data-hairserum.js', global: 'HAIRPRODUCTS', facets: HAIR_FACETS,
    featured: ['format:leave-in', 'format:mist', 'ing:argan-oil', 'ing:keratin', 'ing:squalane', 'ing:dimethicone-silicones', 'concern:frizz', 'concern:shine', 'concern:smoothing', 'concern:split-ends', 'hair:curly', 'hair:damaged', 'free:silicone'],
  },
  {
    id: 'haircream', label: 'Hair cream & moisturiser', kicker: 'FINISH', zone: HAIR,
    blurb: 'Leave-in creams, lotions, butters and curl creams that moisturise the lengths between washes — no rinse, no hold.',
    file: 'hr-data-haircream.js', global: 'HAIRPRODUCTS', facets: HAIR_FACETS,
    featured: ['format:leave-in', 'format:cream', 'ing:shea-butter', 'ing:argan-oil', 'ing:coconut', 'ing:glycerin', 'ing:aloe-vera', 'concern:dryness', 'concern:frizz', 'concern:curl-definition', 'concern:smoothing', 'hair:curly', 'hair:dry', 'hair:damaged'],
  },
  {
    id: 'heatprotect', label: 'Heat protectant', kicker: 'BEFORE HEAT', zone: HAIR,
    blurb: 'Sprays, serums and creams applied before a dryer, straightener or curler — film-formers that slow heat damage to the shaft.',
    file: 'hr-data-heatprotect.js', global: 'HAIRPRODUCTS', facets: HAIR_FACETS,
    featured: ['format:heat-protectant', 'format:mist', 'format:serum', 'format:cream', 'ing:dimethicone-silicones', 'ing:hydrolysed-protein', 'ing:keratin', 'ing:argan-oil', 'concern:heat-protection', 'concern:frizz', 'concern:damage-repair', 'hair:damaged', 'hair:coloured'],
  },
  {
    id: 'hairstyling', label: 'Hair wax, clay & gel', kicker: 'STYLE', zone: HAIR,
    blurb: 'Hold and texture for the lengths — wax, clay, pomade, gel, spray, mousse and powder. Scored on formula and safety, not on hold claims.',
    file: 'hr-data-hairstyling.js', global: 'HAIRPRODUCTS', facets: HAIR_FACETS,
    featured: ['format:wax', 'format:clay', 'format:pomade', 'format:gel', 'format:hair-spray', 'format:mousse', 'format:powder', 'concern:hold', 'concern:matte-finish', 'concern:volume', 'free:alcohol', 'free:paraben', 'aud:men'],
  },
];

export const ZONE_LABELS = { face: 'FACE', body: 'BODY', both: 'FACE + BODY', hair: 'HAIR' };

// Evidence-first: formula and skin-safety are read only from a verified full INCI list, trust from the
// accountable maker + ingredient transparency, experience from real buyer ratings. Seller claims score 0.
export const WEIGHTS = { ingredients: 0.40, skin: 0.25, trust: 0.20, experience: 0.15 };
export const CRITERIA = {
  ingredients: 'Formula (verified INCI)',
  skin: 'Skin & scalp safety (verified INCI)',
  trust: 'Maker accountability & transparency',
  experience: 'Buyer evidence',
};

export const ROUTINE_WEIGHTS = { evidence: 0.30, coverage: 0.24, adherence: 0.20, fit: 0.14, time: 0.12 };
export const ROUTINE_CRITERIA = {
  evidence: 'Evidence & authorship',
  coverage: 'Coverage of fundamentals',
  adherence: 'Simplicity & adherence',
  fit: 'Skin-type flexibility',
  time: 'Time cost',
};

export const PHASES = ['REMOVE', 'CLEANSE', 'BATHE', 'EXFOLIATE', 'STEAM', 'TONE', 'ESSENCE', 'MIST', 'SERUM', 'RETINOID', 'SPOT',
  'TREAT', 'MASK', 'MASSAGE', 'COLD', 'EYE', 'SEAL', 'OIL', 'PROTECT', 'SHAVE', 'HABITS', 'CARE'];

export const PHASE_RULES = [
  ['SHAVE', /shav|razor|beard-area/i],
  ['TONE', /rose-water/i],
  ['PROTECT', /sunscreen|spf|sun protection|slip:|slop:|slap:|seek:|slide:|thanaka/i],
  ['COLD', /\bice|icing|plunge|cold bath|cold eye|cool cloth|cool care|de-puff/i],
  ['STEAM', /steam|sauna|banya|hammam|heating room/i],
  ['MASSAGE', /massage|gua sha|roller|roll upward|kobido|venik|abhyanga|lymphatic|acupressure|face yoga|cheek puff|fish face|frown preventer|eye rejuvenator|upward strokes/i],
  ['EYE', /\beye\b|eye cream|eye care|under-?eye|eye mask/i],
  ['MASK', /mask(?:s|ing)?\b|sheet mask|clay|mud|detox mask|purifying mask|masque/i],
  ['EXFOLIATE', /exfoli|scrub|peel|kese|lulur|ubtan|dry-brush|polish|salicylic|glycolic|\bAHA\b|\bBHA\b|lactic|keratolytic|gentle file/i],
  ['TONE', /toner|tone\b|vinegar rinse|rose water|rosewater|floral|orange-blossom|astringent/i],
  ['MIST', /mist|spritz|midday refresh|top-ups/i],
  ['ESSENCE', /essence|7-skin|toner layers|keshousui|hydrating lotion|humectant layer|hydration loading|load hydration|light hydrator|break-time hydration|go minimal/i],
  ['OIL', /face oil|body oil|beard oil|argan|jojoba oil seal|olive-oil seal|night oil|oil nourish|oil lock-in|oil on top/i],
  ['RETINOID', /retino|tretinoin|adapalene/i],
  ['SPOT', /spot treat|spot$|targeted treatment|targeted care|targeted acti|OTC acne|antifungal/i],
  ['SERUM', /serum|ampoule|vitamin c|niacinamide|antioxidant|peptide|cica/i],
  ['REMOVE', /remover|makeup|oil-based|oil cleanse|oil \/ balm cleanse|balm cleanse|first cleanse|micellar/i],
  ['BATHE', /bathe|shower|bath\b|milk \+ honey|coconut-milk/i],
  ['TREAT', /treat|active|red-light|extraction|saffron|turmeric|tepezcohuite/i],
  ['CLEANSE', /cleanse|wash|scrap|rinse|oil pull|soap/i],
  ['SEAL', /moistur|cream|emulsion|balm|slug|occlusive|seal|lotion|hydrate|nopal|aloe|shea|butter/i],
  ['HABITS', /sleep|smok|hydration \+ nutrition|nutrition|stress|humidifier|sweat-wicking|healthy habits|lifestyle|hands off|never pick|don'ts/i],
];

export function phaseOf(step) {
  for (const [label, re] of PHASE_RULES) if (re.test(step.name)) return label;
  if (step.phase) return step.phase;
  return 'CARE';
}

export const ROUTINE_CATEGORY_LABELS = {
  core: 'Core daily',
  global: 'World style',
  method: 'Named method',
  occasion: 'Occasion',
  concern: 'Concern-driven',
};
