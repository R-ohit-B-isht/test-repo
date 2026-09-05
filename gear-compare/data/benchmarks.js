// Reference ceilings — one best-in-class product per category, fixed at 100 and kept OUTSIDE the listing ranking.
// Every URL here was fetched and checked (HTTP 200 in a browser, product/image confirmed) on the date in `checked`.
// Facts are read off the maker's own product page (or its public product API); `evidence` lists independent
// reviews that support the pick. One file per category in ./benchmarks/; adding a category means adding a file
// here — `node scripts/build-data.mjs` fails if any category lacks one or any URL/image/fact is missing.
import powerBanks from './benchmarks/power-banks.js';
import hairDryers from './benchmarks/hair-dryers.js';
import trimmers from './benchmarks/trimmers.js';
import inductionCooktops from './benchmarks/induction-cooktops.js';
import portableBlenders from './benchmarks/portable-blenders.js';
import electricLighters from './benchmarks/electric-lighters.js';
import trekkingShoes from './benchmarks/trekking-shoes.js';
import trekkingBackpacks from './benchmarks/trekking-backpacks.js';
import pinkTumblers from './benchmarks/pink-tumblers.js';

export default [
  powerBanks,
  hairDryers,
  trimmers,
  inductionCooktops,
  portableBlenders,
  electricLighters,
  trekkingShoes,
  trekkingBackpacks,
  pinkTumblers,
];
