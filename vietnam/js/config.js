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
  vault: {},
  vaultCustom: [],
  events: [],
  me: null,
  people: [],
  expenses: [],
  rate: 0,
  theme: 'auto',
};

// Gemini key lives in its own localStorage slot: never in state, never in the
// dev dump, never sent anywhere but generativelanguage.googleapis.com.
export const GEMINI_KEY_SLOT = 'vietnam-gemini-key';
export const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro'];

// Google Calendar sync: the OAuth client id you paste and the ids of events
// already pushed live in their own slots too — never in state, never shared.
export const GCAL_CLIENT_SLOT = 'vietnam-gcal-client';
export const GCAL_MAP_SLOT = 'vietnam-gcal-map';
export const GCAL_NAME = 'Vietnam · Oct 2026';

// Documents (e-visa PDF, tickets, passport scan) are stored as blobs in IndexedDB;
// only their names and sizes live in state.
export const VAULT_DB = 'vietnam-vault';
export const VAULT_MAX_MB = 25;

// Split ledger: whole rupees per entry; ₫ entries are converted with the rate
// you set (0 = use the sourced mid-market rate from data/trip.js).
export const SPLIT_MAX_INR = 5_000_000;
export const SPLIT_MAX_PEOPLE = 12;
