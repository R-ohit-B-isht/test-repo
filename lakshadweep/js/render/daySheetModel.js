// Day sheet model: one day of the plan → tiles grouped by category
// (Travel · See & do · Eat · Stay). Photos are the exact catalogue shots or
// the day's own route photo; everything else is an icon tile. Pure.
import { PHOTOS, itemPhotos, photoOwner } from '../data/photos.js';
import { EATS } from '../data/eats.js';
import { STAYS, STAY_CONF } from '../data/stays.js';
import { FARE_STATUS } from '../data/prices.js';
import { REACH, PACKAGE_FREE } from '../data/catalogue.js';
import { fmt } from '../budget.js';

const TRANSPORT = new Set(['plane', 'train', 'ship', 'boat', 'bus']);
const SLOT = { b: 'Breakfast', l: 'Lunch', d: 'Dinner' };

const fare = (p) => (p.status === 'unavailable' ? 'quote' : fmt(p.amount));
const hours = (h) => (h >= 24 ? `${Math.round(h / 24)} d` : `${h} h`);

function legTile(leg) {
  const p = leg.price;
  return {
    icon: leg.icon, name: `${leg.from} → ${leg.to}`, sub: leg.mode,
    tag: leg.package ? 'in package' : fare(p),
    note: `${hours(leg.hours)}${p.tbc ? ' · TBC' : ''} · ${FARE_STATUS[p.status].label}`,
  };
}

function pickTile(item, day) {
  const photos = itemPhotos(item.id);
  const tag = day.pkg && item.key && PACKAGE_FREE.has(item.key) ? 'in package'
    : item.reach !== 'base' ? REACH[item.reach].label : item.key ? '' : 'free';
  return { icon: item.icon, name: item.name, sub: item.sub || '', tag, photo: photos[0], count: photos.length, gallery: item.id };
}

// The route photo of a transit day (Fort Kochi, the ship) heads its Travel
// tiles, unless it belongs to a catalogue item and is shown under See & do.
function travelPhoto(day) {
  if (!day.photo || photoOwner(day.photo)) return null;
  return { id: day.photo, ...PHOTOS[day.photo] };
}

export function daySheetModel(plan, n) {
  const day = plan.days.find((d) => d.n === n);
  if (!day) return null;
  const legs = plan.legs.filter((l) => l.date === day.date).map(legTile);
  const fixed = (cat) => day.fixed.filter((f) => cat(f.ic)).map((f) => ({ icon: f.ic, name: f.t, sub: '' }));
  const travel = [...legs, ...fixed((ic) => TRANSPORT.has(ic))];
  const photo = travelPhoto(day);
  if (photo && travel.length) travel[0] = { ...travel[0], photo };
  const eat = ['b', 'l', 'd'].map((slot) => {
    const e = EATS[day.meals[slot]];
    return { icon: 'meal', name: e.name, sub: e.sub, tag: e.incl ? 'included' : SLOT[slot], slot: slot.toUpperCase() };
  });
  const stay = STAYS[day.stay];
  return {
    day,
    prev: plan.days.find((d) => d.n === n - 1) || null,
    next: plan.days.find((d) => d.n === n + 1) || null,
    cats: [
      { id: 'travel', label: 'Travel', tiles: travel },
      { id: 'do', label: 'See & do', tiles: [...day.picks.map((p) => pickTile(p, day)), ...fixed((ic) => !TRANSPORT.has(ic) && ic !== 'meal')] },
      { id: 'eat', label: 'Eat', tiles: [...eat, ...fixed((ic) => ic === 'meal')] },
      { id: 'stay', label: 'Stay', tiles: [{ icon: stay.icon, name: stay.name, sub: stay.sub, tag: STAY_CONF[stay.conf] }] },
    ].filter((c) => c.tiles.length),
  };
}
