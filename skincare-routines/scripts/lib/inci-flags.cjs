// Named-ingredient safety flags. Each flag cites a regulatory / dermatology source (key into inci-kb SOURCES).
// Penalties are applied ONLY when the ingredient is on a verified INCI list — never inferred from seller copy.
// `leaveOn` / `rinseOff` are the penalty sizes by product use; `faceOnly` flags apply only to face categories.

// The 26 fragrance allergens the EU requires to be declared by name (Reg. 1223/2009 Annex III).
const EU_FRAGRANCE_ALLERGENS = ['amyl cinnamal', 'benzyl alcohol', 'cinnamyl alcohol', 'citral', 'eugenol', 'hydroxycitronellal',
  'isoeugenol', 'amylcinnamyl alcohol', 'benzyl salicylate', 'cinnamal', 'coumarin', 'geraniol',
  'hydroxyisohexyl 3-cyclohexene carboxaldehyde', 'anise alcohol', 'benzyl cinnamate', 'farnesol', 'butylphenyl methylpropional',
  'linalool', 'benzyl benzoate', 'citronellol', 'hexyl cinnamal', 'limonene', 'methyl 2-octynoate', 'alpha-isomethyl ionone',
  'evernia prunastri extract', 'evernia furfuracea extract'];

const FLAGS = [
  { id: 'fragrance', names: ['parfum', 'fragrance', 'aroma', 'perfume', 'fragrance (parfum)', 'parfum (fragrance)'],
    label: 'Added fragrance (parfum)', leaveOn: 1.5, rinseOff: 0.8, src: 'acdsFragrance' },
  { id: 'euAllergen', names: EU_FRAGRANCE_ALLERGENS, perItem: true, cap: 2.0,
    label: 'EU-declared fragrance allergen', leaveOn: 0.5, rinseOff: 0.3, src: 'eu1223' },
  { id: 'mi', names: ['methylisothiazolinone', 'methylchloroisothiazolinone'],
    label: 'Isothiazolinone preservative (MI/MCI)', leaveOn: 2.0, rinseOff: 0.8, src: 'sccsMi' },
  { id: 'formaldehydeReleaser', names: ['dmdm hydantoin', 'imidazolidinyl urea', 'diazolidinyl urea', 'quaternium-15',
    '2-bromo-2-nitropropane-1,3-diol', 'bronopol', 'sodium hydroxymethylglycinate'],
    label: 'Formaldehyde-releasing preservative', leaveOn: 1.5, rinseOff: 0.8, src: 'eu2019_831' },
  { id: 'triclosan', names: ['triclosan', 'triclocarban'], label: 'Triclosan / triclocarban', leaveOn: 1.5, rinseOff: 1.5, src: 'fdaTriclosan' },
  { id: 'sls', names: ['sodium lauryl sulfate', 'sodium lauryl sulphate', 'ammonium lauryl sulfate', 'sodium dodecyl sulfate'],
    label: 'Harsh anionic surfactant (SLS/ALS)', leaveOn: 1.5, rinseOff: 0.7, src: 'surfactants' },
  { id: 'alcoholDenat', names: ['alcohol denat', 'alcohol denat.', 'alcohol', 'ethanol', 'sd alcohol 40', 'sd alcohol 40-b', 'denatured alcohol', 'ethyl alcohol'],
    topN: 5, label: 'Drying alcohol high in the list', leaveOn: 1.0, rinseOff: 0.3, sunscreen: 0.5, src: 'alcohol' },
  { id: 'essentialOil', names: ['melaleuca alternifolia leaf oil', 'mentha piperita oil', 'mentha arvensis leaf oil', 'menthol', 'camphor',
    'eucalyptus globulus leaf oil', 'lavandula angustifolia oil', 'citrus limon peel oil', 'citrus aurantium dulcis peel oil',
    'citrus aurantium bergamia fruit oil', 'citrus aurantifolia oil', 'citrus grandis peel oil', 'cinnamomum zeylanicum bark oil',
    'cananga odorata flower oil', 'pelargonium graveolens flower oil', 'rosmarinus officinalis leaf oil', 'salvia officinalis oil',
    'cymbopogon schoenanthus oil', 'cymbopogon flexuosus oil', 'pogostemon cablin oil', 'santalum album oil', 'jasminum officinale oil',
    'rosa damascena flower oil', 'eugenia caryophyllus leaf oil', 'thymus vulgaris oil', 'origanum vulgare oil', 'mentha spicata oil',
    'citrus nobilis peel oil', 'citrus reticulata peel oil', 'boswellia carterii oil', 'commiphora myrrha oil', 'juniperus communis fruit oil'],
    perItem: true, cap: 1.5, label: 'Essential oil / volatile sensitiser', leaveOn: 0.5, rinseOff: 0.25, src: 'acdsFragrance' },
  { id: 'abrasive', names: ['juglans regia shell powder', 'walnut shell powder', 'prunus armeniaca seed powder', 'apricot seed powder',
    'prunus amygdalus dulcis shell powder', 'pumice', 'polyethylene'],
    faceOnly: true, label: 'Hard abrasive particles (face)', leaveOn: 0.8, rinseOff: 0.8, src: 'aadScrub' },
  { id: 'hydroquinone', names: ['hydroquinone'], label: 'Hydroquinone — prescription-only depigmenting drug', leaveOn: 1.0, rinseOff: 1.0, src: 'cdscoHq' },
];

// Deliberately NOT penalised (marketing "free-from" claims that regulators consider safe at permitted limits):
const NOT_PENALISED = [
  { names: ['methylparaben', 'ethylparaben', 'propylparaben', 'butylparaben'], why: 'SCCS finds parabens safe at permitted limits', src: 'sccsParabens' },
  { names: ['phenoxyethanol'], why: 'Standard preservative, SCCS safe at ≤1%', src: 'sccsParabens' },
  { names: ['dimethicone', 'cyclopentasiloxane'], why: 'Silicones: inert occlusives, no irritation signal', src: 'petrolatum' },
  { names: ['paraffinum liquidum', 'mineral oil', 'petrolatum'], why: 'Cosmetic-grade petrolatum is the reference occlusive', src: 'petrolatum' },
];

module.exports = { FLAGS, NOT_PENALISED, EU_FRAGRANCE_ALLERGENS };
