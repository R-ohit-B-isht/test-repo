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
  fares: {},        // fare.js · fares you logged after a recheck, per PRICES key
  order: {},        // plan.js · your drag order of picks per day { [n]: [ids] }
  hops: {},         // data/hops.js · how you do each intercity hop { [hopId]: wayId }
  hearts: {},       // votes.js · { [activityId]: { [personId]: true } }
  ritual: { dates: [], done: [] }, // ritual.js · ISO days you ticked a task (streak), micro task ids done
  cash: [],         // cash.js · ATM withdrawals { id, iso, vnd, fee, inr, deleted }
  fxLive: null,     // fx.js · last live rate fetched { vndPerInr, iso, src }
  trail: [],        // trail.js · GPS points you dropped { id, t, lat, lng, acc, day, deleted }
  photos: [],       // journal.js · photo metadata { id, day, name, type, size, created, deleted }; bytes in IndexedDB
  present: {},      // score.js · { [activityId]: { [personId]: 'planned' | 'paid' | 'showed' } }
  imports: [],      // importer.js · pasted links { id, url, provider, act, created, deleted }
  sync: null,       // sync.js · { room, at } once you join a room; never in share links
};

// Fields a share link may carry. Everything else is local: documents, money,
// people, photos, GPS, keys — they never enter a URL and a link never wipes them.
export const SHAREABLE = ['strategy', 'travellers', 'berth', 'bed', 'food', 'local', 'buffer', 'picks', 'custom', 'order', 'hops'];

// Gemini key lives in its own localStorage slot: never in state, never in the
// dev dump, never sent anywhere but generativelanguage.googleapis.com.
export const GEMINI_KEY_SLOT = 'vietnam-gemini-key';
export const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro'];
export const GEMINI_MODEL_SLOT = 'vietnam-gemini-model';

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
