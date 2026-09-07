// Everything a traveller can switch on: islands, landmarks, experiences.
// The plan groups picked items onto nearby days automatically (see ../grouping.js).
import { ISLANDS, LANDMARKS } from './catalogue/places.js';
import { EXPERIENCES } from './catalogue/experiences.js';

export const CATALOGUE = [...ISLANDS, ...LANDMARKS, ...EXPERIENCES];
export const CATALOGUE_BY_ID = Object.fromEntries(CATALOGUE.map((c) => [c.id, c]));

export const CATALOGUE_GROUPS = [
  { id: 'inhabited', name: 'Inhabited islands', hint: 'Ten with villages; four sit on these routes · village walks ride along' },
  { id: 'uninhabited', name: 'Uninhabited islands & atolls', hint: 'Boat trips from a base island' },
  { id: 'landmark', name: 'Landmarks', hint: 'Free, on foot · ride along, don’t fill the day' },
  { id: 'experience', name: 'Experiences', hint: 'Paid unless noted' },
];

export const REACH = {
  base: { label: 'on foot', hint: 'On the island you sleep on' },
  excursion: { label: 'boat trip', hint: 'Shared boat from the base island; sea-state dependent' },
  nolanding: { label: 'no landing', hint: 'Protected sandbank: watch from the boat' },
  portcall: { label: 'off route', hint: 'Needs the ship’s port call or a separate vessel' },
  overnight: { label: 'needs a night', hint: 'Only possible if you sleep there' },
  noaccess: { label: 'no boats', hint: 'No public service to this atoll' },
};

// Experiences the Samudram package already covers on its shore days (PRICES ids).
export const PACKAGE_FREE = new Set(['kayak', 'snorkel', 'glassBottom']);

export const DEFAULT_PICKS = Object.fromEntries(CATALOGUE.map((c) => [c.id, Boolean(c.on)]));
export const MAX_PER_DAY = 4;
// Strolls, look-ins and meals-as-experiences: scheduled next to the day's real activities, never counted.
export const isExtra = (item) => item.slots === 0;
// Label for an extra riding along on a day: an inhabited island is its village walk.
export const extraTag = (item) => (item.group === 'inhabited' ? 'village walk' : 'nearby');
