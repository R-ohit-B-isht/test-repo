// Common-name → INCI-name table for ingredient search ("iron oxide" → CI 77491/77492/77499, "vitamin C" → the
// ascorbic-acid family). Only the names that appear on a VERIFIED INCI list are ever matched — this table just
// widens what a plain-English query looks for. Shared by the build (knowledge.json), the browser tools and chat-api.
// CommonJS so the scrape generators outside the repo can require() it too.
const { FAMILIES } = require('./pairing-kb.cjs');
const { FLAGS } = require('./inci-flags.cjs');

// Normalisation both the indexed INCI text and the query terms go through, so a term matches however the label
// wrote it ("Titanium Dioxide(Ci No- 77891)", "C.I. 77891", "CI77891" all become "titanium dioxide ci 77891").
// Ingredient boundaries (commas, semicolons, "(and)", slashes) survive as a single comma so whole-ingredient
// matches are possible ("alcohol" the solvent vs "cetearyl alcohol" the fatty alcohol).
function normalizeInci(text) {
  return String(text || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\bc\.?\s?i\.?\s*(?:no\.?)?\s*[-:.]?\s*(\d{5})\b/g, 'ci $1')
    .replace(/\(\s*and\s*\)|[,;/|\u2022\u00b7]|\s\band\b\s/g, ',')
    .replace(/[^a-z0-9,]+/g, ' ')
    .replace(/\s*,\s*/g, ',')
    .replace(/,+/g, ',')
    .replace(/^,|,$/g, '')
    .trim();
}

