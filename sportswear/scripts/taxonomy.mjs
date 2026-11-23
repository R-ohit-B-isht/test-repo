// Unified taxonomy for Puma / Nike / Adidas. Rules read only the product's own name, subtitle, store category path,
// article type and maker attributes — never price. First matching rule wins inside a list; tag lists are multi-match.

export const DEPTS = { footwear: 'Footwear', apparel: 'Clothing', accessories: 'Accessories & Equipment' };

/** [id, label, dept, regex over the name/sub/path haystack] — order matters. */
export const CATEGORIES = [
  // footwear
  ['slides-slippers', 'Slides, Slippers & Flip-Flops', 'footwear', /\b(slides?|slippers?|flip[ -]?flops?|adilette|benassi|clogs?|mules?|thongs?|leadcat|popcat|calm|victori|offcourt slide|recovery slide|shower slide)\b/],
  ['sandals', 'Sandals & Floaters', 'footwear', /\b(sandals?|floaters?)\b/],
  ['football-boots', 'Football Boots', 'footwear', /\b(football boots?|cleats?|firm[- ]ground|artificial[- ]ground|soft[- ]ground|turf|futsal|indoor court football)\b|\b(mercurial|phantom|tiempo|predator|copa|f50|x crazyfast|puma (king|future|ultra))\b.*\b(fg|ag|mg|sg|tf|it|in|ic)\b|\b(fg|ag|mg|tf|it)\/(fg|ag|mg|tf|it)\b/],
  ['cricket-shoes', 'Cricket Shoes', 'footwear', /\bcricket\b/],
  ['golf-shoes', 'Golf Shoes', 'footwear', /\bgolf\b/],
  ['basketball-shoes', 'Basketball Shoes', 'footwear', /\bbasketball\b|\b(lebron|giannis|sabrina|zoom freak|ja \d|kd\d+|book \d|luka|tatum|harden|dame|mb\.0\d|all-pro nitro|scoot zeros|stewie|genetics)\b/],
  ['court-shoes', 'Tennis, Badminton & Court Shoes', 'footwear', /\b(tennis|pickleball|padel|badminton|squash|volleyball|handball shoes?|indoor court|table tennis)\b/],
  ['spikes-track', 'Track Spikes', 'footwear', /\b(spikes?|track & field|track and field|sprint)\b/],
  ['trail-hiking', 'Trail & Hiking Shoes', 'footwear', /\b(trail|hiking|hike|terrex|acg|outdoor shoes?|mountain)\b/],
  ['running-shoes', 'Running Shoes', 'footwear', /\b(running|run|pegasus|vomero|vaporfly|alphafly|zoomx|invincible|structure|infinity|interact|winflo|adizero|ultraboost|supernova|adistar|solarboost|solarglide|duramo|runfalcon|galaxy|deviate|velocity nitro|magnify|foreverrun|electrify|fast-r|liberate|redeem|scend|eternity|transport)\b/],
  ['training-shoes', 'Training & Gym Shoes', 'footwear', /\b(training|trainer shoes?|gym|workout|metcon|free metcon|crossfit|weightlifting|lifting|dropset|amplifier|fuse|everyday training|pwrframe|cell)\b/],
  ['motorsport-shoes', 'Motorsport Shoes', 'footwear', /\b(motorsport|ferrari|bmw|mercedes|amg|porsche|red bull|f1|formula 1|drift cat|speedcat|a3rocat|roma via)\b/],
  ['skate-shoes', 'Skateboarding Shoes', 'footwear', /\b(skate|skateboarding|nike sb|sb )\b/],
  ['walking-shoes', 'Walking Shoes', 'footwear', /\bwalking\b/],
  ['boots', 'Boots', 'footwear', /\bboots?\b/],
  ['lifestyle-sneakers', 'Lifestyle Sneakers', 'footwear', /./],
  // apparel
  ['jerseys-kits', 'Jerseys & Kits', 'apparel', /\b(jerseys?|kits?|replica|authentic|stadium|match shirt|home shirt|away shirt|third shirt|(home|away|third|fourth) (shirt|tee|top|jersey)|team shirt|fan shirt|odi|t20|test match)\b/],
  ['sports-bras', 'Sports Bras', 'apparel', /\b(sports? bras?|bras?|bralette)\b/],
  ['innerwear', 'Innerwear & Underwear', 'apparel', /\b(briefs?|trunks?|boxers?|underwear|innerwear|camisole|hipster|bikini brief|thong)\b/],
  ['swimwear', 'Swimwear', 'apparel', /\b(swim|swimsuit|swimwear|swimming|board ?shorts|rash guard|bikini)\b/],
  ['tracksuits', 'Tracksuits & Sets', 'apparel', /\b(tracksuits?|track suits?|co-?ords?|sets?|clothing set|apparel set|jumpsuit|onesie|bodysuit|romper)\b/],
  ['dresses-skirts', 'Dresses & Skirts', 'apparel', /\b(dress|dresses|skirts?|skorts?)\b/],
  ['base-layers', 'Base Layers & Compression', 'apparel', /\b(base ?layer|compression|thermal|nike pro .*(top|tight|short))\b/],
  ['jackets-gilets', 'Jackets, Track Tops & Gilets', 'apparel', /\b(jackets?|windbreaker|windrunner|anorak|parka|puffer|gilets?|vests? jacket|padded vest|shell|rain jacket|track top|coach jacket|bomber|blazer jacket|t7 jacket|firebird)\b/],
  ['hoodies-sweatshirts', 'Hoodies & Sweatshirts', 'apparel', /\b(hoodies?|hoody|hooded|sweatshirts?|crew ?neck sweat|pullover|sweaters?|fleece (top|crew)|crew\b(?! socks))/],
  ['polos', 'Polos', 'apparel', /\bpolos?\b/],
  ['shirts', 'Shirts', 'apparel', /\b(?<!t-)(?<!t )shirts?\b(?!.*\b(tee|t-shirt|tshirt)\b)/],
  ['tanks', 'Tank Tops & Sleeveless', 'apparel', /\b(tanks?|tank tops?|sleeveless|singlets?|muscle tee|vests?)\b/],
  ['tshirts-tops', 'T-Shirts & Tops', 'apparel', /\b(t-shirts?|tshirts?|tees?|tops?|crop|long-sleeve|short-sleeve|baby tee)\b/],
  ['shorts', 'Shorts', 'apparel', /\bshorts?\b/],
  ['tights-leggings', 'Tights & Leggings', 'apparel', /\b(tights?|leggings?|bike shorts)\b/],
  ['pants-joggers', 'Track Pants, Joggers & Trousers', 'apparel', /\b(track ?pants?|joggers?|sweatpants?|pants?|trousers?|bottoms?|cargos?|chinos?|jeans|capris?|palazzo)\b/],
  ['other-apparel', 'Other Clothing', 'apparel', /./],
  // accessories & equipment
  ['socks', 'Socks', 'accessories', /\bsocks?\b/],
  ['caps-hats', 'Caps, Hats & Visors', 'accessories', /\b(caps?|hats?|visors?|bucket)\b/],
  ['beanies-headwear', 'Beanies, Headbands & Neckwear', 'accessories', /\b(beanies?|headbands?|head ?wear|bandanas?|balaclava|scarf|scarves|neck ?warmer|snood|hair ?bands?|hair tie)\b/],
  ['backpacks', 'Backpacks', 'accessories', /\b(backpacks?|rucksacks?|daypack)\b/],
  ['bags', 'Bags, Duffels & Pouches', 'accessories', /\b(bags?|duffels?|duffle|teambag|totes?|pouch|pouches|gym ?sack|gymsack|sling|crossbody|cross body|waist ?pack|waist ?bag|waistbag|fanny|messenger|shopper|portable)\b/],
  ['wallets', 'Wallets & Card Holders', 'accessories', /\b(wallets?|card ?holders?|purse)\b/],
  ['belts', 'Belts', 'accessories', /\bbelts?\b/],
  ['gloves', 'Gloves (incl. Goalkeeper)', 'accessories', /\bgloves?\b/],
  ['balls', 'Balls', 'accessories', /\b(balls?|orbita|fifa\S* quality|football size|basketball size|seamless touch football|training football|match football|mini football)\b(?!et)|^(?!.*\b(shoes?|boots?|jersey|shirt|socks?|bag|teambag|gloves?|shin)\b).*\b(football|basketball)$/],
  ['protective', 'Shin Guards & Protective Gear', 'accessories', /\b(shin ?guards?|shin ?pads?|guards?|knee ?pads?|elbow|mouthguard|helmets?|protector|ankle support|sleeve support)\b/],
  ['bottles', 'Bottles & Shakers', 'accessories', /\b(bottles?|waterbottle|shakers?|flask|tumbler)\b/],
  ['face-masks', 'Face Masks', 'accessories', /\b(face ?masks?|masks?)\b/],
  ['eyewear', 'Sunglasses & Eyewear', 'accessories', /\b(sunglasses|eyewear|goggles|glasses)\b/],
  ['watches', 'Watches & Wearables', 'accessories', /\b(watch|watches|smartwatch|fitness band)\b/],
  ['fragrance-care', 'Fragrance & Personal Care', 'accessories', /\b(deodorant|deo|perfume|eau de|edt|edp|body wash|body spray|shower gel|talc|mist|personal care|fragrance|bath and body|beauty|gift set|antiperspirant|roll-on|face wash|shampoo)\b/],
  ['wristbands-sleeves', 'Wristbands, Sweatbands & Arm Sleeves', 'accessories', /\b(wristbands?|sweatbands?|arm ?bands?|arm sleeves?|calf sleeves?)\b/],
  ['laces-shoe-care', 'Laces & Shoe Care', 'accessories', /\b(laces?|shoe care|insoles?|shoe cleaner|shoe bag)\b/],
  ['training-equipment', 'Training Equipment (Mats, Ropes, Bands)', 'accessories', /\b(yoga mat|mat|skipping|jump rope|rope|resistance|dumbbell|kettlebell|foam roller|towel|rackets?|bats?|pump|cones?|ladder|equipment)\b/],
  ['other-accessories', 'Other Accessories', 'accessories', /./],
];

