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
  area: ['scalp', 'both', 'lengths', 'beard', 'unstated'],
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
    id: 'hydratingcream', label: 'Hydrating hair cream', kicker: 'HYDRATE', zone: HAIR,
    blurb: 'Leave-in creams, lotions, milks and butters whose own listing names a moisture purpose — hydrating, moisturising, nourishing, for dry hair. The name is a filter only; the formula is what gets scored.',
    file: 'hr-data-hydratingcream.js', global: 'HAIRPRODUCTS', facets: HAIR_FACETS,
    featured: ['format:leave-in', 'format:cream', 'ing:glycerin', 'ing:hyaluronic-acid', 'ing:shea-butter', 'ing:argan-oil', 'ing:coconut', 'ing:aloe-vera', 'concern:dryness', 'concern:frizz', 'concern:damage-repair', 'hair:dry', 'hair:damaged', 'hair:curly'],
  },
  {
    id: 'hydratingserum', label: 'Hydrating hair serum', kicker: 'HYDRATE', zone: HAIR,
    blurb: 'Leave-in serums and mists whose own listing names a moisture purpose — hydrating, moisturising, hyaluronic, overnight, for dry hair. The name is a filter only; the formula is what gets scored.',
    file: 'hr-data-hydratingserum.js', global: 'HAIRPRODUCTS', facets: HAIR_FACETS,
    featured: ['format:leave-in', 'format:mist', 'ing:hyaluronic-acid', 'ing:glycerin', 'ing:argan-oil', 'ing:keratin', 'ing:dimethicone-silicones', 'concern:dryness', 'concern:frizz', 'concern:smoothing', 'concern:damage-repair', 'hair:dry', 'hair:damaged', 'free:silicone'],
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
  // ── Face: spot care, mist, barrier, peptides, azelaic, sheet masks ─────────────────────────────────────────────────
  {
    id: 'acnespot', label: 'Acne spot treatment & patches', kicker: 'SPOT', zone: FACE,
    blurb: 'Hydrocolloid pimple patches, spot gels and drying lotions dabbed on a single pimple — benzoyl peroxide, salicylic, adapalene, sulfur. Not face washes or whole-face serums.',
    file: 'nx-data-acnespot.js', global: 'NXPRODUCTS', facets: CORE_FACETS,
    featured: ['format:patch', 'format:gel', 'format:cream', 'ing:hydrocolloid', 'ing:benzoyl-peroxide', 'ing:salicylic-acid-bha', 'ing:adapalene', 'ing:tea-tree', 'ing:sulfur', 'claim:overnight', 'claim:scars', 'skin:acne-prone', 'skin:oily'],
  },
  {
    id: 'facemist', label: 'Face mist / spray', kicker: 'MIST', zone: FACE,
    blurb: 'Hydrating, soothing and thermal-water face mists for the midday spritz — not body mists, hair mists or makeup setting sprays.',
    file: 'nx-data-facemist.js', global: 'NXPRODUCTS', facets: CORE_FACETS,
    featured: ['ing:rose', 'ing:thermal-water', 'ing:hyaluronic-acid', 'ing:aloe-vera', 'ing:green-tea', 'ing:cucumber', 'ing:centella-cica', 'claim:hydrating', 'claim:soothing', 'claim:cooling', 'claim:makeup', 'free:alcohol', 'skin:sensitive'],
  },
  {
    id: 'barriercream', label: 'Barrier / ceramide repair cream', kicker: 'REPAIR', zone: FACE,
    blurb: 'Ceramide, cica and panthenol creams and balms that rebuild a compromised face barrier — Cicaplast, Cicalfate, Cicabio and their Indian rivals. Body lotions have their own page.',
    file: 'nx-data-barriercream.js', global: 'NXPRODUCTS', facets: CORE_FACETS,
    featured: ['ing:ceramides', 'ing:centella-cica', 'ing:vitamin-b5-panthenol', 'ing:niacinamide', 'ing:squalane', 'ing:colloidal-oatmeal', 'format:cream', 'format:balm', 'claim:barrier', 'claim:soothing', 'free:fragrance', 'skin:sensitive', 'skin:dry'],
  },
  {
    id: 'peptideserum', label: 'Peptide & collagen serum', kicker: 'SERUM', zone: FACE,
    blurb: 'Signal-peptide and collagen serums, ampoules and boosters for firmness and fine lines — Matrixyl, Argireline, copper peptides, multi-peptide blends.',
    file: 'nx-data-peptideserum.js', global: 'NXPRODUCTS', facets: CORE_FACETS,
    featured: ['ing:peptides', 'ing:collagen', 'ing:copper-peptide', 'ing:matrixyl', 'ing:argireline', 'ing:hyaluronic-acid', 'ing:niacinamide', 'ing:retinol', 'format:serum', 'format:ampoule', 'claim:anti-aging', 'claim:korean', 'skin:mature'],
  },
  {
    id: 'azelaic', label: 'Azelaic acid', kicker: 'TREAT', zone: FACE,
    blurb: 'Azelaic acid gels, creams and serums (10–20%) for redness, acne and post-acne marks — the pregnancy-safe active dermatologists reach for.',
    file: 'nx-data-azelaic.js', global: 'NXPRODUCTS', facets: CORE_FACETS,
    featured: ['ing:azelaic-acid', 'ing:niacinamide', 'ing:salicylic-acid-bha', 'ing:tranexamic-acid', 'format:gel', 'format:cream', 'format:serum', 'claim:acne', 'claim:dark-spots', 'claim:soothing', 'skin:acne-prone', 'skin:sensitive'],
  },
  {
    id: 'sheetmask', label: 'Sheet masks', kicker: 'MASK', zone: FACE,
    blurb: 'Single-use fabric, bio-cellulose and hydrogel sheet masks soaked in essence — split out from the wash-off, clay and sleeping masks on the Face mask page.',
    file: 'nx-data-sheetmask.js', global: 'NXPRODUCTS', facets: CORE_FACETS,
    featured: ['ing:hyaluronic-acid', 'ing:snail-mucin', 'ing:centella-cica', 'ing:rice-water', 'ing:green-tea', 'ing:vitamin-c', 'ing:collagen', 'ing:aloe-vera', 'claim:korean', 'claim:brightening', 'claim:hydrating', 'claim:soothing', 'format:kit', 'skin:dry', 'skin:oily'],
  },
  // ── Body: scrub, oil & butter, hand / foot, deodorant, intimate, body SPF, stretch marks, hair removal ───────────
  {
    id: 'bodyscrub', label: 'Body scrub / exfoliator', kicker: 'EXFOLIATE', zone: BODY,
    blurb: 'Sugar, salt, coffee and walnut body scrubs plus chemical body exfoliants — for the shower, not the face (face scrubs live on the Exfoliator page).',
    file: 'nx-data-bodyscrub.js', global: 'NXPRODUCTS', facets: CORE_FACETS,
    featured: ['ing:coffee', 'ing:sugar', 'ing:sea-salt', 'ing:walnut', 'ing:turmeric', 'ing:glycolic-acid', 'ing:salicylic-acid-bha', 'ing:shea-butter', 'claim:de-tan', 'claim:brightening', 'claim:kp', 'claim:ingrown', 'free:paraben', 'aud:men'],
  },
  {
    id: 'bodyoil', label: 'Body oil & body butter', kicker: 'NOURISH', zone: BODY,
    blurb: 'Body oils, whipped butters and balms for after the shower — almond, coconut, argan, shea, cocoa. Oil-phase formulas are judged on their own INCI rules.',
    file: 'nx-data-bodyoil.js', global: 'NXPRODUCTS', facets: CORE_FACETS,
    featured: ['format:oil', 'format:balm', 'ing:shea-butter', 'ing:cocoa-butter', 'ing:almond', 'ing:coconut', 'ing:argan-oil', 'ing:jojoba', 'ing:vitamin-e', 'ing:squalane', 'claim:hydrating', 'claim:dry-skin-relief', 'claim:brightening', 'free:mineral-oil'],
  },
  {
    id: 'handfoot', label: 'Hand cream · foot cream · cracked heels', kicker: 'HANDS & FEET', zone: BODY,
    blurb: 'Hand creams, foot creams, heel balms and foot peel masks — urea, lactic acid, shea and petrolatum for the driest skin on the body.',
    file: 'nx-data-handfoot.js', global: 'NXPRODUCTS', facets: CORE_FACETS,
    featured: ['ing:urea', 'ing:shea-butter', 'ing:glycerin', 'ing:lactic-acid', 'ing:salicylic-acid-bha', 'ing:petrolatum', 'ing:vitamin-e', 'format:cream', 'format:balm', 'format:foot-peel', 'claim:cracked-heels', 'claim:dry-skin-relief', 'claim:hydrating', 'free:paraben'],
  },
  {
    id: 'deodorant', label: 'Deodorant & antiperspirant', kicker: 'UNDERARM', zone: BODY,
    blurb: 'Roll-ons, sticks, sprays and deo creams. Antiperspirant aluminium salts are the only regulated sweat-blocking actives; everything else is odour control or fragrance, and fragrance is a safety debit here too.',
    file: 'nx-data-deodorant.js', global: 'NXPRODUCTS', facets: CORE_FACETS,
    featured: ['format:roll-on', 'format:stick', 'format:aerosol', 'format:cream', 'claim:antiperspirant', 'claim:odour', 'claim:long-lasting', 'ing:aluminium-salts', 'ing:alum', 'ing:baking-soda', 'ing:magnesium', 'free:aluminium', 'free:alcohol', 'free:baking-soda', 'aud:men', 'aud:women'],
  },
  {
    id: 'intimatewash', label: 'Intimate wash', kicker: 'INTIMATE', zone: BODY,
    blurb: 'pH-matched external intimate washes, foams and wipes — lactic acid, tea tree, aloe. Rinse-off; the claims are the seller\u2019s, the formula is what gets scored.',
    file: 'nx-data-intimatewash.js', global: 'NXPRODUCTS', facets: CORE_FACETS,
    featured: ['ing:lactic-acid', 'ing:tea-tree', 'ing:aloe-vera', 'ing:probiotics', 'ing:neem', 'format:foam', 'format:wash', 'format:pads', 'free:ph-balanced', 'free:gynaec', 'free:sulfate', 'free:paraben', 'claim:odour', 'aud:women', 'aud:men'],
  },
  {
    id: 'bodysunscreen', label: 'Body sunscreen', kicker: 'PROTECT', zone: BODY,
    blurb: 'Sunscreen lotions, sprays and sticks whose own listing names the body, arms, legs or neck — split out from the face-first Sunscreen page. Same UV-filter and UVA checks.',
    file: 'nx-data-bodysunscreen.js', global: 'NXPRODUCTS', facets: SUN_FACETS,
    featured: ['spf:50', 'spf:50+', 'pa:++++', 'sun:mineral', 'sun:hybrid', 'format:lotion', 'format:mist', 'format:stick', 'format:gel', 'claim:water-resistant', 'claim:no-white-cast', 'claim:de-tan', 'claim:broad-spectrum', 'free:oxybenzone'],
  },
  {
    id: 'stretchmark', label: 'Stretch-mark cream', kicker: 'MARKS', zone: BODY,
    blurb: 'Creams, oils and butters marketed for stretch marks and pregnancy skin — centella and retinoids have trial evidence; cocoa butter and oils mostly do not, and are scored accordingly.',
    file: 'nx-data-stretchmark.js', global: 'NXPRODUCTS', facets: CORE_FACETS,
    featured: ['ing:centella-cica', 'ing:hyaluronic-acid', 'ing:shea-butter', 'ing:cocoa-butter', 'ing:vitamin-e', 'ing:collagen', 'ing:peptides', 'format:cream', 'format:oil', 'format:balm', 'claim:stretch-marks', 'claim:scars', 'free:paraben'],
  },
  {
    id: 'hairremoval', label: 'Hair-removal cream & wax strips', kicker: 'REMOVE', zone: BODY,
    blurb: 'Depilatory creams and sprays (thioglycolate), cold-wax strips and body waxes — body care, kept off every hair page. Rosin in wax strips is a declared contact allergen.',
    file: 'nx-data-hairremoval.js', global: 'NXPRODUCTS', facets: CORE_FACETS,
    featured: ['format:depilatory', 'format:wax-strip', 'format:body-wax', 'format:mist', 'format:powder', 'ing:aloe-vera', 'ing:shea-butter', 'claim:painless', 'claim:ingrown', 'claim:soothing', 'skin:sensitive', 'scope:body', 'scope:both', 'aud:men', 'aud:women'],
  },
  // ── Hair: dry shampoo, scalp scrub, scalp tonic, leave-in, hair spray, keratin kits, hair perfume, beard ────────
  {
    id: 'dryshampoo', label: 'Dry shampoo', kicker: 'REFRESH', zone: HAIR,
    blurb: 'Starch and powder sprays that absorb scalp oil between washes — a refresh, not a clean. Split out from the Shampoo page.',
    file: 'nx-data-dryshampoo.js', global: 'NXPRODUCTS', facets: HAIR_FACETS,
    featured: ['format:dry-shampoo', 'format:powder', 'format:mist', 'ing:starch-rice-powder', 'ing:charcoal', 'ing:rice-water', 'concern:oil-absorbing', 'concern:oily-scalp', 'concern:volume', 'free:talc', 'free:sulfate', 'hair:oily', 'concern:odour'],
  },
  {
    id: 'scalpscrub', label: 'Scalp scrub / exfoliator', kicker: 'SCALP', zone: HAIR,
    blurb: 'Sugar, salt and charcoal scalp scrubs plus salicylic / glycolic scalp exfoliants used before shampoo to lift build-up and flakes.',
    file: 'nx-data-scalpscrub.js', global: 'NXPRODUCTS', facets: HAIR_FACETS,
    featured: ['format:scalp-scrub', 'format:scrub', 'ing:salicylic-acid-bha', 'ing:charcoal', 'ing:sea-salt', 'ing:sugar', 'ing:tea-tree', 'ing:apple-cider-vinegar', 'concern:scalp-buildup', 'concern:dandruff', 'concern:oily-scalp', 'concern:scalp-itch', 'free:sulfate', 'hair:oily'],
  },
  {
    id: 'scalptonic', label: 'Scalp tonic & growth lotion', kicker: 'GROWTH', zone: HAIR,
    blurb: 'Leave-on scalp tonics, topical solutions and growth serums — minoxidil, redensyl, procapil, rosemary, peptides. Split out from the hair-fall shampoos; minoxidil is the only grade-A active.',
    file: 'nx-data-scalptonic.js', global: 'NXPRODUCTS', facets: HAIR_FACETS,
    featured: ['format:solution', 'format:hair-tonic', 'format:serum', 'format:mist', 'ing:minoxidil', 'ing:redensyl', 'ing:procapil', 'ing:anagain', 'ing:rosemary', 'ing:caffeine', 'ing:biotin', 'ing:peptides', 'concern:hair-fall', 'concern:hair-growth', 'concern:thinning', 'aud:men', 'aud:women'],
  },
  {
    id: 'leavein', label: 'Leave-in conditioner', kicker: 'LEAVE-IN', zone: HAIR,
    blurb: 'Leave-in conditioners, detangling sprays and conditioning milks that stay in the lengths — split out from the styling-first Hair cream page.',
    file: 'nx-data-leavein.js', global: 'NXPRODUCTS', facets: HAIR_FACETS,
    featured: ['format:leave-in', 'format:mist', 'format:cream', 'format:lotion', 'ing:argan-oil', 'ing:shea-butter', 'ing:keratin', 'ing:dimethicone-silicones', 'ing:coconut', 'concern:detangling', 'concern:frizz', 'concern:dryness', 'concern:curl-definition', 'hair:curly', 'hair:dry', 'free:silicone'],
  },
  {
    id: 'hairspray', label: 'Hair spray / setting spray', kicker: 'HOLD', zone: HAIR,
    blurb: 'Aerosol and pump hair sprays that fix a finished style — film-forming polymers in alcohol. Split out from the wax / clay / gel page; makeup setting sprays and heat protectants are excluded.',
    file: 'nx-data-hairspray.js', global: 'NXPRODUCTS', facets: HAIR_FACETS,
    featured: ['format:hair-spray', 'format:mist', 'concern:hold', 'concern:humidity', 'concern:frizz', 'concern:shine', 'concern:volume', 'concern:restyle', 'free:alcohol', 'free:paraben', 'aud:men', 'aud:women'],
  },
  {
    id: 'keratinkit', label: 'Keratin / smoothening treatment kits', kicker: 'SMOOTH', zone: HAIR,
    blurb: 'At-home keratin, smoothening, "hair botox" and nanoplastia treatments sealed in with heat. Formaldehyde / methylene glycol on the INCI is the heaviest safety debit on the site.',
    file: 'nx-data-keratinkit.js', global: 'NXPRODUCTS', facets: HAIR_FACETS,
    featured: ['format:keratin-treatment', 'format:kit', 'format:cream', 'ing:keratin', 'ing:hydrolysed-protein', 'ing:formaldehyde', 'ing:cysteine', 'concern:smoothing', 'concern:shine', 'concern:dryness', 'concern:frizz', 'concern:damage-repair', 'free:formaldehyde', 'hair:curly', 'hair:damaged'],
  },
  {
    id: 'hairperfume', label: 'Hair perfume / mist', kicker: 'SCENT', zone: HAIR,
    blurb: 'Hair perfumes and scented hair mists. Every one is a fragrance product by design, so the fragrance and EU-allergen debits apply to all of them — the ranking separates the rest of the formula.',
    file: 'nx-data-hairperfume.js', global: 'NXPRODUCTS', facets: HAIR_FACETS,
    featured: ['format:hair-perfume', 'format:mist', 'ing:musk', 'ing:rose', 'ing:niacinamide', 'ing:rosemary', 'concern:odour', 'concern:shine', 'concern:frizz', 'concern:dryness', 'free:alcohol', 'free:vegan', 'free:paraben', 'aud:women', 'aud:unisex'],
  },
  {
    id: 'beard', label: 'Beard oil, wash & balm', kicker: 'BEARD', zone: HAIR,
    blurb: 'Beard oils, washes, balms and softeners — kept off every scalp and lengths page. Oils are judged on the anhydrous-oil INCI rules; washes on surfactant mildness.',
    file: 'nx-data-beard.js', global: 'NXPRODUCTS', facets: HAIR_FACETS,
    featured: ['format:beard-oil', 'format:beard-wash', 'format:beard-balm', 'format:oil', 'ing:argan-oil', 'ing:jojoba', 'ing:almond', 'ing:castor-oil', 'ing:cedarwood', 'ing:vitamin-e', 'concern:beard-growth', 'concern:beard-itch', 'concern:dryness', 'free:sulfate', 'free:paraben'],
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
