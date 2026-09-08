// Day blocks. A strategy is an ordered list of block ids; dates are assigned
// from TRIP.start when the plan is built (see ../plan.js).
// spend[] references PRICES ids. Flags:
//   transport: counted under the route, not as ground spend
//   package:   an all-inclusive package (ship + cabin + meals)
//   perRoom:   split across a room's occupants (2 to a room)
//   qty:       multiplier
import { TRANSIT_BLOCKS } from './days/transit.js';
import { ISLAND_BLOCKS } from './days/islands.js';
import { SAMUDRAM_BLOCKS } from './days/samudram.js';

export const BLOCKS = { ...TRANSIT_BLOCKS, ...ISLAND_BLOCKS, ...SAMUDRAM_BLOCKS };