export const SPORTS = [
  ['running', 'Running', /\b(running|run|marathon|race day|road running|pegasus|vomero|vaporfly|alphafly|invincible|adizero|ultraboost|supernova|adistar|deviate|velocity nitro|magnify|foreverrun|fast-r|liberate|runfalcon|duramo)\b/],
  ['trail', 'Trail & Outdoor', /\b(trail|hiking|hike|outdoor|terrex|acg|mountain|all conditions gear)\b/],
  ['football', 'Football', /\b(football|soccer|futsal|goalkeeper|mercurial|phantom|tiempo|predator|copa|f50|fc |f\.c\.|club fc|psg|barcelona|real madrid|manchester|arsenal|liverpool|chelsea|juventus|bayern|ac milan|inter milan|dortmund|bvb|tottenham|al nassr|argentina|brazil|germany|portugal|england|france|spain|italy|morocco)\b/],
  ['basketball', 'Basketball', /\b(basketball|lebron|giannis|sabrina|jordan basketball|hoops|nba|wnba|all-pro nitro|mb\.0\d|scoot)\b/],
  ['training', 'Gym & Training', /\b(training|train|gym|workout|metcon|crossfit|weightlifting|lifting|hiit|yoga|pilates|studio|dropset|nike pro)\b/],
  ['yoga', 'Yoga & Studio', /\b(yoga|pilates|studio|barre)\b/],
  ['tennis', 'Tennis', /\b(tennis|nikecourt|court dri-fit|wimbledon)\b/],
  ['racket', 'Badminton, Padel & Pickleball', /\b(badminton|padel|pickleball|squash|table tennis)\b/],
  ['cricket', 'Cricket', /\b(cricket|odi|t20|bcci|ipl|rcb|royal challengers|mumbai indians|delhi capitals)\b/],
  ['golf', 'Golf', /\b(golf|tour golf)\b/],
  ['motorsport', 'Motorsport', /\b(motorsport|motor sport|ferrari|scuderia|bmw m|bmw|mercedes|amg|petronas|porsche|red bull|f1|formula 1|formula one|racing|race car|aston martin|alpine|speedcat|drift cat|a3rocat)\b/],
  ['skateboarding', 'Skateboarding', /\b(skate|skateboarding|nike sb)\b/],
  ['swimming', 'Swimming', /\b(swim|swimming|pool)\b/],
  ['athletics', 'Track & Field', /\b(track & field|track and field|spikes?|sprint)\b/],
  ['volleyball', 'Volleyball & Handball', /\b(volleyball|handball)\b/],
  ['hockey', 'Hockey', /\bhockey\b/],
  ['boxing', 'Boxing & Combat', /\b(boxing|mma|wrestling|combat)\b/],
  ['dance', 'Dance', /\bdance\b/],
];

