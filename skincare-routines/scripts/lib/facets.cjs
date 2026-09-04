// Facet tagger — the single source of truth for every filter chip on the site.
// Tags are derived ONLY from the real listing text (title + specification blob);
// a tag is never emitted unless the seller's listing actually says so.
// CommonJS so the scrape generators in /home/ubuntu/pwtest can require() it too.

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const GROUPS = {
  inci: { label: 'Evidence', hint: 'What the score is actually based on', mode: 'and' },
  scope: { label: 'Face / body', hint: 'Where the listing says to use it', mode: 'or' },
  format: { label: 'Format', hint: 'Texture / form stated in the listing', mode: 'or' },
  spf: { label: 'SPF', hint: 'Sun protection factor stated', mode: 'or' },
  pa: { label: 'PA rating', hint: 'UVA rating stated', mode: 'or' },
  sun: { label: 'Sunscreen type', hint: 'Mineral / chemical / hybrid', mode: 'or' },
  ing: { label: 'Ingredients & actives', hint: 'Named in the listing', mode: 'and' },
  claim: { label: 'Benefit claims', hint: "Seller's own claims, not tested", mode: 'or' },
  free: { label: 'Free-from & safety', hint: 'Claims stated in the listing', mode: 'and' },
  skin: { label: 'Skin type', hint: 'As stated in the listing', mode: 'or' },
  aud: { label: 'Audience', hint: 'Marketing audience', mode: 'or' },
  size: { label: 'Pack size', hint: 'From the stated quantity', mode: 'or' },
  rating: { label: 'Buyer rating', hint: 'Marketplace rating', mode: 'or' },
  store: { label: 'Store', hint: 'Where it was found live', mode: 'or' },
  step: { label: 'Protocol step', hint: 'Which step of the fading protocol', mode: 'or' },
};

const SCOPE = {
  body: /\bbody\b|\bhands?\b|\blegs?\b|\barms?\b|\bfeet\b|\bfoot\b|\bneck\b|underarms?|elbows?|knees?|\bback\s*acne|bikini/,
  face: /\bface\b|facial|under[\s-]*eye|\beyes?\b|\blips?\b|cheeks?|t[\s-]*zone/,
};

const FORMATS = [
  ['gel', 'Gel', /\bgel\b|gel[\s-]*cr[eè]me|gel[\s-]*cream/],
  ['cream', 'Cream', /\bcream\b|cr[eè]me\b|\bcreme\b/],
  ['lotion', 'Lotion', /\blotion\b/],
  ['foam', 'Foam', /\bfoam\b|foaming|mousse/],
  ['serum', 'Serum', /\bserum\b/],
  ['ampoule', 'Ampoule', /ampoule/],
  ['essence', 'Essence', /\bessence\b/],
  ['toner', 'Toner / tonic', /\btoner\b|\btonic\b/],
  ['mist', 'Mist / spray', /\bmist\b|\bspray\b/],
  ['stick', 'Stick', /\bstick\b/],
  ['oil', 'Oil', /\boil\b(?![\s-]*(?:free|control|balanc|absorb))|tailam|\bhuile\b/],
  ['balm', 'Balm / butter', /\bbalm\b|\bbaume\b|butter\b/],
  ['emulsion', 'Emulsion / fluid', /emulsion|\bfluid\b/],
  ['sheet-mask', 'Sheet mask', /sheet\s*mask/],
  ['clay-mask', 'Clay / mud mask', /clay|\bmud\b|multani|fuller/],
  ['peel-off', 'Peel-off mask', /peel[\s-]*off/],
  ['sleeping-mask', 'Sleeping / overnight mask', /sleeping\s*mask|overnight\s*mask|night\s*mask/],
  ['pack', 'Face / body pack', /\bpack\b(?!\s*of)/],
  ['scrub', 'Scrub', /\bscrub\b/],
  ['peel', 'Peel / peeling solution', /\bpeel\b|peeling/],
  ['pads', 'Pads / wipes', /\bpads?\b|\bwipes?\b/],
  ['powder', 'Powder', /\bpowder\b/],
  ['bar', 'Bar / soap', /\bbar\b|\bsoap\b/],
  ['patch', 'Patch', /\bpatch(?:es)?\b/],
  ['wash', 'Wash / cleanser', /\bwash\b|cleanser|cleansing/],
  ['micellar', 'Micellar water', /micellar/],
  ['roll-on', 'Roll-on', /roll[\s-]*on/],
  ['capsule', 'Capsules', /capsules?\b/],
  ['kit', 'Kit / combo / multipack', /\bkit\b|\bcombo\b|pack\s*of\s*\d|\bset\b/],
];

