// Facet tagger — the single source of truth for every filter chip on the site.
// Tags are derived ONLY from the real listing text (title + specification blob);
// a tag is never emitted unless the seller's listing actually says so.
// CommonJS so the scrape generators in /home/ubuntu/pwtest can require() it too.
// The one exception is the `target:*` skin-concern group, which concerns.cjs derives from the verified INCI and the
// product type after scoring, never from the title.

const { CONCERNS } = require('./concerns.cjs');

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const GROUPS = {
  inci: { label: 'Evidence', hint: 'What the score is actually based on', mode: 'and' },
  scope: { label: 'Face / body', hint: 'Where the listing says to use it', mode: 'or' },
  area: { label: 'Scalp / lengths', hint: 'Where on the hair the listing says to use it', mode: 'or' },
  format: { label: 'Format', hint: 'Texture / form stated in the listing', mode: 'or' },
  spf: { label: 'SPF', hint: 'Sun protection factor stated', mode: 'or' },
  pa: { label: 'PA rating', hint: 'UVA rating stated', mode: 'or' },
  sun: { label: 'Sunscreen type', hint: 'Mineral / chemical / hybrid', mode: 'or' },
  ing: { label: 'Ingredients & actives', hint: 'Named in the listing', mode: 'and' },
  claim: { label: 'Benefit claims', hint: "Seller's own claims, not tested", mode: 'or' },
  free: { label: 'Free-from & safety', hint: 'Claims stated in the listing', mode: 'and' },
  skin: { label: 'Skin type', hint: 'As stated in the listing', mode: 'or' },
  hair: { label: 'Hair type', hint: 'As stated in the listing', mode: 'or' },
  concern: { label: 'Hair concern', hint: "Seller's own claims, not tested", mode: 'or' },
  target: { label: 'Skin concern', hint: 'From verified INCI actives or the product type — for matching, not proof it works', mode: 'or' },
  aud: { label: 'Audience', hint: 'Marketing audience', mode: 'or' },
  size: { label: 'Pack size', hint: 'From the stated quantity', mode: 'or' },
  rating: { label: 'Buyer rating', hint: 'Marketplace rating', mode: 'or' },
  store: { label: 'Store', hint: 'Where it was found live', mode: 'or' },
  step: { label: 'Protocol step', hint: 'Which step of the fading protocol', mode: 'or' },
};

const SCOPE = {
  body: /\bbody\b|\bhands?\b|\blegs?\b|\barms?\b|\bfeet\b|\bfoot\b|\bneck\b|underarms?|armpits?|elbows?|knees?|heels?\b|\bback\s*acne|bikini|intimate|vagin|private\s*(?:parts?|area)|pubic|\bbelly\b|\btummy\b|\bthighs?\b/,
  face: /\bface\b|facial|under[\s-]*eye|\beyes?\b|\blips?\b|cheeks?|t[\s-]*zone/,
};

// Hair products are used on the scalp, along the lengths, or both — the hair equivalent of face / body.
const AREA = {
  scalp: /\bscalp\b|dandruff|\broots?\b|hair\s*fall|hair\s*loss|hair\s*(?:re)?growth|follicl|seborrh|\bflakes?\b|flaking|itch/,
  lengths: /\blengths?\b|split\s*ends|\bhair\s*ends?\b|\bshaft\b|\bstrands?\b|mid[\s-]*length|frizz|\bcuticle\b/,
};

