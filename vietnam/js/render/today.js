import { $, html } from '../dom.js';
import { icon } from '../icons.js';
import { isPinned } from '../clock.js';
import { phaseNow, dayNow, ticketsOn, nextEvents } from '../today.js';
import { fetchWeather } from '../weather.js';
import { recordOf, liveFiles, slotsFor } from '../vault/slots.js';
import { openPeek, mountPeek } from './mgr/peek.js';
import { hero, stack, weather, tickets, before, after } from './tod/view.js';
import { trailSection, mountTrail } from './trail.js';
import { trailAfter } from './trl/view.js';
import { todayCard } from './jn/view.js';

// Today page controller. Re-renders on store changes and once a minute so
// the "now" card moves on its own; weather is fetched once per stop + date
// and cached for the session (Open-Meteo updates hourly anyway).

let store;
let state;
let wxKey = '';
let wx;
let wxCtl = null;

const pinNote = () => (isPinned() ? html`<p class="tpin sub">${icon('clock')} Dev clock is pinned · use the dev bar to move it</p>` : '');

function loadWeather(stopId, iso) {
  const key = `${stopId}|${iso}`;
  if (key === wxKey) return;
  wxKey = key;
  wx = undefined;
  wxCtl?.abort();
  wxCtl = new AbortController();
  const ctl = wxCtl;
  fetchWeather(stopId, iso, ctl.signal)
    .then((res) => { if (!ctl.signal.aborted) { wx = res; paint(); } })
    .catch((e) => { if (!ctl.signal.aborted) { wx = { ok: false, reason: e.name === 'TypeError' ? 'Offline · forecast needs a connection' : e.message }; paint(); } });
}

function paint() {
  const root = $('#today');
  if (!root || !state) return;
  const ph = phaseNow();
  root.dataset.phase = ph.phase;
  if (ph.phase === 'before') {
    root.innerHTML = html`${pinNote()}${before(ph, nextEvents(state, ph.iso))}`;
    return;
  }
  if (ph.phase === 'after') {
    const done = Object.values(state.picks || {}).filter(Boolean).length;
    root.innerHTML = html`${pinNote()}${after(ph, done)}${todayCard(state, null)}${trailAfter(state)}`;
    return;
  }
  const d = dayNow(state, ph);
  const tix = ticketsOn(state, ph.iso, d.day.n);
  loadWeather(d.stop, ph.iso);
  root.innerHTML = html`
    ${pinNote()}
    ${hero(d, ph, wx)}
    <div class="tgrid">
      <div>${stack(d, tix, ph)}</div>
      <aside>${weather(wx, d.stop, ph, d.day.n)}${trailSection(state, d.day.n)}${todayCard(state, d.day.n)}${tickets(tix)}</aside>
    </div>`;
}

const peekFile = (ref) => {
  const [slotId, fileId] = ref.split(':');
  const meta = liveFiles(recordOf(state, slotId)).find((f) => f.id === fileId);
  if (meta) openPeek(meta);
};

const jumpToTicket = (slotId) => {
  const t = slotsFor(state).find((s) => s.id === slotId);
  const files = liveFiles(recordOf(state, slotId));
  if (files.length) return openPeek(files[0]);
  if (t) location.href = `manager.html#slot-${slotId}`;
};

export function mountToday(s) {
  store = s;
  const root = $('#today');
  if (!root) return;
  mountPeek();
  mountTrail(s);
  root.addEventListener('click', (e) => {
    const day = e.target.closest('[data-open-day]');
    if (day) return document.dispatchEvent(new CustomEvent('day:open', { detail: Number(day.dataset.openDay) }));
    const peek = e.target.closest('[data-peek]');
    if (peek) return peekFile(peek.dataset.peek);
    const tix = e.target.closest('[data-tix]');
    if (tix) return jumpToTicket(tix.dataset.tix);
  });
  let last = new Date().getMinutes();
  setInterval(() => {
    const m = new Date().getMinutes();
    if (m !== last) { last = m; paint(); }
  }, 15000);
  const retry = () => {
    if (wx && !wx.ok && !wx.opens) wxKey = '';
    paint();
  };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) retry(); });
  window.addEventListener('online', retry);
}

export function renderToday(st) {
  state = st;
  paint();
}