export const TEAMS = [
  'FC Barcelona', 'Paris Saint-Germain|PSG', 'Chelsea', 'Tottenham|Spurs', 'Liverpool', 'Inter Milan|Inter\\b', 'Atletico Madrid', 'Al Nassr', 'Al Hilal',
  'Real Madrid', 'Manchester United|Man Utd', 'Arsenal', 'Bayern|FC Bayern', 'Juventus', 'Ajax', 'Celtic', 'Benfica',
  'Manchester City|Man City', 'AC Milan', 'Borussia Dortmund|BVB', 'PSV', 'Valencia', 'Fenerbahce', 'Galatasaray',
  'Argentina', 'Germany', 'Spain', 'Italy', 'Mexico', 'Japan', 'Brazil', 'France', 'England', 'Portugal', 'Netherlands', 'USA|USMNT|USWNT', 'Croatia', 'Belgium', 'Morocco', 'Switzerland', 'Colombia', 'Senegal', 'India',
  'Royal Challengers|RCB', 'Mumbai Indians', 'Delhi Capitals', 'Gujarat Titans', 'Lucknow Super Giants', 'Chennai Super Kings|CSK', 'Kolkata Knight Riders|KKR',
  'Scuderia Ferrari|Ferrari', 'BMW M Motorsport|BMW', 'Mercedes-AMG|Mercedes', 'Porsche', 'Red Bull Racing|Red Bull', 'Aston Martin', 'Alpine F1|Alpine', 'Formula 1|F1\\b',
  'LA Lakers|Lakers', 'Golden State|Warriors', 'Chicago Bulls|Bulls', 'Boston Celtics', 'Brooklyn Nets',
].map((s) => { const [label] = s.split('|'); return [label, new RegExp(`\\b(${s})`, 'i')]; });

