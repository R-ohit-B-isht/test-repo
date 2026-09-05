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

export const FAMILIES = {
  power: 'POWER & CHARGING',
  grooming: 'GROOMING',
  kitchen: 'KITCHEN',
  drinkware: 'DRINKWARE',
  outdoor: 'OUTDOOR',
};

export const SITES = [powerBanks, hairDryers, trimmers, inductionCooktops, portableBlenders, electricLighters, trekkingShoes, trekkingBackpacks, pinkTumblers];

// Evidence-first: specs and safety are read only from verified specification fields (maker page in full,
// marketplace spec table at 60%), maker from the verified manufacturer + warranty, buyers from real ratings.
// Seller adjectives score 0. Price is shown, never scored.
export const WEIGHTS = { specs: 0.40, safety: 0.20, maker: 0.25, buyers: 0.15 };
export const CRITERIA = {
  specs: 'Verified specification',
  safety: 'Verified protection & certification',
  maker: 'Maker accountability & warranty',
  buyers: 'Buyer evidence',
};

export const EVIDENCE_STATUS = ['official', 'listing', 'claimed', 'none'];
export const SEGMENT_UNSTATED = 'unstated';
