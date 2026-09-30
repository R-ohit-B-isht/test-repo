// Site registry — the single place that knows which generated data file backs which route, how it is grouped
// in the hub, and which facet groups matter most. The build emits this into public/data/manifest.json.
import powerBanks from '../sites/power-banks.mjs';
import hairDryers from '../sites/hair-dryers.mjs';
import trimmers from '../sites/trimmers.mjs';
import inductionCooktops from '../sites/induction-cooktops.mjs';
import portableBlenders from '../sites/portable-blenders.mjs';
import electricLighters from '../sites/electric-lighters.mjs';
import trekkingShoes from '../sites/trekking-shoes.mjs';
import trekkingBackpacks from '../sites/trekking-backpacks.mjs';
import pinkTumblers from '../sites/pink-tumblers.mjs';
import packingCubes from '../sites/packing-cubes.mjs';
import shoeBags from '../sites/shoe-bags.mjs';
import toiletryBags from '../sites/toiletry-bags.mjs';
import techPouches from '../sites/tech-pouches.mjs';
import laundryBags from '../sites/laundry-bags.mjs';
import travelWallets from '../sites/travel-wallets.mjs';
import waterShoes from '../sites/water-shoes.mjs';
import swimCaps from '../sites/swim-caps.mjs';
import swimGoggles from '../sites/swim-goggles.mjs';
import headlamps from '../sites/headlamps.mjs';
import flipFlops from '../sites/flip-flops.mjs';
import compactCameras from '../sites/compact-cameras.mjs';

const ALL_FAMILIES = {
  power: 'POWER & CHARGING',
  grooming: 'GROOMING',
  kitchen: 'KITCHEN',
  drinkware: 'DRINKWARE',
  outdoor: 'OUTDOOR',
  travel: 'TRAVEL ORGANISERS',
  trip: 'LAKSHADWEEP TRIP',
  camera: 'CAMERAS',
};

export const ALL_SITES = [powerBanks, hairDryers, trimmers, inductionCooktops, portableBlenders, electricLighters, trekkingShoes, trekkingBackpacks, pinkTumblers, packingCubes, shoeBags, toiletryBags, techPouches, laundryBags, travelWallets, waterShoes, swimCaps, swimGoggles, headlamps, flipFlops, compactCameras];

// GEAR_FAMILY=travel builds a site that carries only that family (the organiser planner ships as its own site).
export const SCOPE = process.env.GEAR_FAMILY || null;
if (SCOPE && !ALL_FAMILIES[SCOPE]) throw new Error(`GEAR_FAMILY=${SCOPE} is not a family: ${Object.keys(ALL_FAMILIES).join(', ')}`);
// A site marked `draft` is collected, matched and scored by the data pipeline but is not published: it gets no
// data files, no manifest entry and no navigation until the items are approved.
export const PIPELINE_SITES = SCOPE ? ALL_SITES.filter((s) => s.family === SCOPE) : ALL_SITES;
export const SITES = PIPELINE_SITES.filter((s) => !s.draft);
export const FAMILIES = Object.fromEntries(Object.entries(ALL_FAMILIES).filter(([k]) => SITES.some((s) => s.family === k)));

// Evidence-first: specs and safety are read only from verified specification fields (maker page in full,
// marketplace spec table at 60%), maker from the verified manufacturer + warranty, buyers from real ratings.
// Seller adjectives score 0. Price is shown, never scored.
export const WEIGHTS = { specs: 0.40, safety: 0.20, maker: 0.25, buyers: 0.15 };
export const CRITERIA = {
  specs: 'Verified specification',
  safety: SCOPE === 'travel' ? 'Verified protection of contents' : 'Verified protection & certification',
  maker: 'Maker accountability & warranty',
  buyers: 'Buyer evidence',
};

export const EVIDENCE_STATUS = ['official', 'listing', 'claimed', 'none'];
export const SEGMENT_UNSTATED = 'unstated';