// Formats that only exist in hair care; kept out of the skincare tag pass so those pages are untouched.
const HAIR_FORMATS = [
  ['shampoo', 'Shampoo', /shampoo/],
  ['dry-shampoo', 'Dry shampoo', /dry\s*shampoo/],
  ['conditioner', 'Conditioner', /conditioner/],
  ['leave-in', 'Leave-in', /leave[\s-]*in/],
  ['hair-mask', 'Hair mask / spa', /hair\s*(?:mask|spa|pack)|deep\s*conditioning\s*mask/],
  ['heat-protectant', 'Heat protectant', /heat\s*protect/],
  ['solution', 'Topical solution', /topical\s*solution/],
  ['hair-tonic', 'Hair / scalp tonic', /(?:hair|scalp)\s*tonic/],
  ['wax', 'Wax', /\bwax\b/],
  ['clay', 'Clay', /\bclay\b/],
  ['pomade', 'Pomade', /pomade/],
  ['hair-spray', 'Hair spray / setting spray', /hair\s*spray|setting\s*spray|hold\s*spray|hairspray/],
  ['mousse', 'Mousse', /mousse/],
  ['paste', 'Paste / putty / fibre', /\bpaste\b|\bputty\b|\bfib(?:re|er)\b/],
  ['texture-spray', 'Texturising / sea-salt spray', /textur|sea\s*salt/],
  ['scalp-scrub', 'Scalp scrub', /scalp\s*(?:scrub|exfoliat)|scrub[^]{0,20}scalp/],
  ['keratin-treatment', 'Keratin / smoothing treatment', /keratin\s*(?:treatment|therapy|kit)|smooth(?:en)?ing\s*(?:treatment|kit|cream)|hair\s*botox|nanoplast|rebonding|brazilian\s*(?:blowout|keratin)|straightening\s*(?:cream|treatment|kit)/],
  ['hair-perfume', 'Hair perfume / mist', /hair\s*(?:perfume|mist|fragrance|scent|parfum)|hair\s*(?:&|and)\s*body\s*mist/],
  ['beard-oil', 'Beard oil', /beard\s*(?:growth\s*)?oil/],
  ['beard-wash', 'Beard wash', /beard\s*(?:wash|shampoo|cleanser)/],
  ['beard-balm', 'Beard balm / softener', /beard\s*(?:balm|butter|softener|cream|wax|serum)/],
];
/** Skincare formats that never describe a hair product (a hair "clay" is a styler, not a mud mask). */
const SKIN_ONLY_FORMATS = new Set(['sheet-mask', 'clay-mask', 'peel-off', 'sleeping-mask', 'pack', 'micellar', 'patch', 'pads', 'peel', 'bar', 'capsule',
  'wax-strip', 'depilatory', 'body-wax', 'foot-peel', 'aerosol']);
const SKIN_ONLY_INGREDIENTS = new Set(['clay']);

// Hair-relevant ingredients named on listings, on top of the shared skincare list.
const HAIR_INGREDIENTS = [
  ['Ketoconazole', /ketoconazole/], ['Zinc pyrithione', /pyrithione|\bzpto\b/], ['Piroctone olamine', /piroctone/],
  ['Selenium sulfide', /selenium\s*sulph?ide/], ['Climbazole', /climbazole/], ['Coal tar', /coal\s*tar/],
  ['Minoxidil', /minoxidil/], ['Redensyl', /redensyl/], ['Procapil', /procapil/], ['Anagain', /anagain/],
  ['Capixyl', /capixyl/], ['Baicapil', /baicapil/], ['Rosemary', /rosemary/], ['Onion', /\bonion\b|\bpyaz\b/],
  ['Bhringraj', /bhringraj|bhringadi|eclipta/], ['Amla', /\bamla\b|emblica/], ['Hibiscus', /hibiscus|\bjaba\b/],
  ['Brahmi', /brahmi|bacopa/], ['Jaborandi', /jaborandi/], ['Fenugreek', /fenugreek|\bmethi\b/],
  ['Curry leaf', /curry\s*lea/], ['Castor oil', /castor/], ['Keratin', /keratin/], ['Biotin', /biotin/],
  ['Hydrolysed protein', /hydroly[sz]ed\s*(?:wheat|soy|rice|silk|keratin|protein)|wheat\s*protein|silk\s*protein/],
  ['Amino acids', /amino\s*acids?/], ['Apple cider vinegar', /apple\s*cider|\bacv\b/],
  ['Henna', /\bhenna\b|lawsonia/], ['Bond builder', /bond\s*(?:build|repair|plex)|\bolaplex\b/],
  ['Rice water', /rice\s*water/], ['Moringa', /moringa/], ['Sesame oil', /sesame|\btil\b/],
  ['Mustard oil', /mustard|sarson/], ['Batana oil', /batana/], ['Marula oil', /marula/],
  ['Dimethicone / silicones', /dimethicone|silicone(?![\s-]*free)|cyclopentasiloxane|amodimethicone/],
  ['Panthenol', /panthenol|pro[\s-]*vitamin\s*b5|\bb5\b/], ['Ceramides', /ceramide/], ['Beeswax', /beeswax|cera\s*alba/],
  ['Starch / rice powder', /\bstarch\b|tapioca|arrowroot|rice\s*powder/], ['Formaldehyde', /formaldehyde(?![\s-]*free)|methylene\s*glycol|\bformalin\b(?![\s-]*free)/],
  ['Glyoxylic acid', /glyoxylic/], ['Cysteine', /cystein/], ['Peppermint / menthol', /peppermint|\bmint\b|menthol/], ['Cedarwood', /cedar\s*wood|\bcedar\b/],
  ['Vetiver', /vetiver/], ['Oud', /\boudh?\b|agarwood/], ['Musk', /\bmusk\b/],
];