const INGREDIENTS = [
  ['Vitamin C', /vitamin\s*c\b|ascorb|ethyl\s*ascorbic|\bvit\s*c\b/], ['Niacinamide', /niacinamide|vitamin\s*b3\b/],
  ['Retinol', /\bretinol\b|retinoid/], ['Retinal', /\bretinal\b|retinaldehyde/], ['Bakuchiol', /bakuchiol/],
  ['Salicylic acid (BHA)', /salicylic|\bbha\b/], ['Glycolic acid', /glycolic/], ['Lactic acid', /\blactic\b/],
  ['Mandelic acid', /mandelic/], ['AHA', /\baha\b/], ['PHA', /\bpha\b|gluconolactone/], ['Azelaic acid', /azelaic/],
  ['Benzoyl peroxide', /benzoyl/], ['Urea', /\burea\b/], ['Ammonium lactate', /ammonium\s*lactate/],
  ['Colloidal oatmeal', /oatmeal|\boats?\b|avena/], ['Petrolatum', /petrolatum|petroleum\s*jelly/],
  ['Hyaluronic acid', /hyaluron/], ['Ceramides', /ceramide/], ['Peptides', /peptide/], ['Collagen', /collagen/],
  ['Kojic acid', /kojic/], ['Alpha arbutin', /arbutin/], ['Tranexamic acid', /tranexamic/], ['Glutathione', /glutathione/],
  ['Caffeine', /caffeine/], ['Coffee', /coffee|\bkaapi\b/], ['Snail mucin', /snail/], ['Rice water', /\brice\b/],
  ['Green tea', /green\s*tea|matcha/], ['Centella / cica', /centella|\bcica\b|madecassoside/], ['Tea tree', /tea\s*tree/],
  ['Aloe vera', /\baloe\b/], ['Turmeric', /turmeric|haldi|curcumin/], ['Saffron', /saffron|kesar/],
  ['Sandalwood', /sandalwood|chandan/], ['Rose', /\brose\b|rosewater|rose\s*water/], ['Honey', /\bhoney\b/],
  ['Charcoal', /charcoal/], ['Clay', /\bclay\b|kaolin|bentonite|multani/], ['Walnut', /walnut/], ['Papaya', /papaya/],
  ['Cucumber', /cucumber/], ['Neem', /\bneem\b/], ['Ubtan', /ubtan/], ['Squalane', /squalane/], ['Rosehip', /rosehip/],
  ['Kumkumadi', /kumkumadi/], ['Almond', /almond|badam/], ['Shea butter', /\bshea\b/], ['Cocoa butter', /cocoa/],
  ['Licorice', /licorice|liquorice|mulethi/], ['Vitamin E', /vitamin\s*e\b|tocopherol/], ['Vitamin B5 / panthenol', /panthenol|vitamin\s*b5\b/],
  ['Zinc', /\bzinc\b/], ['Titanium dioxide', /titanium/], ['Witch hazel', /witch\s*hazel/], ['Allantoin', /allantoin/],
  ['Glycerin', /glycerin/], ['Argan oil', /argan/], ['Jojoba', /jojoba/], ['Coconut', /coconut|nariyal/], ['Lemon', /\blemon\b/],
  ['Tomato', /tomato/], ['Strawberry', /strawberry/], ['Milk', /\bmilk\b/], ['Sea buckthorn', /buckthorn/], ['Mugwort', /mugwort/],
  ['Propolis', /propolis/], ['Heartleaf', /heartleaf|houttuynia/], ['Probiotics', /probiotic/], ['Beetroot', /beetroot/],
  ['Cherry / acerola', /cherry|acerola/], ['Watermelon', /watermelon/], ['Avocado', /avocado/], ['Olive', /\bolive\b/],
  ['Ginseng', /ginseng/], ['Yuja / yuzu', /\byuja\b|\byuzu\b/], ['Gold', /\b24k\b|\bgold\b/], ['Pearl', /\bpearl\b/],
  ['Calamine', /calamine/], ['Sulfur', /sulph?ur\b/], ['Alpha lipoic acid', /lipoic/], ['Resveratrol', /resveratrol/],
  ['Ferulic acid', /ferulic/], ['Thiamidol', /thiamidol/], ['Hydroquinone', /hydroquinone/], ['Mineral oil', /mineral\s*oil(?![\s-]*free)/],
];

