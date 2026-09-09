import { $, $$ } from '../dom.js';
import { DAYS } from '../data/days.js';
import { CITIES, KINDS, cityOf, mapPins, pinsIn, onPlan, trailIn, boundsOf } from '../gmap.js';
import { cityTiles, MAX_TILES } from '../gmap/tiles.js';
import { canSave, savedInfo, saveCity, forgetCity, storageUsed } from '../gmap/cache.js';
import { isDark } from '../chrome/theme.js';
import { phaseNow } from '../today.js';
import { hasLeaflet, createMap } from './gm/leaflet.js';
import { cityChips, kindChips, pinList, popupHtml, noLeaflet } from './gm/view.js';
import { offlineCard } from './gm/offline.js';

// Street map page controller. View state (city, filters, selected pin, save
// job) lives here; the plan comes from the store on every change so a toggle
// anywhere re-pins the map. Leaflet is behind gm/leaflet.js.

const ui = { city: null, kinds: new Set(KINDS.map((k) => k.id)), cur: null, job: null, abort: null, saved: {}, quota: null, fitted: null };
let map = null;
let last = null;

const startCity = () => {
  const q = new URLSearchParams(location.search);
  if (CITIES.some((c) => c.id === q.get('city'))) return q.get('city');
  const now = phaseNow();
  if (now.phase === 'trip') return DAYS[now.dayN - 1]?.stop || CITIES[0].id;
  return DAYS[0].stop;
};

const theme = (state) => (isDark(state.theme) ? 'dark' : 'light');
const count = (pins, key) => pins.reduce((o, p) => ({ ...o, [p[key]]: (o[p[key]] || 0) + 1 }), {});
const areaOf = (city, pins) => boundsOf(pins, 0.01) || [[city.center[0] - 0.03, city.center[1] - 0.03], [city.center[0] + 0.03, city.center[1] + 0.03]];
const viewOf = (city, pins) => boundsOf(onPlan(pins), 0.004) || areaOf(city, pins);

const markCur = (id) => {
  ui.cur = id;
  $$('.gm-row').forEach((li) => {
    const on = li.querySelector('[data-focus]')?.dataset.focus === id;
    li.classList.toggle('is-cur', on);
    li.querySelector('[data-focus]')?.setAttribute('aria-current', String(on));
  });
};

// Chips, rows and the save card are re-rendered from scratch; keyboard focus
// follows the same control into the new markup so Enter never drops to the body.
const FOCUS_KEYS = ['city', 'kind', 'focus', 'pick', 'off'];
const focusKey = () => {
  const a = document.activeElement;
  if (!a || !$('#gmap')?.contains(a)) return null;
  const k = FOCUS_KEYS.find((key) => a.dataset[key] != null);
  return k ? `[data-${k}="${a.dataset[k]}"]` : null;
};
const refocus = (sel, fallback = null) => {
  const el = (sel && $(sel, $('#gmap'))) || (sel && fallback && $(fallback));
  el?.focus({ preventScroll: true });
};

const renderOffline = (state) => {
  if (!last) return;
  const city = cityOf(ui.city);
  const pins = pinsIn(last.pins, city.id);
  const had = focusKey();
  $('#gm-offline').innerHTML = offlineCard({
    city, n: cityTiles(areaOf(city, pins), pins).length, saved: ui.saved[city.id] || null, job: ui.job, theme: theme(state), quota: ui.quota, supported: canSave(),
  }).s;
  refocus(had, '#gm-offline [data-off]');
};

export function renderGmap(state) {
  last = mapPins(state);
  const city = cityOf(ui.city);
  const here = pinsIn(last.pins, city.id);
  const shown = here.filter((p) => ui.kinds.has(p.kind));
  const had = focusKey();
  $('#gm-head').innerHTML = cityChips(city, count(last.pins, 'stop')).s + kindChips(ui.kinds, count(here, 'kind')).s;
  $('#gm-list').innerHTML = pinList(shown, ui.cur, last.unpinned.filter((x) => x.stop === city.id)).s;
  refocus(had);
  $('#gm-canvas').setAttribute('aria-label', `Street map of ${city.name} · ${shown.length} pins`);
  renderOffline(state);
  if (!map) return;
  map.setTheme(theme(state));
  map.setPins(shown);
  map.setTrail(trailIn(state, city.id));
  if (ui.fitted !== city.id) {
    map.fitTo(viewOf(city, here), ui.fitted != null);
    ui.fitted = city.id;
  }
}

const focusPin = (id) => {
  markCur(id);
  if (map?.focus(id)) $('#gm-canvas').scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
};

const startSave = async (store) => {
  const state = store.get();
  const city = cityOf(ui.city);
  const pins = pinsIn(last.pins, city.id);
  const total = cityTiles(areaOf(city, pins), pins).length;
  if (total > MAX_TILES) return;
  ui.abort = new AbortController();
  ui.job = { done: 0, total, bytes: 0, failed: 0 };
  renderOffline(state);
  try {
    await saveCity(city, areaOf(city, pins), pins, theme(state), (p) => { ui.job = p; renderOffline(store.get()); }, ui.abort.signal);
  } catch { /* the manifest simply is not written */ }
  ui.job = null;
  ui.abort = null;
  ui.saved[city.id] = await savedInfo(city.id);
  ui.quota = await storageUsed();
  renderOffline(store.get());
};

const forget = async (store) => {
  const city = cityOf(ui.city);
  await forgetCity(city, areaOf(city, pinsIn(last.pins, city.id)), pinsIn(last.pins, city.id));
  ui.saved[city.id] = null;
  ui.quota = await storageUsed();
  renderOffline(store.get());
};

export function mountGmap(store) {
  const root = $('#gmap');
  ui.city = startCity();
  const canvas = $('#gm-canvas');
  if (hasLeaflet()) map = createMap(canvas, theme(store.get()), { popupHtml, onSelect: markCur });
  else canvas.innerHTML = noLeaflet().s;

  root.addEventListener('click', (e) => {
    const city = e.target.closest('[data-city]');
    if (city) { ui.city = city.dataset.city; ui.cur = null; map?.closePopup(); return renderGmap(store.get()); }
    const kind = e.target.closest('[data-kind]');
    if (kind) { const k = kind.dataset.kind; if (ui.kinds.has(k)) ui.kinds.delete(k); else ui.kinds.add(k); return renderGmap(store.get()); }
    const go = e.target.closest('[data-focus]');
    if (go) return focusPin(go.dataset.focus);
    const pick = e.target.closest('[data-pick]');
    if (pick) return store.togglePick(pick.dataset.pick);
    const off = e.target.closest('[data-off]');
    if (off?.dataset.off === 'save' && !ui.job) return startSave(store);
    if (off?.dataset.off === 'stop') return ui.abort?.abort();
    if (off?.dataset.off === 'forget') return forget(store);
    const home = e.target.closest('[data-home]');
    if (home) { ui.cur = null; map?.closePopup(); return map?.home(); }
    return undefined;
  });

  Promise.all(CITIES.map((c) => savedInfo(c.id).then((s) => { if (s) ui.saved[c.id] = s; }))).then(() => storageUsed()).then((q) => { ui.quota = q; renderOffline(store.get()); });

  const pin = new URLSearchParams(location.search).get('pin');
  if (pin && map) requestAnimationFrame(() => setTimeout(() => focusPin(pin), 400));
  addEventListener('resize', () => map?.invalidate());
}