// Hair concerns — seller claims, exactly as with skincare benefit claims: never treated as proof.
const HAIR_CONCERNS = [
  ['dandruff', 'Dandruff / flakes', /dandruff|\bflakes?\b|flaking|seborrh|\bmalassezia\b/],
  ['scalp-itch', 'Itchy scalp', /itch|\birritated\s*scalp\b/],
  ['scalp-buildup', 'Scalp build-up / clarifying', /build[\s-]*up|clarify|product\s*residue|detox\s*scalp|scalp\s*scrub/],
  ['oily-scalp', 'Oily scalp / greasiness', /oily\s*(?:scalp|hair|roots)|greasy|excess\s*(?:oil|sebum)|sebum/],
  ['hair-fall', 'Hair fall / shedding', /hair\s*fall|hair\s*loss|shedding|\bfall[\s-]*control\b/],
  ['hair-growth', 'Hair growth (claim)', /hair\s*(?:re)?growth|regrow|\bgrow(?:th|s)?\s*hair\b/],
  ['thinning', 'Thinning / density', /thinning|\bdensity\b|thicker\s*hair|thickening|\bbald/],
  ['frizz', 'Frizz control', /frizz|\bfly[\s-]*aways?\b|unmanageable/],
  ['damage-repair', 'Damage repair', /\bdamaged?\b|\brepair\b|\bbreakage\b|\bbrittle\b/],
  ['split-ends', 'Split ends', /split\s*ends/],
  ['dryness', 'Dryness / hydration', /\bdry\b(?!\s*shampoo)|dryness|hydrat|moistur|nourish/],
  ['smoothing', 'Smoothing / straightening', /smooth|straighten|\bsleek\b|anti[\s-]*frizz/],
  ['shine', 'Shine / gloss', /\bshine\b|glossy|\bgloss\b|lustre|luster|\bshiny\b/],
  ['volume', 'Volume / body', /volumi[sz]|\bvolume\b|\bbouncy\b|\blift\b/],
  ['curl-definition', 'Curl definition', /curl\s*(?:defin|enhanc|cream)|\bcurls?\b|\bcoils?\b/],
  ['colour-protect', 'Colour protection', /colou?r\s*(?:protect|safe|care|lock)|after[\s-]*colou?r/],
  ['greying', 'Premature greying (claim)', /grey|gray|white\s*hair|pigmentation\s*of\s*hair/],
  ['heat-protection', 'Heat protection', /heat\s*protect|thermal\s*protect|blow[\s-]*dry\s*protect/],
  ['scalp-health', 'Scalp health', /scalp\s*(?:health|care|barrier|microbiome|soothing)/],
  ['hold', 'Hold (styling)', /\bhold\b|\bholding\b/],
  ['matte-finish', 'Matte finish', /\bmatte\b|no\s*shine|natural\s*finish/],
  ['restyle', 'Restylable / no flakes', /re[\s-]*styl|no\s*flak|non[\s-]*flak|no\s*residue|non[\s-]*sticky/],
  ['wash-out', 'Washes out easily', /wash(?:es)?\s*out\s*easily|water[\s-]*(?:based|soluble)/],
  ['beard-growth', 'Beard growth (claim)', /beard\s*(?:growth|grow)|patchy\s*beard|thicker\s*beard/],
  ['beard-itch', 'Beard itch / beardruff / softening', /beard\s*(?:itch|dandruff)|beardruff|beard\s*soften|softer\s*beard/],
  ['odour', 'Odour / fragrance / freshness', /odou?r|\bsmell\b|\bfreshness\b|long[\s-]*lasting\s*(?:fragrance|scent|smell)/],
  ['oil-absorbing', 'Absorbs oil / between washes', /absorb|between\s*washes|no\s*water|waterless|instant\s*refresh/],
  ['detangling', 'Detangling', /detangl|tangle/],
  ['humidity', 'Humidity resistant', /humidity/],
];