/** Franchise / sub-brand / product line, per brand. */
export const LINES = {
  Nike: ['Jordan', 'Nike SB', 'ACG', 'Nike Pro', 'Nike Sportswear', 'Air Force 1', 'Air Max', 'Air Jordan 1', 'Dunk', 'Blazer', 'Cortez', 'Pegasus', 'Vomero', 'Vaporfly', 'Alphafly', 'Invincible', 'Structure', 'Zoom Fly', 'Mercurial', 'Phantom', 'Tiempo', 'Metcon', 'Killshot', 'P-6000', 'V2K', 'Air Zoom', 'Tech Fleece', 'Club Fleece', 'Windrunner', 'Court Vision', 'Revolution', 'Downshifter', 'Calm', 'Victori', 'Offcourt', 'Shox', 'Field General', 'Total 90', 'LeBron', 'Giannis', 'Sabrina', 'Ja', 'Book', 'Nike Mind', 'Nike One', 'Zenvy', 'Swoosh'],
  Puma: ['Scuderia Ferrari', 'BMW M Motorsport', 'Mercedes-AMG', 'Porsche Legacy', 'F1', 'Fenty', 'Palermo', 'Speedcat', 'Suede', 'Smash', 'RS-X', 'Caven', 'Carina', 'Mayze', 'Rebound', 'Slipstream', 'Velocity Nitro', 'Deviate Nitro', 'Magnify Nitro', 'ForeverRun Nitro', 'Fast-R', 'Nitro', 'King', 'Future', 'Ultra', 'Softride', 'Electrify', 'Liberate', 'Redeem', 'All-Pro Nitro', 'MB.0', 'Scoot', 'teamGOAL', 'teamFINAL', 'teamLIGA', 'ESS', 'T7', 'Classics', 'Better Essentials', 'Run Favourite', 'Cloudspun', 'Evostripe', 'Squad', 'Leadcat', 'Popcat', 'Divecat', 'Royalcat', 'Shuffle', 'Club', 'Court Rider', 'Cell', 'PWR', 'Hyrox'],
  Adidas: ['adidas Originals', 'Samba', 'Gazelle', 'Campus', 'Superstar', 'Stan Smith', 'Spezial', 'SL 72', 'Handball', 'Forum', 'Adilette', 'Ozweego', 'Ultraboost', 'Adizero', 'Adistar', 'Supernova', 'Solarboost', 'Duramo', 'Runfalcon', 'Galaxy', 'Lite Racer', 'Predator', 'Copa', 'F50', 'Terrex', 'Tiro', 'Squadra', 'Entrada', 'Own the Run', 'Essentials', 'Z.N.E.', 'Future Icons', 'Adicolor', 'Firebird', 'Beckenbauer', 'Trefoil', 'Y-3', 'Stella McCartney', 'Dropset', 'Rapidmove', 'Grand Court', 'Advantage', 'Courtblock', 'Barricade', 'Avacourt', 'Ubersonic', 'Response', 'Switch', 'Questar', 'Cloudfoam', 'Kaptir', 'Puremotion', 'Racer TR', 'Ozelia', 'VL Court', 'Breaknet', 'Hoops', 'Dame', 'Harden', 'Trae', 'Anthony Edwards', 'D.O.N.', 'Pureboost', 'Alphaboost', 'Ventice', 'Tensaur', 'Adilux'],
};

