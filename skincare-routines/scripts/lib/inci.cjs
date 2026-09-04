// INCI text → verified ingredient list. Decides whether a listing's ingredient text is a FULL declared list
// (scoreable), a seller-chosen "key ingredients" line (not evidence), garbled/unreadable text, or absent.
const { ACTIVES, MILD_SURFACTANTS, ONE_PERCENT_MARKERS, WATER_FIRST } = require('./inci-kb.cjs');
const { FLAGS } = require('./inci-flags.cjs');

// Broad recogniser for INCI-looking names: chemical suffixes, botanical Latin forms, colour-index codes …
const INCI_LIKE = /(?:extract|oil|butter|water|juice|powder|seed|leaf|root|flower|fruit|ferment|filtrate|peg-\d|ppg-\d|polyquaternium|^ci\s?\d{5}|acrylat|copolymer|crosspolymer|glyceryl|sodium|potassium|disodium|tetrasodium|ammonium|magnesium|calcium|cetyl|stearyl|cetearyl|behenyl|steareth|ceteareth|laureth|dimethicon|siloxane|silica|carbomer|gum\b|alcohol|acid\b|glycol|glucoside|betaine|sulf|isethionate|sarcosinate|glutamate|glycinate|taurate|hydroxide|chloride|edta|tocopher|panthenol|allantoin|urea|ceramide|peptide|hyaluron|niacinamide|retin|ascorb|paraben|phenoxyethanol|benzoate|sorbate|ethylhexylglycerin|capryl|capric|triglyceride|stearate|palmitate|myristate|oleate|laurate|lactate|citrate|phosphate|carbonate|oxide|zinc|titanium|kaolin|bentonite|mica|talc|fragrance|parfum|aroma|linalool|limonene|citral|geraniol|citronellol|eugenol|coumarin|benzyl|cinnamal|hexyl|ionone|salicyl|lactone|methoxycinnamate|octocrylene|homosalate|avobenzone|benzophenone|triazine|triazone|camphor|menthol|ethanol|isopropyl|butylene|propanediol|pentylene|hexylene|propylene|glycerin|glycerine|aqua|squalane|squalene|lecithin|xanthan|cellulose|dextrin|starch|sorbitol|sorbitan|polysorbate|poloxamer|polyacrylate|carrageenan|alginate|chitosan|collagen|elastin|keratin|caffeine|adenosine|arbutin|kojic|tranexamic|azelaic|glycolic|mandelic|gluconolactone|bakuchiol|resveratrol|ubiquinone|bisabolol|madecassoside|asiaticoside|glutathione|hydroquinone|petrolatum|paraffin|cera\b|wax|beeswax|lanolin|cholesterol|phytosphingosine|sphingo|lipid|amine|amide|imidazol|thiazol|hydantoin|quaternium|triclosan|dehydroacetate|hydroxamic|butylcarbamate|bht\b|bha\b|edta|phenyl|ethyl|methyl|butyl|propyl|dodecane|hexadecane|alkane|olefin|benzoyl|sulphate|saponin|honey|mel\b|propolis|royal jelly|snail|secretion|mucin|galactomyces|saccharomyces|bifida|lactobacillus|aloe|vera|barbadensis|camellia|sinensis|centella|asiatica|glycyrrhiza|curcuma|azadirachta|ocimum|santalum|crocus|rosa|prunus|simmondsia|argania|helianthus|cocos|nucifera|oryza|sativa|avena|butyrospermum|parkii|theobroma|cacao|persea|olea|europaea|vitis|vinifera|punica|citrus|melaleuca|mentha|lavandula|eucalyptus|rosmarinus|chamomilla|calendula|hamamelis|salix|hippophae|vaccinium|morus|scutellaria|houttuynia|portulaca|artemisia|panax|ginseng|licorice|liquorice|niacin|biotin|pyridoxine|thiamine|riboflavin|folic|cyanocobalamin|caramel|colou?r|dye|lake|pigment)/i;

