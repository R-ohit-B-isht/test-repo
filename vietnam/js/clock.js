import { IS_DEV } from './config.js';
import { TRIP } from './data/trip.js';

// One clock for every "what day is it" question (fare verdicts, countdown,
// Today mode). Dev mode can pin it to any moment so each state is testable
// without waiting for October; the pin lives in its own slot, never in state.

const SLOT = 'vietnam-dev-clock';

export const now = () => {
  const pin = IS_DEV && localStorage.getItem(SLOT);
  const d = pin ? new Date(pin) : new Date();
  return Number.isNaN(d.getTime()) ? new Date() : d;
};

export const isoLocal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const today = () => isoLocal(now());
export const isPinned = () => IS_DEV && !!localStorage.getItem(SLOT);

// Dev pins, in the order the bar cycles them: null = real clock.
export const PINS = [
  ['real', null],
  ['T-60', `${shift(TRIP.start, -60)}T10:00:00`],
  ['T-30', `${shift(TRIP.start, -30)}T10:00:00`],
  ['T-1', `${shift(TRIP.start, -1)}T18:00:00`],
  ['Day 1', `${TRIP.start}T11:30:00`],
  ['Day 3 pm', `${shift(TRIP.start, 2)}T15:00:00`],
  ['Day 7 night', `${shift(TRIP.start, 6)}T21:00:00`],
  ['After', `${shift(TRIP.start, TRIP.days + 3)}T12:00:00`],
];

function shift(iso, days) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return isoLocal(d);
}

export const pinClock = (value) => { if (value) localStorage.setItem(SLOT, value); else localStorage.removeItem(SLOT); };
export const cyclePin = () => {
  const cur = localStorage.getItem(SLOT);
  const i = PINS.findIndex(([, v]) => v === cur);
  const [label, v] = PINS[(i + 1) % PINS.length];
  pinClock(v);
  return label;
};