/** Maker technologies. [label, regex] — scored in the technology dimension. weight = how much it says about build quality. */
export const TECH = [
  ['ZoomX', /\bzoomx\b/, 3], ['Carbon plate', /\b(carbon[- ]?(fibre|fiber)? ?plate|flyplate|carbon-infused|energyrods|pwrplate|carbitex)\b/, 3], ['Nike Air Zoom', /\b(zoom air|air zoom)\b/, 2], ['Nike Air Max', /\bair max\b/, 1.5], ['Nike Air', /\b(nike air|air-sole|air unit|air cushioning)\b/, 1], ['ReactX / React', /\breactx?\b/, 2], ['Flyknit', /\bflyknit\b/, 2], ['Flywire', /\bflywire\b/, 1], ['Dri-FIT ADV', /\bdri-fit adv\b/, 3], ['Dri-FIT', /\bdri-fit\b/, 1], ['Therma-FIT', /\btherma-fit( adv)?\b/, 2], ['Storm-FIT', /\bstorm-fit( adv)?\b/, 3], ['Gore-Tex', /\bgore-?tex\b/, 3], ['Atomknit', /\batomknit\b/, 2], ['Nike Grind', /\bnike grind\b/, 0.5], ['Tech Fleece', /\btech fleece\b/, 2], ['Infinity / Phylon', /\b(phylon|cushlon)\b/, 1],
  ['Lightstrike Pro', /\blightstrike pro\b/, 3], ['Lightstrike', /\blightstrike\b(?! pro)/, 2], ['Boost', /\bboost\b/, 2], ['Dreamstrike', /\bdreamstrike\+?\b/, 2], ['Bounce', /\bbounce\b/, 1], ['Continental rubber', /\bcontinental\b/, 2], ['Primeknit', /\bprimeknit\b/, 2], ['AEROREADY', /\baeroready\b/, 1], ['HEAT.RDY', /\bheat\.rdy\b/, 2], ['COLD.RDY', /\bcold\.rdy\b/, 2], ['RAIN.RDY', /\brain\.rdy\b/, 2], ['Climacool', /\bclimacool\b/, 1], ['Cloudfoam', /\bcloudfoam\b/, 0.5], ['Torsion system', /\btorsion\b/, 1.5], ['Adiwear', /\badiwear\b/, 1],
  ['NITRO Elite', /\bnitro elite\b|\bnitrofoam elite\b/, 3], ['NITRO foam', /\bnitro(foam)?\b/, 2], ['PUMAGRIP', /\bpumagrip\b/, 1.5], ['dryCELL', /\bdrycell\b/, 1], ['warmCELL', /\bwarmcell\b/, 1.5], ['CLOUDSPUN', /\bcloudspun\b/, 1], ['ULTRAWEAVE', /\bultraweave\b/, 2], ['FUZIONFIT', /\bfuzionfit\+?\b/, 2], ['PWRTAPE / PWRPRINT', /\bpwr(tape|print|frame|spring)\b/, 1.5], ['ProFoam', /\bprofoam\b/, 1], ['SoftFoam+', /\bsoftfoam\b/, 0.5], ['IGNITE', /\bignite\b/, 1], ['FORMSTRIP', /\bformstrip\b/, 0.5], ['GripControl', /\bgripcontrol( pro)?\b/, 1.5], ['Rapidagility', /\brapidagility\b/, 1.5], ['Dual-density foam', /\bdual-density\b/, 1], ['RUNFORMANCE', /\brunformance\b/, 1],
];