const CLAIMS = [
  ['brightening', 'Brightening / glow', /brighten|\bglow|radiance|luminous/],
  ['de-tan', 'De-tan / tan removal', /de[\s-]*tan|d[\s-]*tan|tan\s*remov|anti[\s-]*tan|sun\s*tan/],
  ['dark-spots', 'Dark spots / pigmentation', /dark\s*spot|pigment|melasma|even[\s-]*tone|uneven|spot\s*correct/],
  ['whitening-claim', 'Whitening / fairness (claim)', /whitening|fairness|lightening/],
  ['anti-aging', 'Anti-aging / wrinkles', /anti[\s-]*(?:aging|ageing)|wrinkle|fine\s*lines|firming|lifting/],
  ['acne', 'Acne / pimples', /acne|pimple|breakout|blemish|\bzits?\b/],
  ['pores', 'Pores / blackheads', /\bpores?\b|blackhead|whitehead/],
  ['oil-control', 'Oil control / matte / non-greasy', /oil[\s-]*control|\bmatte\b|mattif|sebum|non[\s-]*greasy|non[\s-]*sticky/],
  ['hydrating', 'Hydrating / moisturizing', /hydrat|moisturi[sz]|nourish/],
  ['barrier', 'Barrier repair', /barrier|repair/],
  ['soothing', 'Soothing / calming', /sooth|calm|redness|irritat/],
  ['exfoliating', 'Exfoliating', /exfoliat|dead\s*skin|resurfac|smooth(?:ing|er)\s*(?:skin|texture)|texture/],
  ['dark-circles', 'Dark circles / puffiness', /dark\s*circle|puff|under[\s-]*eye/],
  ['kp', 'Rough / bumpy skin (KP)', /keratosis|\bkp\b|bumpy|strawberry\s*(?:legs|skin)|chicken\s*skin/],
  ['water-resistant', 'Water / sweat resistant', /water[\s-]*(?:resistant|proof)|sweat[\s-]*(?:resistant|proof)/],
  ['no-white-cast', 'No white cast', /no\s*white\s*cast|white[\s-]*cast[\s-]*free|invisible|transparent/],
  ['broad-spectrum', 'Broad spectrum UVA/UVB', /broad[\s-]*spectrum|uva\s*(?:\/|&|and|\+)?\s*uvb|uva\b.*uvb\b/],
  ['blue-light', 'Blue light protection', /blue[\s-]*light/],
  ['tinted', 'Tinted', /\btinted\b|\btint\b|bb\s*cream|cc\s*cream/],
  ['lightweight', 'Lightweight / fast-absorbing', /light[\s-]*weight|fast[\s-]*absorb|quick[\s-]*absorb|feather/],
  ['long-lasting', '24h / 48h / 72h', /(?:24|48|72)\s*h(?:ou)?rs?\b|(?:24|48|72)h\b/],
  ['korean', 'Korean / K-beauty', /\bkorean\b|k[\s-]*beauty|\bkorea\b/],
  ['ayurvedic', 'Ayurvedic / herbal', /ayurved|herbal|\bubtan\b/],
  ['spf-claim', 'SPF included', /\bspf\s*\d/],
  ['dry-skin-relief', 'Dry / very dry skin relief', /very\s*dry|extra\s*dry|dryness|\bxerosis\b/],
];