const HAIR_TYPES = [
  ['dry', 'Dry hair', /\bdry\s*(?:hair|scalp)\b|for\s*dry\b/], ['oily', 'Oily hair / scalp', /\boily\b/],
  ['curly', 'Curly hair', /\bcurly\b|\bcurls?\b|\bcoily\b/], ['wavy', 'Wavy hair', /\bwavy\b|\bwaves\b/],
  ['straight', 'Straight hair', /\bstraight\s*hair\b/], ['damaged', 'Damaged hair', /\bdamaged\b|\bbrittle\b|\bbreakage\b/],
  ['coloured', 'Coloured / chemically treated', /colou?r(?:ed|[\s-]*treated)|chemically\s*treated|bleached|keratin[\s-]*treated/],
  ['fine', 'Fine / thin hair', /\bfine\s*hair\b|\bthin\s*hair\b|\blimp\b/],
  ['thick', 'Thick / coarse hair', /\bthick\s*hair\b|\bcoarse\b|\bfrizzy\s*thick\b/],
  ['textured', 'Textured / afro hair', /\btextured\b|\bafro\b|\bkinky\b/],
  ['all', 'All hair types', /all\s*hair\s*types?/],
];

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
  ['oil', 'Oil', /(?<!absorbs?\s)(?<!excess\s)\boil\b(?![\s-]*(?:free|control|balanc|absorb))|tailam|\bhuile\b/],
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
  ['wax-strip', 'Wax strips', /wax\s*strips?|strips?\s*wax|cold\s*wax\s*strips?|ready[\s-]*to[\s-]*use\s*wax/],
  ['depilatory', 'Hair-removal cream / spray', /hair\s*remov(?:al|ing|er)\s*(?:cream|lotion|spray|gel|foam|mousse)|depilator|hair\s*removal\s*cream/],
  ['body-wax', 'Body wax (hot / cold / sugar)', /\bwax\b(?![\s-]*strips?)|\bwaxing\b/],
  ['foot-peel', 'Foot peel mask / socks', /foot\s*(?:peel|mask)|peel(?:ing)?\s*socks?|exfoliating\s*socks?/],
  ['aerosol', 'Aerosol / body spray', /aerosol|body\s*spray|deo\s*spray|deodorant\s*spray|\bdeo\b/],
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
  ['Aluminium salts', /alumin(?:i)?um(?![\s-]*free)|\balcl\b/], ['Alum', /\balum\b|potassium\s*alum/], ['Baking soda', /baking\s*soda|sodium\s*bicarb/],
  ['Magnesium', /magnesium/], ['Thioglycolate', /thioglycol/], ['Lanolin', /lanolin/], ['Hydrocolloid', /hydrocolloid/],
  ['Adapalene', /adapalene/], ['Clindamycin', /clindamycin/], ['Tretinoin', /tretinoin/], ['Copper peptide', /copper\s*(?:peptide|tripeptide)|\bghk\b/],
  ['Matrixyl', /matrixyl/], ['Argireline', /argireline|acetyl\s*hexapeptide/], ['Thermal water', /thermal\s*(?:spring\s*)?water/],
  ['Sugar', /\bsugar\b|sucrose/], ['Sea salt', /sea\s*salt|epsom|dead\s*sea|himalayan\s*salt/], ['Apricot', /apricot/], ['Pumice', /pumice/],
  ['Chamomile', /chamomile|bisabolol/], ['Lavender', /lavender/], ['Calendula', /calendula/], ['Bio-oil (PurCellin)', /purcellin/],
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
  ['antiperspirant', 'Antiperspirant / sweat control', /anti[\s-]*perspirant|sweat\s*(?:control|protect|block|free)|anti[\s-]*sweat/],
  ['odour', 'Odour control / freshness', /odou?r|\bsmell\b|\bfreshness\b|fresh\s*all\s*day/],
  ['stretch-marks', 'Stretch marks', /stretch[\s-]*marks?|striae|pregnan|maternity|post[\s-]*partum|postnatal/],
  ['cracked-heels', 'Cracked heels / rough feet', /cracked\s*heels?|heel\s*(?:repair|cracks?)|rough\s*feet|callus|\bcorns?\b/],
  ['ingrown', 'Ingrown hair / razor bumps', /ingrown|razor\s*bumps?/],
  ['intimate-hygiene', 'Intimate hygiene', /intimate|vagin|feminine\s*(?:wash|hygiene)|private\s*parts?|\bv[\s-]*wash\b/],
  ['scars', 'Scars / marks', /\bscars?\b|(?:acne|pimple)\s*marks/],
  ['overnight', 'Overnight / while you sleep', /overnight|while\s*you\s*sleep/],
  ['hair-removal', 'Hair removal', /hair\s*remov|depilat|\bwaxing\b|unwanted\s*hair/],
  ['painless', 'Painless / gentle (claim)', /pain[\s-]*less|pain[\s-]*free|no\s*pain/],
  ['cooling', 'Cooling / refreshing', /cooling|refresh/],
  ['makeup', 'Makeup-related (setting / priming / removing)', /makeup|make[\s-]*up|primer/],
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
  ['ph-balanced', 'pH balanced', /ph[\s-]*balanc|ph\s*5\.5|ph\s*3\.5/],
  ['sensitive-safe', 'Sensitive-skin safe (claim)', /sensitive\s*skin/],
  ['aluminium', 'Aluminium-free', /alumin(?:i)?um[\s-]*free|no\s*alumin(?:i)?um|zero\s*alumin/],
  ['baking-soda', 'Baking-soda-free', /baking\s*soda[\s-]*free|no\s*baking\s*soda/],
  ['formaldehyde', 'Formaldehyde-free', /formaldehyde[\s-]*free|no\s*formaldehyde|formalin[\s-]*free/],
  ['gynaec', 'Gynaecologist tested', /gyn(?:a)?ecolog(?:ist|ically)[\s-]*(?:tested|approved|recommended)/],
  ['talc', 'Talc-free', /talc[\s-]*free|no\s*talc/],
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
for (const [id, label] of HAIR_FORMATS) (LABELS.format ||= {})[id] = label;
for (const [name] of HAIR_INGREDIENTS) (LABELS.ing ||= {})[slug(name)] = name;
for (const [id, label] of HAIR_CONCERNS) (LABELS.concern ||= {})[id] = label;
for (const [id, label] of HAIR_TYPES) (LABELS.hair ||= {})[id] = label;
for (const [id, label] of CONCERNS) (LABELS.target ||= {})[id] = label;
LABELS.area = { scalp: 'Scalp', lengths: 'Lengths & ends', both: 'Scalp + lengths', beard: 'Beard', unstated: 'Area not stated' };
for (let i = 1; i <= 4; i++) (LABELS.pa ||= {})['+'.repeat(i)] = 'PA' + '+'.repeat(i);