export const MATERIALS = [
  ['Leather', /\b(leather|full-grain|nappa)\b/, 2], ['Suede', /\b(suede|nubuck)\b/, 1.5], ['Merino / wool', /\b(merino|wool)\b/, 2], ['Gore-Tex membrane', /\bgore-?tex\b/, 2.5], ['Knit upper', /\b(knit upper|flyknit|primeknit|engineered knit|knitted upper)\b/, 1.5], ['Engineered mesh', /\b(engineered mesh|jacquard mesh|monomesh)\b/, 1], ['Ripstop / Cordura', /\b(ripstop|cordura|ballistic)\b/, 1.5], ['Organic / Pima cotton', /\b(organic cotton|pima|supima|egyptian cotton|combed cotton)\b/, 1.5], ['French terry / heavyweight', /\b(french terry|heavyweight|heavy weight|loopback|brushed-back fleece|double[- ]knit)\b/, 1],
  ['Cotton', /\bcotton\b/, 0], ['Polyester', /\bpolyester\b/, 0], ['Recycled polyester', /\brecycled (polyester|materials?|content)\b/, 0.5], ['Nylon', /\b(nylon|polyamide)\b/, 0.5], ['Elastane / spandex', /\b(elastane|spandex|lycra)\b/, 0.5], ['Fleece', /\bfleece\b/, 0], ['Viscose / rayon / modal', /\b(viscose|rayon|modal|lyocell|tencel)\b/, 0.5], ['Mesh', /\bmesh\b/, 0], ['Rubber outsole', /\brubber\b/, 0.5], ['EVA foam', /\b(eva|phylon)\b/, 0], ['TPU', /\btpu\b/, 0.5], ['Synthetic', /\bsynthetic\b/, 0], ['PU / faux leather', /\b(polyurethane|\bpu\b|faux leather|synthetic leather)\b/, 0], ['Denim', /\bdenim\b/, 0], ['Linen', /\blinen\b/, 0.5],
];

