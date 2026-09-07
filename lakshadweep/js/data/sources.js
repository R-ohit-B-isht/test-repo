// Where each number came from. Keyed by PRICES[*].source, STAYS/EATS/CATALOGUE source.
import { TRANSPORT_SOURCES } from './sources/transport.js';
import { GROUND_SOURCES } from './sources/ground.js';

export const SOURCES = { ...TRANSPORT_SOURCES, ...GROUND_SOURCES };