// Modern excipients the suffix recogniser misses: polyols / sugars, amino acids, esters, silicones, peptides, polymers, vitamins.
const INCI_LIKE_2 = /(?:xylitol|anhydroxylitol|octyldodecanol|isostearyl|isocetyl|isononyl|isononanoate|neopentanoate|ethylhexyl|\boctyl|\bdecyl|undecane|tridecane|dicaprylyl|isododecane|isohexadecane|\bether\b|\besters?\b|trehalose|sucrose|glucose|fructose|maltose|erythritol|mannitol|maltodextrin|cyclodextrin|dextran|pectin|\bagar\b|pullulan|\balgin\b|sclerotium|fucoidan|hydroxyacetophenone|pantolactone|ectoin|serine|arginine|glycine|proline|alanine|lysine|histidine|threonine|valine|leucine|glutamine|aspart|amino acid|hydrogenated|hydroly[sz]ed|coco-|cocoyl|glycereth|methicone|silsesquioxane|polymethyl|nylon|polyethylene|polyglyceryl|polyglutamic|polylysine|polyvinyl|\bpvp\b|hydroxypropyl|hydroxyethyl|cetrimonium|behentrimonium|stearalkonium|cyclopentasiloxane|cyclohexasiloxane|caprylhydroxamic|gluconate|lactoyl|lauroyl|palmitoyl|acetyl|dipeptide|tripeptide|tetrapeptide|pentapeptide|hexapeptide|oligopeptide|thiamine|riboflavin|pyridoxine|biotin|folic|cyanocobalamin|ascorbyl|tocotrienol|phytosterol|phytate|phytic|inositol|spirulina|chlorella|laminaria|chondrus|porphyra|\bulva\b|tromethamine|aminomethyl propanol|triethanolamine|dipropylene|dicaprate|dilinoleate|succinate|adipate|sebacate|malate|tartrate|fumarate|glycolate|pyrrolidone|\bpca\b|hydroxystearate|ricinoleate|behenate|arachidyl|myristyl|lauryl|undecylenate|glycyrrhetinate|dipotassium|ferulic|trisodium|silanetriol|ethylhexylglycerin|hexanediol|heptanol|octanediol|decylene|hydroxypinacolone|retinyl|retinal|bakuchiol|lipoic|carnosine|glucosamine|glucan|sodium hyaluronate|hyaluronate|hydroxyapatite|aluminum|aluminium|hydroxide|tin oxide|iron oxides?|bismuth|cerium|barium|manganese)/;
const inciLike = (t) => INCI_LIKE.test(t) || INCI_LIKE_2.test(t);
// Common-name words alone ("almond oil", "aloe vera", "honey") do not prove an INCI declaration; STRICT needs a chemical or Latin form.
const GENERIC_WORD = /^(?:[a-z]+\s+)?(?:oil|extract|water|juice|powder|seed|leaf|root|flower|fruit|butter|wax|honey|colou?r|dye|milk|gel|vera|aloe|clay|mud|salt|sugar|vinegar|tea|coffee|rice|turmeric|saffron|sandalwood|neem|tulsi|rose|lemon|orange|papaya|cucumber|tomato|potato|carrot|beetroot|almond|walnut|apricot|coconut|olive|sesame|jojoba|argan|castor|mustard|rosemary|lavender|jasmine|hibiscus|mint|basil|ginger|garlic|onion|charcoal|pearl|gold|silver|multani mitti|besan|chandan|kesar|haldi|ubtan)(?:\s+(?:oil|extract|water|juice|powder|seed|leaf|root|flower|fruit|butter|wax|milk|gel))?$/;
const CODE_JUNK = /^[a-z]{0,5}[\d./-]{4,}[a-z]{0,3}\d*$|^[^aeiouy\s]{6,}$/;   // whole-token batch / article codes ("FILI.1747.V00"), vowel-less garbage — corruption signals, not ingredients ("C12-15 Alkyl Benzoate" is a real INCI name)
const VAGUE = /\b(?:base|preservatives?|excipients?|q\.?s\.?|ext|etc|actives?|fragrance base|colou?rs?)$|^(?:approved|permitted|mild|natural|herbal)\b/;   // "mild cleansing base", "approved excipients" — not a declaration
const CODE_LIKE = /^[a-z]{0,5}[\d./-]{4,}|^\d+\s*\w*\s*(?:extracts?|oils?|herbs?|actives?)$|^(?:and|other|others|etc|more|q\.?s\.?|base|excipients?)$/;