const FREE = [
  ['paraben', 'Paraben-free', /paraben[\s-]*free|no\s*parabens?/],
  ['sulfate', 'Sulfate / SLS-free', /sulph?ate[\s-]*free|sls[\s-]*free|no\s*sls|no\s*sulph?ates?|soap[\s-]*free/],
  ['fragrance', 'Fragrance-free', /fragrance[\s-]*free|no\s*(?:added\s*)?fragrance|unscented|perfume[\s-]*free/],
  ['alcohol', 'Alcohol-free', /alcohol[\s-]*free|no\s*alcohol/],
  ['silicone', 'Silicone-free', /silicone[\s-]*free|no\s*silicone/],
  ['mineral-oil', 'Mineral-oil-free', /mineral[\s-]*oil[\s-]*free/],
  ['oil-free', 'Oil-free', /\boil[\s-]*free\b/],
  ['oxybenzone', 'Oxybenzone-free', /oxybenzone[\s-]*free|no\s*oxybenzone/],
  ['derm', 'Dermatologist tested', /dermatolog(?:ically|ist)[\s-]*(?:tested|approved|recommended)/],
  ['non-comedogenic', 'Non-comedogenic', /non[\s-]*comedogenic/],
  ['hypoallergenic', 'Hypoallergenic', /hypo[\s-]*allergenic/],
  ['vegan', 'Vegan / cruelty-free', /\bvegan\b|cruelty[\s-]*free|peta/],
  ['toxin-free', 'Toxin / chemical-free (claim)', /toxin[\s-]*free|chemical[\s-]*free|no\s*(?:harmful\s*)?chemicals/],
  ['ph-balanced', 'pH balanced', /ph[\s-]*balanc|ph\s*5\.5/],
  ['sensitive-safe', 'Sensitive-skin safe (claim)', /sensitive\s*skin/],
];

const SKIN = [
  ['oily', 'Oily skin', /\boily\b/], ['dry', 'Dry skin', /\bdry\s*skin\b|for\s*dry\b/],
  ['combination', 'Combination skin', /combination/], ['sensitive', 'Sensitive skin', /sensitive/],
  ['normal', 'Normal skin', /\bnormal\s*skin\b/], ['acne-prone', 'Acne-prone', /acne[\s-]*prone/],
  ['all', 'All skin types', /all\s*skin\s*types?/], ['mature', 'Mature skin', /mature\s*skin|ag(?:e|ing)\s*skin/],
];

function spfTags(t, out) {
  const m = t.match(/spf\s*(\d{2,3})\s*(\+)?/);
  if (m) {
    const v = parseInt(m[1], 10);
    if (v >= 100) out.push('spf:100');
    else if (v >= 60) out.push('spf:60');
    else if (v > 50 || (v === 50 && m[2])) out.push('spf:50+');
    else if (v >= 50) out.push('spf:50');
    else if (v >= 40) out.push('spf:40');
    else if (v >= 30) out.push('spf:30');
    else if (v >= 15) out.push('spf:15');
  }
  const pa = t.match(/\bpa\s*(\+{1,4})/);
  if (pa) out.push('pa:' + pa[1]);
  if (/mineral|physical|zinc\s*oxide|titanium\s*dioxide/.test(t) && /sunscreen|\bspf\b/.test(t)) out.push('sun:mineral');
  if (/hybrid/.test(t) && /sunscreen|\bspf\b/.test(t)) out.push('sun:hybrid');
  else if (/chemical\s*sunscreen|avobenzone|octinoxate|octocrylene|homosalate|tinosorb|uvinul|mexoryl/.test(t)) out.push('sun:chemical');
}

function sizeTag(qtyMl) {
  if (!qtyMl) return null;
  if (qtyMl <= 50) return 'size:travel';
  if (qtyMl <= 120) return 'size:standard';
  if (qtyMl <= 250) return 'size:large';
  return 'size:xl';
}