export const FEATURES = [
  ['Waterproof', /\bwaterproof\b/], ['Water-repellent', /\b(water[- ]repellent|water[- ]resistant|dwr)\b/], ['Windproof', /\b(windproof|wind-resistant|wind resistant)\b/], ['Reflective details', /\breflective\b/], ['Recycled materials', /\b(recycled|sustainable materials|move to zero|primegreen|primeblue|parley)\b/], ['Sweat-wicking / quick-dry', /\b(sweat-wicking|moisture-wicking|wicking|quick-dry|quick-drying|dri-fit|dry ?cell|aeroready|climacool)\b/], ['Breathable / ventilated', /\b(breathab|ventilat|perforat|eyelets|airflow)\w*/], ['Insulated / thermal', /\b(insulat|thermal|therma-fit|warmcell|cold\.rdy|synthetic fill|down fill|puffer)\w*/], ['Lightweight', /\blight-?weight\b/], ['Stretch', /\b(stretch|4-way|four-way)\b/], ['UV protection', /\b(uv|upf)\b/], ['Zip pockets', /\bzip(ped|per)? pockets?\b/], ['Hood', /\bhood(ed)?\b/], ['Packable', /\bpackable\b/], ['Seamless', /\bseamless\b/], ['Anti-odour', /\b(anti-odou?r|odou?r control)\b/], ['Cushioned', /\bcushion\w*/], ['Laceless / slip-on', /\b(laceless|slip-on|slip on)\b/], ['High-top', /\b(high[- ]top|hi top|\bhigh\b)\b/], ['Mid-top', /\bmid[- ]top\b|\bmid\b/], ['Wide fit', /\bwide\b/], ['Adjustable fit', /\b(adjustable|drawcord|toggle)\b/], ['Laptop sleeve', /\blaptop\b/], ['Embroidered crest/logo', /\bembroider\w*/], ['Heat-applied badge', /\bheat[- ]applied|heat[- ]transfer|heat[- ]pressed\b/], ['Slim fit', /\bslim\b/], ['Oversized / loose fit', /\b(oversized|loose|relaxed|boxy)\b/], ['Compression fit', /\b(compression|tight fit)\b/], ['Graphic print', /\b(graphic|print(ed)?)\b/], ['Collab / limited', /\b( x |collab|limited|special edition|\bse\b|qs)\b/],
];

/** Maker-defined performance tier. Brands publish these ladders themselves (e.g. Elite > Pro > Academy > Club). */
export const TIERS = [
  ['elite', 'Elite / Pro-athlete tier', 100, /\b(elite|ultimate|alphafly|vaporfly|adios pro|adizero pro|adizero evo|evo sl|fast-r|nitro elite|player issue|authentic|dri-fit adv match|match jersey|aeroswift|lightstrike pro|zoomx dragonfly|maxfly|victory|prestige)\b/],
  ['pro', 'Pro / Premium tier', 82, /\b(pro|premium|dri-fit adv|vomero|invincible|ultraboost|adistar|magnify nitro|deviate nitro|foreverrun|gore-tex|acg|terrex|tech fleece|storm-fit|zoom fly|boston|takumi|metcon|dropset|lebron|giannis|sabrina|all-pro nitro|mb\.0\d|future \d+ (match|pro)|ultra \d+ (match|pro)|king (pro|top)|velocity nitro)\b/],
  ['performance', 'Performance tier', 64, /\b(match|pegasus|structure|supernova|solarboost|solarglide|adizero sl|adizero boston|winflo|interact|rival|zoom|lightstrike|boost|nitro|stadium|replica|dri-fit|aeroready|heat\.rdy|drycell|league|team)\b/],
  ['entry', 'Entry / Essentials tier', 42, /\b(academy|club|play|essentials?|ess|core|duramo|runfalcon|galaxy|lite racer|revolution|downshifter|flex|fanwear|softride|cloudfoam|basic|logo|graphic|lifestyle tee|squadra|entrada|tiro essentials|transport|anzarun|smashic|vikky|kaptir)\b/],
];