const norm = (s) => s.toLowerCase()
  .replace(/\(.*?\)/g, ' ')            // "(Soybean)" glosses
  .replace(/\[.*?\]/g, ' ')
  .replace(/\*+|†|‡|•/g, ' ')
  .replace(/\b\d+(?:\.\d+)?\s*%/g, ' ') // "10%"
  .replace(/[^a-z0-9\-,/&' .]/g, ' ')
  .replace(/\s+/g, ' ').trim().replace(/[.,]+$/, '').trim();

// Damerau-Levenshtein ≤ maxD (adjacent transposition counted once) for OCR/typo repair of long tokens.
function dlev(a, b, maxD) {
  if (Math.abs(a.length - b.length) > maxD) return maxD + 1;
  const d = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) d[i][0] = i;
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const c = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

const KNOWN = new Set([...ACTIVES.map((a) => a[0]), ...MILD_SURFACTANTS, ...ONE_PERCENT_MARKERS, ...WATER_FIRST,
  ...FLAGS.flatMap((f) => f.names)]);
// Real ingredients one edit away from a scored name but chemically distinct — recognised as themselves, never repaired
// into the neighbour (squalene ≠ squalane, benzophenone-1 ≠ oxybenzone, ceramide NG ≠ NP …).
const NEUTRAL = new Set(['squalene', 'benzophenone-1', 'benzophenone-4', 'disodium cocoyl glutamate', 'polysorbate 60', 'polysorbate 80',
  'polysorbate 40', 'ceramide ng', 'ceramide as', 'ceramide 4', 'ceramide 6', 'trisodium edta', 'tetrasodium edta',
  'tocopheryl linoleate', 'sodium lauroyl glutamate', 'potassium cocoyl glutamate', 'sodium cocoyl isethionate',
  'sodium lauroyl methyl isethionate', 'ethylhexyl triazone', 'diethylhexyl butamido triazone', 'glyceryl stearate se', 'peg-100 stearate']);
const KNOWN_LIST = [...KNOWN].filter((k) => k.length >= 7);
const digits = (s) => s.replace(/\D/g, '');
const canon = (s) => s.replace(/[\s\-.]/g, '');

// Map a raw token to a canonical known name (exact, alias, or fuzzy for long tokens).
// Returns { name, fuzzy } — fuzzy marks a typo/OCR-repaired match so classify() can refuse to score a corrupt list.
function resolve(tok) {
  const t = tok.replace(/\s*\/\s*/g, '/').replace(/^(?:and|&)\s+/, '');
  if (KNOWN.has(t) || NEUTRAL.has(t)) return { name: t, fuzzy: false };
  const ALIAS = { 'aqua/water': 'aqua', 'water/aqua': 'aqua', 'aqua/water/eau': 'aqua', 'eau': 'aqua', 'purified water': 'aqua',
    'glycerine': 'glycerin', 'vegetable glycerin': 'glycerin', 'vitamin e': 'tocopherol', 'vitamin b3': 'niacinamide',
    'vitamin c': 'ascorbic acid', 'l-ascorbic acid': 'ascorbic acid', 'alpha arbutin': 'alpha-arbutin', 'hyaluronate sodium': 'sodium hyaluronate',
    'shea butter': 'shea butter', 'butyrospermum parkii': 'butyrospermum parkii butter', 'tea tree oil': 'melaleuca alternifolia leaf oil',
    'aloe vera': 'aloe barbadensis leaf juice', 'aloe vera extract': 'aloe barbadensis leaf extract', 'sd alcohol': 'alcohol denat',
    'alcohol denat.': 'alcohol denat', 'perfume': 'parfum', 'fragrance/parfum': 'parfum', 'parfum/fragrance': 'parfum',
    'tocopheryl acetate': 'tocopheryl acetate', 'vitamin e acetate': 'tocopheryl acetate', 'd-panthenol': 'panthenol',
    'dl-panthenol': 'panthenol', 'provitamin b5': 'panthenol', 'pro-vitamin b5': 'panthenol', 'sodium pca': 'sodium pca',
    'zinc pca': 'zinc pca', 'kojic acid dipalmitate': 'kojic dipalmitate', 'octyl methoxycinnamate': 'ethylhexyl methoxycinnamate',
    'octyl salicylate': 'ethylhexyl salicylate', 'oxybenzone': 'benzophenone-3', 'ensulizole': 'phenylbenzimidazole sulfonic acid',
    'bemotrizinol': 'bis-ethylhexyloxyphenol methoxyphenyl triazine', 'bisoctrizole': 'methylene bis-benzotriazolyl tetramethylbutylphenol',
    'ecamsule': 'terephthalylidene dicamphor sulfonic acid', 'ceramide 1': 'ceramide eos', 'ceramide 2': 'ceramide ns', 'ceramide 3': 'ceramide np', 'ceramide 6 ii': 'ceramide ap', 'ceramide 9': 'ceramide eop',
    'hyaluronic acid sodium salt': 'sodium hyaluronate', 'urea pure': 'urea', 'lactic acid 12': 'lactic acid',
    'masking fragrance': 'parfum', 'fragrance (masking)': 'parfum', 'parfum (masking)': 'parfum', 'sodium lauryl sarcosinate': 'sodium lauroyl sarcosinate',
    'tocopherol acetate': 'tocopheryl acetate', 'ethylhexylglycerine': 'ethylhexylglycerin', 'ethylhexyl glycerine': 'ethylhexylglycerin',
    '3-butylene glycol': 'butylene glycol', '3 butylene glycol': 'butylene glycol', '1,3-butylene glycol': 'butylene glycol', 'caprylic capric triglyceride': 'caprylic/capric triglyceride',
    'caprylic/capric triglycerides': 'caprylic/capric triglyceride', '2-phenoxyethanol': 'phenoxyethanol' };
  if (ALIAS[t]) return { name: ALIAS[t], fuzzy: false };
  const c = canon(t);
  for (const k of KNOWN_LIST) if (canon(k) === c) return { name: k, fuzzy: false };
  if (t.length >= 8) {
    const maxD = t.length >= 14 ? 2 : 1;
    let best = null;
    for (const k of KNOWN_LIST) {
      if (Math.abs(k.length - t.length) > maxD) continue;
      if (digits(t) !== digits(k) || /^ceramide\s/.test(k)) continue;   // a changed number / ceramide code is a different molecule, not a typo
      const d = dlev(canon(t), canon(k), maxD);
      if (d <= maxD && (!best || d < best.d)) best = { k, d };
    }
    if (best) return { name: best.k, fuzzy: true };
  }
  return { name: null, fuzzy: false };
}
const canonical = (tok) => resolve(tok).name;

// Split declared list into tokens. Handles ", ", ";", " and ", "(and)", "•", "/" kept inside names.
const HEADER_WORD = /^(?:ingredients?|inci|composition|contains?|key ingredients?|active ingredients?|full ingredients? list|all)$/;
function splitRaw(text) {
  const cleaned = text.replace(/\(and\)/gi, ',').replace(/\s+and\s+/gi, ',').replace(/[;•\n|]/g, ',')
    .replace(/,\s*,+/g, ',');
  return cleaned.split(',').map(norm).filter((t) => t && t.length >= 2 && !HEADER_WORD.test(t));
}
function tokenize(text) {
  return splitRaw(text).filter((t) => !CODE_LIKE.test(t));
}

// A real INCI declaration always carries base ingredients (solvent, emollient, emulsifier, preservative, thickener,
// powder base); a list with none of them is a seller's headline-actives line, however many actives it names.
const BASE_LIKE = /aqua|water|glycerin|glycol\b|phenoxyethanol|paraben|benzoate|sorbate|carbomer|xanthan|cetearyl|cetyl|stearyl|stearate|dimethicon|siloxane|triglyceride|edta|paraffin|petrolatum|wax|gum\b|acrylat|polymer|ethylhexylglycerin|hydroxide|betaine|sulf|isethionate|glucoside|polysorbate|peg-|ppg-|silica|oxide|alcohol|kaolin|bentonite|talc|clay|starch|dioxide|benzyl|caprylyl|lecithin|squalane|oil\b|butter\b/;
// Beyond a base, a real declaration carries a formulation system: a preservative, or several excipients (emulsifier,
// thickener, pH adjuster, chelator, surfactant, silicone). Humectants, oils, butters and extracts are exactly what a
// seller's "key ingredients" line names, so they do not count here. Common trade names ("Vitamin C", "Aloe Vera",
// "Rice Water") instead of INCI names are the other tell of a headline line.
const PRESERVATIVE_LIKE = /phenoxyethanol|paraben|benzoate|sorbate|ethylhexylglycerin|benzyl alcohol|dehydroacetic|chlorphenesin|caprylyl glycol|caprylhydroxamic|hexanediol|pentylene glycol|propanediol|gluconolactone|levulinate|anisate|phenethyl alcohol|imidazolidinyl|dmdm|hydantoin|isothiazolinone|benzoic acid|sorbic acid|sodium hydroxymethylglycinate|ethylparaben|triclosan/;
const EXCIPIENT_LIKE = /carbomer|stearic|butylene glycol|propylene glycol|hexylene glycol|dipropylene|xanthan|cetearyl|cetyl\b|stearyl|stearate|dimethicon|siloxane|triglyceride|edta|paraffin|petrolatum|wax\b|gum\b|acrylat|polymer|crosspolymer|hydroxide|betaine|sulfate|sulfonate|isethionate|glucoside|polysorbate|peg-|ppg-|silica|kaolin|bentonite|talc|starch|dioxide|lecithin|glyceryl|sorbitan|carrageenan|cellulose|citric acid|lactic acid|sodium citrate|sodium chloride|disodium|trisodium|tetrasodium|triethanolamine|aminomethyl propanol|cocamidopropyl|coco-|laureth|decyl|lauryl|alcohol denat|isopropyl|butyrospermum|copolymer|poloxamer|hydrogenated|behenyl|myristyl|palmitate|cyclopentasiloxane|trisiloxane|phenyl trimethicone|bisabolol|allantoin|tocopheryl acetate|bht\b|bha\b/;
const TRADE_NAME = /^(?:vitamin\s*[a-e]\d?(?:\s*oil)?|[a-z]+\s+(?:seed\s+|fruit\s+|leaf\s+|root\s+|flower\s+|peel\s+)?(?:extract|oil|water|butter|juice|powder)|vit\.?\s*[a-e]|aloe\s*vera(?:\s*(?:gel|extract|juice))?|green\s*tea(?:\s*extract)?|rice\s*water|rice\s*extract|shea\s*butter|argan\s*oil|licorice(?:\s*(?:root)?\s*extract)?|liquorice(?:\s*extract)?|witch\s*hazel(?:\s*extract)?|tea\s*tree(?:\s*oil)?|rose\s*water|hyaluronic\s*acid|coconut\s*oil|olive\s*oil|almond\s*oil|jojoba\s*oil|honey|turmeric(?:\s*extract)?|neem(?:\s*extract)?|cucumber(?:\s*extract)?|chamomile(?:\s*extract)?|saffron|sandalwood|multani\s*mitti|charcoal|papaya(?:\s*extract)?|lemon(?:\s*extract)?|orange\s*peel|pineapple(?:\s*extract)?|watermelon(?:\s*extract)?|kakadu\s*plum|amla|tulsi|basil|mint|peppermint|lavender|rosemary|ceramides?|peptides?|collagen|zinc|spf\s*\d+)$/;
// The declared water phase: "Aqua", "Water (Aqua)", "Purified / DM / Demineralised Water" — not "Rice Water" or "Rose Water" (botanical infusions a headline line names).
const ANHYDROUS_LIKE = /\boil\b|squalane|squalene|tocopher|butter\b|\bwax\b|cera\b|triglyceride|isododecane|isohexadecane|alkane|paraffin|petrolatum|dimethicon|siloxane|silicone|caprylate|caprate|triheptanoin|isopropyl|palmitate|myristate|stearate|laurate|oleate|linoleate|ricinoleate|adipate|sebacate|malate|benzoate|neopentanoate|isononanoate|ethylhexanoate|polyisobutene|polydecene|lanolin|lecithin|\bci \d|\bmica\b|talc|silica|oxide|kaolin|starch|bisabolol|bakuchiol|retinol|retinyl|menthol|camphor|parfum|fragrance|limonene|linalool|citral|geraniol|eugenol|citronellol|\bbht\b|\bbha\b|shea|argan|jojoba|almond|coconut|castor|olive|sunflower|rosehip|marula|moringa|avocado|grapeseed|sesame/;
const WATER_TOKEN = /^(?:(?:purified|distilled|de-?mineralised|de-?mineralized|dm|de-?ionized|di|demi|ro|treated)\s+)?(?:aqua|water|eau)\b/;
const MARKETING_LINE = /ingredients?\s*on\s*(?:tag|pack|label)|see\s*(?:pack|label|image)|refer\s*(?:pack|image)|natural ingredients?|100%|herbal|ayurvedic|chemical[\s-]*free|no\s*(?:harmful|toxic)|premium|extracts? of/i;

// Combo / multipack listings paste several products' lists together. Signals: a product-name header before a
// second list ("Night Cream - 936204 Water", "BODY WASH : ..."), water declared twice in separate places, or
// three names repeated. Pre-blend notation "X (and) Y (and) Z" legitimately repeats names inside one list, so
// blend components are dropped before counting; "Water, Aqua" side by side is one declaration in two languages.
const PRODUCT_HEADER = /(?:^|[.;,]\s*)[a-z][a-z\s&+'/]{2,40}(?:\s?:\s?|\s?-\s|\s-\s?)(?:\d{4,}\s*)?[a-z]/gi;
function isMultiProduct(text) {
  const headers = (text.match(PRODUCT_HEADER) || []).length;
  const single = splitRaw(text.replace(/[^,;]*\(and\)[^,;]*/gi, ',')).filter((t) => !CODE_LIKE.test(t)).map(canonical);
  const counts = single.reduce((m, k) => (k ? m.set(k, (m.get(k) || 0) + 1) : m), new Map());
  const dupes = [...counts.values()].filter((c) => c >= 2).length;
  const aquaAt = single.map((k, i) => (k === 'aqua' ? i : -1)).filter((i) => i >= 0);
  const aquaTwice = aquaAt.length >= 2 && aquaAt[aquaAt.length - 1] - aquaAt[0] > 1;
  return headers >= 2 || aquaTwice || dupes >= 3;
}

function classify(text, opts = {}) {
  if (!text || !text.trim()) return { status: 'none', tokens: [], known: [], recognised: 0 };
  const raw = splitRaw(text);
  const tokens = raw.filter((t) => !CODE_LIKE.test(t));
  const resolved = tokens.map(resolve);
  const known = resolved.map((r) => r.name);
  const fuzzy = resolved.filter((r) => r.fuzzy).length;
  const junk = raw.filter((t) => CODE_JUNK.test(t)).length;
  const vague = tokens.filter((t, i) => !known[i] && VAGUE.test(t)).length;
  const rec = tokens.filter((t, i) => known[i] || inciLike(t)).length;
  const strictN = tokens.filter((t, i) => known[i] || (inciLike(t) && !GENERIC_WORD.test(t))).length;
  const n = tokens.length;
  const ratio = n ? rec / n : 0;
  const strict = n ? strictN / n : 0;
  const firstOk = known[0] && WATER_FIRST.includes(known[0]);
  const isOilProduct = opts.category === 'faceoil';
  const multi = isMultiProduct(text);
  let status = 'partial';
  let reason = null;
  if ((n >= 8 && ratio >= 0.75 && strict >= 0.5) || (n >= 6 && ratio >= 0.85 && strict >= 0.4 && firstOk)) status = 'full';
  else if (isOilProduct && n >= 1 && n <= 5 && ratio === 1 && tokens.every((t) => /oil|squalane|tocopher|extract|butter/.test(t))) status = 'full';
  else if (n >= 6 && ratio < 0.5) {
    // Mostly unrecognised: corrupt text (codes / typo-repaired names) is garbled; a clean list of common names
    // ("Cucumber, Lemon, Kiwi, Green Tea") is a seller summary — readable, just not an INCI declaration.
    if (junk > 0 || fuzzy / n > 0.2) status = 'garbled';
    else reason = 'Ingredients are named by common / trade names, not INCI names — a seller summary, not the declared list, so formula and safety are unscored';
  }
  const anhydrousOil = isOilProduct && tokens.filter((t) => /oil|squalane|tocopher|extract|butter|undecylenate|triglyceride|wax/.test(t)).length / n >= 0.7;
  // Oils, balms and powders carry no water phase by design: mostly oils / esters / silicones / waxes / pigments.
  const anhydrous = anhydrousOil || tokens.filter((t) => ANHYDROUS_LIKE.test(t)).length / n >= 0.6;
  const excipients = new Set(tokens.filter((t) => EXCIPIENT_LIKE.test(t)).map((t) => canonical(t) || t)).size;
  const preserved = tokens.some((t) => PRESERVATIVE_LIKE.test(t));
  const hasWater = known.some((k) => k === 'aqua' || k === 'water') || tokens.some((t) => WATER_TOKEN.test(t.trim()));
  const tradeNames = tokens.filter((t) => TRADE_NAME.test(t.trim().replace(/\s*\([^)]*\)\s*/g, ' ').trim())).length;
  if (status === 'full' && !tokens.some((t) => BASE_LIKE.test(t))) { status = 'partial'; reason = 'Only headline actives are listed — no base / preservative ingredients, so this is not a full INCI declaration and formula and safety are unscored'; }
  // Every water-based formula declares its water phase and a preservative; a list with neither is a headline line.
  if (status === 'full' && !anhydrous && !preserved && !hasWater) { status = 'partial'; reason = 'No water phase or preservative declared — a seller “key ingredients” line, not a full INCI declaration, so formula and safety are unscored'; }
  if (status === 'full' && !anhydrous && !preserved && excipients < 2) { status = 'partial'; reason = 'Seller “key ingredients” line — no preservative or formulation excipients declared, so this is not a full INCI declaration and formula and safety are unscored'; }
  if (status === 'full' && !anhydrousOil && tradeNames / n >= (preserved ? 0.6 : 0.4)) { status = 'partial'; reason = 'Ingredients are named by trade names (“Vitamin C”, “Aloe Vera”), not INCI names — a seller summary, not the declared list, so formula and safety are unscored'; }
  if (status === 'full' && MARKETING_LINE.test(text) && n < 10) { status = 'partial'; reason = 'Short list wrapped in marketing wording — a seller highlight, not the declared list, so formula and safety are unscored'; }
  if (status === 'full' && /\d+\s*%/.test(text) && n < 8) { status = 'partial'; reason = 'Only a few percentage-labelled actives are listed — a marketing headline, not the declared list, so formula and safety are unscored'; }
  // "mild cleansing base, preservatives, approved excipients" is a placeholder, not a declared list.
  if (status === 'full' && vague >= 2) { status = 'partial'; reason = 'Placeholder wording (“preservatives”, “approved excipients”) stands in for the actual ingredients, so formula and safety are unscored'; }
  // A list that needed typo-repair AND carries code junk (or needed too much repair) is OCR-corrupt: never silently fixed, never scored.
  if (status === 'full' && ((fuzzy > 0 && (junk > 0 || fuzzy / n > 0.2)) || junk >= 2)) { status = 'garbled'; reason = 'Ingredient text carries batch codes / typo-repaired names — treated as corrupt, not scored'; }
  // A merged multi-product list cannot be attributed to one formula, so it is not scored as one.
  if (status === 'full' && multi) { status = 'partial'; reason = 'Combo listing — the ingredient text covers several products, so no single formula can be scored'; }
  if (status === 'partial' && !reason) {
    reason = n < 6
      ? `Only ${n} ingredient${n === 1 ? '' : 's'} named — a short “key ingredients” line, not the full declared list, so formula and safety are unscored`
      : 'Too few ingredients are recognisable INCI names to treat this as the declared list, so formula and safety are unscored';
  }
  return { status, reason, tokens, known, recognised: Math.round(ratio * 100) / 100, strict: Math.round(strict * 100) / 100, fuzzy, junk, vague };
}

module.exports = { classify, canonical, resolve, tokenize, norm };
