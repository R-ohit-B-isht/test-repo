// Where each number came from. Keyed by PRICES[*].source, STAYS/EATS/CATALOGUE source.
import { TRANSPORT_SOURCES } from './sources/transport.js';
import { GROUND_SOURCES } from './sources/ground.js';
import { FUN_SOURCES } from './sources/fun.js';

export const SOURCES = { ...TRANSPORT_SOURCES, ...GROUND_SOURCES, ...FUN_SOURCES };
