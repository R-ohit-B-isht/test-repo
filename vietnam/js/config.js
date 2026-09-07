import { DEFAULT_PICKS } from './data/activities.js';

const params = new URLSearchParams(location.search);

export const IS_DEV = params.get('dev') === '1' || localStorage.getItem('IS_DEV') === 'true';

export const STORAGE_KEY = 'vietnam-planner-v3';

export const DEFAULT_STATE = {
  strategy: 'train',
  travellers: 2,
  berth: '6',
  bed: 850,
  food: 1000,
  local: 300,
  buffer: 10,
  picks: DEFAULT_PICKS,
  custom: [],
  checklist: {},
  theme: 'auto',
};

// Gemini key lives in its own localStorage slot: never in state, never in the
// dev dump, never sent anywhere but generativelanguage.googleapis.com.
export const GEMINI_KEY_SLOT = 'vietnam-gemini-key';
export const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro'];