const SUPPLEMENT = [
  { id: 'ironOxide', label: 'Iron oxides (tint pigments)', aliases: ['iron oxide', 'iron oxides', 'tint pigments', 'ci 77491', 'ci 77492', 'ci 77499'], inci: ['iron oxide', 'iron oxides', 'ci 77491', 'ci 77492', 'ci 77499'] },
  { id: 'tio2', label: 'Titanium dioxide', aliases: ['titanium dioxide', 'tio2'], inci: ['titanium dioxide', 'ci 77891'] },
  { id: 'zno', label: 'Zinc oxide', aliases: ['zinc oxide', 'zno'], inci: ['zinc oxide', 'ci 77947'] },
  { id: 'mineralFilter', label: 'Mineral (physical) UV filters', aliases: ['mineral filter', 'mineral sunscreen', 'physical filter', 'physical sunscreen'], inci: ['zinc oxide', 'titanium dioxide', 'ci 77947', 'ci 77891'] },
  { id: 'mica', label: 'Mica', aliases: ['mica'], inci: ['mica', 'ci 77019'] },
  { id: 'avobenzone', label: 'Avobenzone', aliases: ['avobenzone', 'parsol 1789'], inci: ['butyl methoxydibenzoylmethane', 'avobenzone'] },
  { id: 'octinoxate', label: 'Octinoxate', aliases: ['octinoxate'], inci: ['ethylhexyl methoxycinnamate', 'octinoxate', 'octyl methoxycinnamate'] },
  { id: 'octocrylene', label: 'Octocrylene', aliases: ['octocrylene'], inci: ['octocrylene'] },
  { id: 'homosalate', label: 'Homosalate', aliases: ['homosalate'], inci: ['homosalate'] },
  { id: 'octisalate', label: 'Octisalate', aliases: ['octisalate'], inci: ['ethylhexyl salicylate', 'octisalate', 'octyl salicylate'] },
  { id: 'oxybenzone', label: 'Oxybenzone', aliases: ['oxybenzone'], inci: ['benzophenone 3', 'oxybenzone'] },
  { id: 'tinosorbS', label: 'Tinosorb S (bemotrizinol)', aliases: ['tinosorb s', 'bemotrizinol'], inci: ['bis ethylhexyloxyphenol methoxyphenyl triazine', 'bemotrizinol'] },
  { id: 'tinosorbM', label: 'Tinosorb M (bisoctrizole)', aliases: ['tinosorb m', 'bisoctrizole'], inci: ['methylene bis benzotriazolyl tetramethylbutylphenol', 'bisoctrizole'] },
  { id: 'uvinulA', label: 'Uvinul A Plus', aliases: ['uvinul a plus', 'uvinul a'], inci: ['diethylamino hydroxybenzoyl hexyl benzoate'] },
  { id: 'uvinulT', label: 'Uvinul T 150', aliases: ['uvinul t 150', 'uvinul t150', 'octyl triazone'], inci: ['ethylhexyl triazone'] },
  { id: 'mexorylSX', label: 'Mexoryl SX (ecamsule)', aliases: ['mexoryl sx', 'ecamsule'], inci: ['terephthalylidene dicamphor sulfonic acid', 'ecamsule'] },
  { id: 'mexorylXL', label: 'Mexoryl XL', aliases: ['mexoryl xl'], inci: ['drometrizole trisiloxane'] },
  { id: 'ensulizole', label: 'Ensulizole', aliases: ['ensulizole'], inci: ['phenylbenzimidazole sulfonic acid', 'ensulizole'] },
  { id: 'chemicalFilter', label: 'Chemical (organic) UV filters', aliases: ['chemical filter', 'chemical sunscreen', 'organic filter'],
    inci: ['butyl methoxydibenzoylmethane', 'ethylhexyl methoxycinnamate', 'octocrylene', 'homosalate', 'ethylhexyl salicylate', 'benzophenone 3', 'bis ethylhexyloxyphenol methoxyphenyl triazine', 'methylene bis benzotriazolyl tetramethylbutylphenol', 'diethylamino hydroxybenzoyl hexyl benzoate', 'ethylhexyl triazone', 'terephthalylidene dicamphor sulfonic acid', 'drometrizole trisiloxane', 'phenylbenzimidazole sulfonic acid', 'tris biphenyl triazine', 'polysilicone 15'] },
  { id: 'vitc', label: 'Vitamin C (L-ascorbic acid and derivatives)', aliases: ['vitamin c', 'vit c', 'vitc', 'ascorbic acid', 'l ascorbic acid'],
    inci: ['ascorbic acid', 'ascorbyl glucoside', 'sodium ascorbyl phosphate', 'magnesium ascorbyl phosphate', 'tetrahexyldecyl ascorbate', 'ascorbyl tetraisopalmitate', 'ascorbyl palmitate', 'ascorbyl methylsilanol pectinate'] },
  { id: 'retinoid', label: 'Retinoids (any form)', aliases: ['retinoid', 'retinoids', 'vitamin a'], inci: ['retinol', 'retinal', 'retinaldehyde', 'hydroxypinacolone retinoate', 'retinyl palmitate', 'retinyl acetate', 'retinyl propionate', 'retinyl retinoate', 'adapalene', 'tretinoin'] },
  { id: 'aha', label: 'AHAs (any)', aliases: ['aha', 'ahas', 'alpha hydroxy acid', 'alpha hydroxy acids'], inci: ['glycolic acid', 'lactic acid', 'mandelic acid', 'malic acid', 'tartaric acid', 'ammonium lactate'] },
  { id: 'antidandruff', label: 'Anti-dandruff actives (any)', aliases: ['anti dandruff active', 'antidandruff active', 'dandruff active'], inci: ['ketoconazole', 'zinc pyrithione', 'pyrithione zinc', 'piroctone olamine', 'selenium sulfide', 'ciclopirox olamine', 'climbazole', 'coal tar'] },
  { id: 'cholesterol', label: 'Cholesterol', aliases: ['cholesterol'], inci: ['cholesterol'] },
  { id: 'panthenol', label: 'Panthenol (pro-vitamin B5)', aliases: ['panthenol', 'pantenol', 'vitamin b5', 'b5', 'dexpanthenol'], inci: ['panthenol', 'dexpanthenol', 'pantothenic acid'] },
  { id: 'ceramide', label: 'Ceramides', aliases: ['ceramide', 'ceramides'], inci: ['ceramide'] },
  { id: 'glycerin', label: 'Glycerin', aliases: ['glycerin', 'glycerine', 'glycerol'], inci: ['glycerin', 'glycerine', 'glycerol'] },
  { id: 'squalane', label: 'Squalane', aliases: ['squalane', 'squalene'], inci: ['squalane', 'squalene'] },
  { id: 'allantoin', label: 'Allantoin', aliases: ['allantoin', 'allatonin'], inci: ['allantoin'] },
  { id: 'betaine', label: 'Betaine', aliases: ['betaine'], inci: ['betaine'] },
  { id: 'urea', label: 'Urea', aliases: ['urea', 'carbamide'], inci: ['urea'] },
  { id: 'centella', label: 'Centella asiatica (cica)', aliases: ['centella', 'cica', 'centella asiatica', 'madecassoside', 'asiaticoside', 'gotu kola'],
    inci: ['centella asiatica', 'madecassoside', 'asiaticoside', 'asiatic acid', 'madecassic acid'] },
  { id: 'greenTea', label: 'Green tea', aliases: ['green tea', 'egcg', 'camellia sinensis'], inci: ['camellia sinensis', 'epigallocatechin gallate', 'egcg'] },
  { id: 'licorice', label: 'Licorice root', aliases: ['licorice', 'liquorice', 'glabridin', 'mulethi'], inci: ['glycyrrhiza glabra', 'glycyrrhiza uralensis', 'glabridin', 'dipotassium glycyrrhizate', 'glycyrrhetinic acid'] },
  { id: 'aloe', label: 'Aloe vera', aliases: ['aloe', 'aloe vera'], inci: ['aloe barbadensis', 'aloe vera'] },
  { id: 'oat', label: 'Colloidal oatmeal', aliases: ['oat', 'oatmeal', 'colloidal oatmeal'], inci: ['avena sativa', 'colloidal oatmeal', 'oat'] },
  { id: 'snail', label: 'Snail mucin', aliases: ['snail', 'snail mucin', 'snail secretion'], inci: ['snail secretion filtrate', 'snail mucin'] },
  { id: 'pdrn', label: 'PDRN (polydeoxyribonucleotide)', aliases: ['pdrn', 'polydeoxyribonucleotide', 'salmon dna'], inci: ['pdrn', 'polydeoxyribonucleotide', 'sodium dna', 'dna sodium'] },
  { id: 'nad', label: 'NAD+ / NMN', aliases: ['nad', 'nad+', 'nmn', 'nicotinamide mononucleotide', 'nicotinamide adenine dinucleotide'], inci: ['nad', 'nadh', 'nicotinamide adenine dinucleotide', 'nicotinamide mononucleotide', 'nmn'] },
  { id: 'peptide', label: 'Peptides', aliases: ['peptide', 'peptides', 'matrixyl', 'argireline', 'copper peptide', 'ghk-cu'],
    inci: ['peptide', 'palmitoyl tripeptide 1', 'palmitoyl tetrapeptide 7', 'palmitoyl pentapeptide 4', 'acetyl hexapeptide 8', 'copper tripeptide 1', 'palmitoyl tripeptide 5', 'oligopeptide', 'hexapeptide', 'tripeptide', 'tetrapeptide', 'pentapeptide', 'dipeptide'] },
  { id: 'collagen', label: 'Collagen', aliases: ['collagen'], inci: ['collagen', 'hydrolyzed collagen', 'soluble collagen'] },
  { id: 'exosome', label: 'Exosomes', aliases: ['exosome', 'exosomes'], inci: ['exosome', 'exosomes'] },
  { id: 'bisabolol', label: 'Bisabolol', aliases: ['bisabolol'], inci: ['bisabolol'] },
  { id: 'resveratrol', label: 'Resveratrol', aliases: ['resveratrol'], inci: ['resveratrol'] },
  { id: 'coq10', label: 'Coenzyme Q10', aliases: ['coq10', 'coenzyme q10', 'ubiquinone'], inci: ['ubiquinone'] },
  { id: 'ectoin', label: 'Ectoin', aliases: ['ectoin', 'ectoine'], inci: ['ectoin'] },
  { id: 'betaGlucan', label: 'Beta-glucan', aliases: ['beta glucan', 'beta-glucan'], inci: ['beta glucan'] },
  { id: 'propolis', label: 'Propolis', aliases: ['propolis'], inci: ['propolis'] },
  { id: 'honey', label: 'Honey', aliases: ['honey'], inci: ['mel', 'honey'] },
  { id: 'turmeric', label: 'Turmeric', aliases: ['turmeric', 'haldi', 'curcumin'], inci: ['curcuma longa', 'curcumin', 'turmeric'] },
  { id: 'saffron', label: 'Saffron', aliases: ['saffron', 'kesar'], inci: ['crocus sativus', 'saffron'] },
  { id: 'sandalwood', label: 'Sandalwood', aliases: ['sandalwood', 'chandan'], inci: ['santalum album', 'sandalwood'] },
  { id: 'neem', label: 'Neem', aliases: ['neem'], inci: ['azadirachta indica', 'neem', 'melia azadirachta'] },
  { id: 'teaTree', label: 'Tea tree', aliases: ['tea tree', 'tea tree oil'], inci: ['melaleuca alternifolia', 'tea tree'] },
  { id: 'rice', label: 'Rice', aliases: ['rice', 'rice water', 'rice bran'], inci: ['oryza sativa', 'rice'] },
  { id: 'charcoal', label: 'Charcoal', aliases: ['charcoal', 'activated charcoal'], inci: ['charcoal powder', 'activated charcoal', 'charcoal'] },
  { id: 'clay', label: 'Clay', aliases: ['clay', 'kaolin', 'bentonite', 'multani mitti'], inci: ['kaolin', 'bentonite', 'montmorillonite', 'illite', 'fuller s earth'] },
  { id: 'sulfur', label: 'Sulfur', aliases: ['sulfur', 'sulphur'], inci: ['sulfur', 'sulphur'] },
  { id: 'caffeine', label: 'Caffeine', aliases: ['caffeine'], inci: ['caffeine'] },
  { id: 'biotin', label: 'Biotin', aliases: ['biotin', 'vitamin b7'], inci: ['biotin'] },
  { id: 'rosemary', label: 'Rosemary', aliases: ['rosemary'], inci: ['rosmarinus officinalis', 'rosemary'] },
  { id: 'onion', label: 'Onion', aliases: ['onion'], inci: ['allium cepa', 'onion'] },
  { id: 'coconut', label: 'Coconut oil', aliases: ['coconut', 'coconut oil'], inci: ['cocos nucifera', 'coconut'] },
  { id: 'argan', label: 'Argan oil', aliases: ['argan', 'argan oil'], inci: ['argania spinosa', 'argan'] },
  { id: 'shea', label: 'Shea butter', aliases: ['shea', 'shea butter'], inci: ['butyrospermum parkii', 'shea butter', 'shea'] },
  { id: 'jojoba', label: 'Jojoba oil', aliases: ['jojoba', 'jojoba oil'], inci: ['simmondsia chinensis', 'jojoba'] },
  { id: 'almond', label: 'Almond oil', aliases: ['almond', 'almond oil'], inci: ['prunus amygdalus dulcis', 'almond'] },
  { id: 'castor', label: 'Castor oil', aliases: ['castor', 'castor oil'], inci: ['ricinus communis', 'castor'] },
  { id: 'petrolatum', label: 'Petrolatum / mineral oil', aliases: ['petrolatum', 'petroleum jelly', 'vaseline', 'mineral oil', 'paraffin'], inci: ['petrolatum', 'paraffinum liquidum', 'mineral oil', 'paraffin', 'cera microcristallina'] },
  { id: 'silicone', label: 'Silicones', aliases: ['silicone', 'silicones', 'dimethicone'], inci: ['dimethicone', 'dimethiconol', 'cyclopentasiloxane', 'cyclohexasiloxane', 'cyclomethicone', 'trisiloxane', 'amodimethicone', 'phenyl trimethicone', 'siloxane', 'silsesquioxane', 'polysilicone'] },
  { id: 'sulfate', label: 'Sulfate surfactants (SLS/SLES)', aliases: ['sulfate', 'sulfates', 'sulphate', 'sls', 'sles'], inci: ['sodium lauryl sulfate', 'sodium laureth sulfate', 'sodium lauryl sulphate', 'sodium laureth sulphate', 'ammonium lauryl sulfate', 'ammonium laureth sulfate', 'sodium dodecyl sulfate'] },
  { id: 'paraben', label: 'Parabens', aliases: ['paraben', 'parabens'], inci: ['paraben'] },
  { id: 'phenoxyethanol', label: 'Phenoxyethanol', aliases: ['phenoxyethanol'], inci: ['phenoxyethanol'] },
  { id: 'alcohol', label: 'Drying alcohol (alcohol denat / ethanol)', aliases: ['alcohol', 'drying alcohol', 'alcohol denat', 'ethanol', 'denatured alcohol'], inci: ['alcohol denat', 'ethanol', 'sd alcohol 40', 'sd alcohol 40 b', 'denatured alcohol', 'ethyl alcohol'], whole: ['alcohol'] },
  { id: 'essentialOil', label: 'Essential oils / fragrance allergens', aliases: ['essential oil', 'essential oils'], inci: [] },
  { id: 'fragrance', label: 'Fragrance / parfum', aliases: ['fragrance', 'perfume', 'parfum', 'scent'], inci: ['parfum', 'fragrance', 'aroma', 'perfume'] },
  { id: 'lacticAcid', label: 'Lactic acid', aliases: ['lactic acid', 'lactic'], inci: ['lactic acid', 'ammonium lactate', 'sodium lactate'] },
  { id: 'glycolicAcid', label: 'Glycolic acid', aliases: ['glycolic acid', 'glycolic'], inci: ['glycolic acid'] },
  { id: 'mandelicAcid', label: 'Mandelic acid', aliases: ['mandelic acid', 'mandelic'], inci: ['mandelic acid'] },
  { id: 'pha', label: 'PHA (gluconolactone, lactobionic acid)', aliases: ['pha', 'polyhydroxy acid', 'gluconolactone', 'lactobionic acid'], inci: ['gluconolactone', 'lactobionic acid', 'galactose'] },
  { id: 'salicylic', label: 'Salicylic acid (BHA)', aliases: ['salicylic acid', 'salicylic', 'bha'], inci: ['salicylic acid', 'betaine salicylate'] },
  { id: 'kojic', label: 'Kojic acid', aliases: ['kojic acid', 'kojic'], inci: ['kojic acid', 'kojic dipalmitate'] },
  { id: 'arbutin', label: 'Arbutin', aliases: ['arbutin', 'alpha arbutin', 'alpha-arbutin'], inci: ['arbutin'] },
  { id: 'retinol', label: 'Retinol', aliases: ['retinol'], inci: ['retinol'] },
  { id: 'retinal', label: 'Retinal (retinaldehyde)', aliases: ['retinal', 'retinaldehyde'], inci: ['retinal', 'retinaldehyde'] },
  { id: 'adapalene', label: 'Adapalene', aliases: ['adapalene'], inci: ['adapalene'] },
  { id: 'tretinoin', label: 'Tretinoin', aliases: ['tretinoin'], inci: ['tretinoin'] },
  { id: 'benzoylPeroxide', label: 'Benzoyl peroxide', aliases: ['benzoyl peroxide', 'bpo'], inci: ['benzoyl peroxide'] },
  { id: 'clindamycin', label: 'Clindamycin', aliases: ['clindamycin'], inci: ['clindamycin'] },
  { id: 'hydrocolloid', label: 'Hydrocolloid', aliases: ['hydrocolloid'], inci: ['hydrocolloid', 'carboxymethylcellulose'] },
  { id: 'zincPca', label: 'Zinc PCA', aliases: ['zinc pca'], inci: ['zinc pca'] },
  { id: 'keratin', label: 'Keratin', aliases: ['keratin'], inci: ['keratin'] },
  { id: 'ketoconazole', label: 'Ketoconazole', aliases: ['ketoconazole'], inci: ['ketoconazole'] },
  { id: 'zpt', label: 'Zinc pyrithione', aliases: ['zinc pyrithione', 'zpt', 'pyrithione zinc'], inci: ['zinc pyrithione', 'pyrithione zinc'] },
  { id: 'piroctone', label: 'Piroctone olamine', aliases: ['piroctone olamine', 'piroctone'], inci: ['piroctone olamine'] },
  { id: 'aluminium', label: 'Aluminium antiperspirant salts', aliases: ['aluminium', 'aluminum', 'antiperspirant salt'], inci: ['aluminum chlorohydrate', 'aluminium chlorohydrate', 'aluminum zirconium', 'aluminum chloride', 'aluminum sesquichlorohydrate'] },
  { id: 'menthol', label: 'Menthol', aliases: ['menthol'], inci: ['menthol', 'menthyl lactate'] },
];