/**
 * @param {{family?: 'skin'|'hair'}} input `family` picks the tag vocabulary: skincare pages keep face/body scope,
 *   skin types and benefit claims; hair pages get scalp/lengths area, hair types and hair concerns instead.
 *   `beard` places the listing on the beard ("beard growth" / "beard itch" would otherwise read as scalp).
 * @returns {string[]} tags like 'scope:face', 'area:scalp', 'ing:niacinamide', 'spf:50'
 */
function tagsOf({ title, blob = '', qty = null, rating = null, store = null, step = null, family = 'skin', beard = false }) {
  const t = (title + ' ' + blob).toLowerCase();
  const out = [];
  const hair = family === 'hair';
  if (hair && beard) {
    out.push('area:beard');
  } else if (hair) {
    const scalp = AREA.scalp.test(t), lengths = AREA.lengths.test(t);
    out.push('area:' + (scalp && lengths ? 'both' : scalp ? 'scalp' : lengths ? 'lengths' : 'unstated'));
  } else {
    const body = SCOPE.body.test(t), face = SCOPE.face.test(t);
    out.push('scope:' + (body && face ? 'both' : body ? 'body' : face ? 'face' : 'unstated'));
  }
  for (const [id, , re] of FORMATS) if (re.test(t) && !(hair && SKIN_ONLY_FORMATS.has(id))) out.push('format:' + id);
  if (hair) for (const [id, , re] of HAIR_FORMATS) if (re.test(t)) out.push('format:' + id);
  spfTags(t, out);
  for (const [name, re] of INGREDIENTS) if (re.test(t) && !(hair && SKIN_ONLY_INGREDIENTS.has(slug(name)))) out.push('ing:' + slug(name));
  if (hair) for (const [name, re] of HAIR_INGREDIENTS) if (re.test(t)) out.push('ing:' + slug(name));
  if (hair) {
    for (const [id, , re] of HAIR_CONCERNS) if (re.test(t)) out.push('concern:' + id);
    for (const [id, , re] of HAIR_TYPES) if (re.test(t)) out.push('hair:' + id);
  } else {
    for (const [id, , re] of CLAIMS) if (re.test(t)) out.push('claim:' + id);
    for (const [id, , re] of SKIN) if (re.test(t)) out.push('skin:' + id);
  }
  for (const [id, , re] of FREE) if (re.test(t)) out.push('free:' + id);
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
