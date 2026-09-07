// The only edits the model may propose. Each op maps to one store field; the
// validator (validate.js) checks the value against the app's own data, so a
// hallucinated id never reaches the store.
import { STRATEGIES, SHIP_CLASSES, TRAIN_CLASSES } from '../strategies.js';
import { CATALOGUE_BY_ID } from '../data/catalogue.js';

export const TRAVELLERS = { min: 1, max: 6 };
export const HOMESTAY = { min: 2500, max: 5000, step: 100 };

export const OPS = {
  pick: { field: 'picks', label: 'Add', valid: (v) => Boolean(CATALOGUE_BY_ID[v]) },
  unpick: { field: 'picks', label: 'Drop', valid: (v) => Boolean(CATALOGUE_BY_ID[v]) },
  strategy: { field: 'strategy', label: 'Route', valid: (v) => STRATEGIES.some((s) => s.id === v) },
  shipClass: { field: 'shipClass', label: 'Ship class', valid: (v) => SHIP_CLASSES.some((c) => c.id === v) },
  trainClass: { field: 'trainClass', label: 'Train class', valid: (v) => TRAIN_CLASSES.some((c) => c.id === v) },
  travellers: { field: 'travellers', label: 'Travellers', valid: (v) => Number.isInteger(v) && v >= TRAVELLERS.min && v <= TRAVELLERS.max },
  homestayRate: { field: 'homestayRate', label: 'Homestay', valid: (v) => Number.isInteger(v) && v >= HOMESTAY.min && v <= HOMESTAY.max },
};

export const MAX_CHANGES = 8;

export const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    summary: { type: 'STRING', description: 'One short line, under 12 words, no ids.' },
    changes: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          op: { type: 'STRING', enum: Object.keys(OPS) },
          value: { type: 'STRING', description: 'An id from the allowed lists, or a number as text for travellers / homestayRate.' },
          why: { type: 'STRING', description: 'Under 8 words.' },
        },
        required: ['op', 'value', 'why'],
      },
    },
  },
  required: ['summary', 'changes'],
};