// Pairing families whose members are ONE substance in several forms (asking for any form means the family). Mixed
// families (barrier = ceramides + glycerin…, arbutin = arbutin + kojic + licorice) are split into single entries above.
const SAME_SUBSTANCE_FAMILIES = new Set(['bha', 'bpo', 'vite', 'ferulic', 'niacinamide', 'azelaic', 'hydroquinone', 'ha', 'bakuchiol', 'tranexamic', 'minoxidil']);
const NOT_A_SUBSTANCE = new Set(['keratin treatment', 'smoothening', 'smoothing', 'rebonding', 'brazilian blowout']);
const fromFamilies = FAMILIES.filter((f) => SAME_SUBSTANCE_FAMILIES.has(f.id))
  .map((f) => ({ id: f.id, label: f.label, aliases: f.aliases.filter((a) => !NOT_A_SUBSTANCE.has(a)), inci: f.inci }));
const fromFlags = FLAGS.filter((f) => ['euAllergen', 'essentialOil', 'formaldehydeReleaser', 'mi'].includes(f.id))
  .map((f) => ({ id: f.id, label: f.label, aliases: [f.label.toLowerCase(), f.id.toLowerCase()], inci: f.names }));

// Later entries only add to what an alias already resolves to, so families keep their curated INCI lists.
function mergeAliases(...lists) {
  const out = [];
  for (const entry of lists.flat()) {
    const norm = (v) => normalizeInci(v);
    const clean = { id: entry.id, label: entry.label, aliases: [...new Set(entry.aliases.map(norm).filter(Boolean))], inci: [...new Set(entry.inci.map(norm).filter(Boolean))], whole: [...new Set((entry.whole || []).map(norm).filter(Boolean))] };
    if (entry.id === 'essentialOil') {
      const eo = out.find((e) => e.id === 'essentialOil');
      if (eo) { eo.aliases.push(...clean.aliases); eo.inci.push(...clean.inci); continue; }
    }
    out.push(clean);
  }
  return out;
}