function ratingTag(rating) {
  const r = rating ? Number(rating) : NaN;
  if (Number.isNaN(r)) return 'rating:none';
  if (r >= 4.5) return 'rating:4.5';
  if (r >= 4.0) return 'rating:4.0';
  if (r >= 3.5) return 'rating:3.5';
  return 'rating:low';
}

const LABELS = { scope: {
  face: 'Face', body: 'Body', both: 'Face + body', unstated: 'Scope not stated' },
  inci: { full: 'Full INCI list published', partial: 'Key-ingredients line only', none: 'No ingredient list', 'brand-site': 'INCI read from brand website', secondary: 'INCI from third-party database', 'no-fragrance': 'No fragrance / allergen on INCI', 'pharma-maker': 'Dermatology / pharma maker' },
  spf: { 15: 'SPF 15–29', 30: 'SPF 30–39', 40: 'SPF 40–49', 50: 'SPF 50', '50+': 'SPF 50+', 60: 'SPF 60–99', 100: 'SPF 100+' },
  sun: { mineral: 'Mineral / physical', chemical: 'Chemical', hybrid: 'Hybrid' },
  size: { travel: 'Travel (≤50 ml/g)', standard: 'Standard (51–120)', large: 'Large (121–250)', xl: 'XL (250+)' },
  rating: { 4.5: '4.5★ and up', 4.0: '4.0–4.4★', 3.5: '3.5–3.9★', low: 'Below 3.5★', none: 'No rating yet' },
  aud: { men: 'Men', women: 'Women', kids: 'Kids / baby', unisex: 'Unisex / not stated' },
  store: { flipkart: 'Flipkart', amazon: 'Amazon' },
};
for (const [id, label] of FORMATS.map(([i, l]) => [i, l])) (LABELS.format ||= {})[id] = label;
for (const [name] of INGREDIENTS) (LABELS.ing ||= {})[slug(name)] = name;
for (const [id, label] of CLAIMS) (LABELS.claim ||= {})[id] = label;
for (const [id, label] of FREE) (LABELS.free ||= {})[id] = label;
for (const [id, label] of SKIN) (LABELS.skin ||= {})[id] = label;
for (let i = 1; i <= 4; i++) (LABELS.pa ||= {})['+'.repeat(i)] = 'PA' + '+'.repeat(i);

/** @returns {string[]} tags like 'scope:face', 'ing:niacinamide', 'spf:50' */
function tagsOf({ title, blob = '', qty = null, rating = null, store = null, step = null }) {
  const t = (title + ' ' + blob).toLowerCase();
  const out = [];
  const body = SCOPE.body.test(t), face = SCOPE.face.test(t);
  out.push('scope:' + (body && face ? 'both' : body ? 'body' : face ? 'face' : 'unstated'));
  for (const [id, , re] of FORMATS) if (re.test(t)) out.push('format:' + id);
  spfTags(t, out);
  for (const [name, re] of INGREDIENTS) if (re.test(t)) out.push('ing:' + slug(name));
  for (const [id, , re] of CLAIMS) if (re.test(t)) out.push('claim:' + id);
  for (const [id, , re] of FREE) if (re.test(t)) out.push('free:' + id);
  for (const [id, , re] of SKIN) if (re.test(t)) out.push('skin:' + id);
  const men = /\bmen\b|for\s*men|\bmale\b|\bhim\b/.test(t) && !/women/.test(t);
  const women = /women|\bher\b|\bgirls?\b/.test(t) && !men;
  const kids = /\bkids?\b|\bbaby\b|babies|children|toddler/.test(t);
  out.push('aud:' + (kids ? 'kids' : men ? 'men' : women ? 'women' : 'unisex'));
  const size = sizeTag(qty);
  if (size) out.push(size);
  out.push(ratingTag(rating));
  if (store) out.push('store:' + slug(store));
  if (step) out.push('step:' + slug(step));
  return [...new Set(out)];
}

function labelFor(tag) {
  const [g, ...rest] = tag.split(':');
  const id = rest.join(':');
  if (g === 'step') return id.toUpperCase();
  return (LABELS[g] && LABELS[g][id]) || id;
}

module.exports = { GROUPS, LABELS, tagsOf, labelFor, slug };