const INGREDIENT_ALIASES = mergeAliases(fromFamilies, fromFlags, SUPPLEMENT);

// An entry with this many INCI names or fewer is one substance under a few spellings (avobenzone / butyl
// methoxydibenzoylmethane); anything larger is a group (mineral filters, retinoids) that a single INCI name must
// never widen into — "zinc oxide" means zinc oxide, not "any mineral filter".
const SYNONYM_ENTRY_MAX = 3;

/** Alias entries a query term resolves to: its own alias / id / whole-name first; failing that, the synonym entry
 * that lists it as an INCI spelling. Mirrored in src/chat/local/tools/inciMatch.ts and chat_api/tools/inci_match.py. */
function resolveAliasEntries(t, aliases) {
  const own = aliases.filter((e) => e.aliases.includes(t) || e.whole.includes(t) || e.id.toLowerCase() === t);
  if (own.length) return own;
  return aliases.filter((e) => e.inci.includes(t) && e.inci.length <= SYNONYM_ENTRY_MAX);
}

/** What a query term looks for on an INCI list: the term itself plus every INCI name the alias table maps it to.
 * `inci` names match anywhere inside an ingredient ("ceramide" hits "ceramide np"); `whole` names must be the entire
 * ingredient. */
function expandIngredient(term, aliases = INGREDIENT_ALIASES) {
  const t = normalizeInci(term);
  const inci = new Set();
  const whole = new Set();
  const labels = [];
  for (const entry of resolveAliasEntries(t, aliases)) {
    entry.inci.forEach((n) => inci.add(n));
    entry.whole.forEach((n) => whole.add(n));
    labels.push(entry.label);
  }
  if (t && !whole.has(t) && !labels.length) inci.add(t);
  return { term: t, label: labels[0] || null, inci: [...inci], whole: [...whole] };
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Returns the first name found in normalised INCI text (word-bounded, plural tolerant; `whole` = entire ingredient) or null. */
function findIngredient(text, names, whole = []) {
  for (const n of names) if (new RegExp(`(?:^|[ ,])${escapeRe(n)}(?:s|es)?(?:[ ,]|$)`).test(text)) return n;
  for (const n of whole) if (new RegExp(`(?:^|,)${escapeRe(n)}(?:,|$)`).test(text)) return n;
  return null;
}

module.exports = { INGREDIENT_ALIASES, SYNONYM_ENTRY_MAX, normalizeInci, resolveAliasEntries, expandIngredient, findIngredient };
