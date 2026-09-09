import { html, raw } from '../../dom.js';
import { icon } from '../../icons.js';
import { PHOTOS } from '../../data/photos.js';
import { dateOf } from '../../data/trip.js';
import { whereFor } from '../../data/days.js';
import { pinsOn, whereIs, pathKm, trailStats } from '../../trail.js';
import { stopName } from '../../today.js';
import { trailLegend } from './layer.js';

// Markup for the trail: the "I'm here" card on Today and the replay overlay.
// Controllers (render/trail.js, render/replay.js) own state and events.

const hm = (t) => new Date(t).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
const acc = (m) => (m >= 1000 ? `±${(m / 1000).toFixed(1)} km` : `±${m} m`);

const pinRow = (p) => {
  const w = whereIs(p);
  const where = w.place ? `${stopName(w.stop.id)} · near ${w.place.name}` : w.offPlan ? `${Math.round(w.stop.km)} km from ${stopName(w.stop.id)}` : `${stopName(w.stop.id)} · ${w.stop.km < 1 ? 'centre' : `${Math.round(w.stop.km)} km out`}`;
  return html`
    <li class="trpin ${w.offPlan ? 'is-off' : ''}">
      <span class="trpin-t num">${hm(p.t)}</span>
      <span class="trpin-body"><b>${where}</b><span class="sub num">${p.lat.toFixed(4)}, ${p.lng.toFixed(4)} · ${acc(p.acc)}</span></span>
      <a class="btn-icon" href="https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}" target="_blank" rel="noopener" aria-label="Open pin in Google Maps">${icon('pin')}</a>
      <button class="btn-icon" type="button" data-trail-del="${p.id}" aria-label="Remove pin">${icon('trash')}</button>
    </li>`;
};

const status = (ui) => {
  if (ui.busy) return html`<p class="sub trst" role="status" aria-live="polite">${icon('clock')} Getting a GPS fix…</p>`;
  if (ui.error) return html`<p class="sub trst is-err" role="alert">${icon('info')} ${ui.error}</p>`;
  return '';
};

// Today page card. `n` = trip day shown; pins listed are that day's.
export const trailCard = (state, n, ui) => {
  const pins = pinsOn(state, n);
  const all = trailStats(state);
  return html`
    <section class="tsec trail-card" aria-labelledby="trail-h" data-trail-card="${n}">
      <h2 class="eyebrow" id="trail-h">Trail · day ${n}</h2>
      <div class="card trailc">
        <div class="row trailc-top">
          <button class="btn" type="button" data-trail-pin ${ui.busy ? raw('disabled aria-busy="true"') : ''}>${icon('pin')}I'm here</button>
          <span class="sub num">${pins.length ? `${pins.length} pin${pins.length > 1 ? 's' : ''} · ${Math.round(pathKm(pins))} km today` : 'No pins yet today'}</span>
        </div>
        ${status(ui)}
        ${pins.length ? html`<ul class="trpins">${pins.map(pinRow)}</ul>` : html`<p class="sub">Tap once per stop · the route map draws where you really went. Pins stay on this phone.</p>`}
        ${all.pins ? html`<div class="row trailc-foot"><span class="sub num">${all.pins} pins · ${all.km} km · ${all.days} day${all.days === 1 ? '' : 's'}</span><a class="btn btn-ghost btn-sm" href="index.html#map">${icon('grid')}On the map</a>${all.days > 1 ? html`<button class="btn btn-ghost btn-sm" type="button" data-replay>${icon('play')}Replay</button>` : ''}</div>` : ''}
      </div>
    </section>`;
};

// After the trip: the recap card on Today.
export const trailAfter = (state) => {
  const s = trailStats(state);
  return s.pins ? html`
    <section class="tsec" aria-labelledby="recap-h">
      <h2 class="eyebrow" id="recap-h">Your trail</h2>
      <div class="card trailc">
        <div class="row trailc-top"><span class="num big-num">${s.km} km</span><span class="sub">${s.pins} pins · ${s.stops} of 6 stops · ${s.days} days</span></div>
        <div class="row"><button class="btn" type="button" data-replay>${icon('play')}Replay the trip</button><a class="btn btn-ghost" href="index.html#map">${icon('grid')}On the map</a></div>
      </div>
    </section>` : '';
};

// Replay overlay. `svg` is the map with the trail drawn up to this frame.
export const replayView = (frames, i, svg, transit, playing, reduce) => {
  const f = frames[i];
  const last = i === frames.length - 1;
  const total = trailStats({ trail: frames.at(-1).cum });
  const p = PHOTOS[f.day.photo];
  return html`
    <div class="card">
      <div class="card-head">
        <h3 class="h3" id="replay-title">Replay · ${last ? 'the whole trip' : `Day ${f.n} of ${frames.length}`}</h3>
        <button class="btn-icon" type="button" data-close aria-label="Close">×</button>
      </div>
      <div class="rp-grid">
        <div class="map rp-map">${svg}<div class="rp-key">${trailLegend()}</div></div>
        <div class="rp-side">
          <div class="rp-photo"><img src="assets/photos/${f.day.photo}.jpg" alt="${p.alt}" width="${p.w}" height="${p.h}" style="object-position: ${p.pos || '50% 50%'}" decoding="async" /></div>
          <span class="eyebrow">${dateOf(f.n)} · ${whereFor(f.day, transit) || stopName(f.day.stop)}</span>
          <h4 class="rp-title">${f.day.title}</h4>
          <p class="rp-stat num">${f.pins.length ? `${f.pins.length} pin${f.pins.length > 1 ? 's' : ''} · ${f.km} km${f.stops.length ? ` · ${f.stops.map(stopName).join(', ')}` : ''}` : 'No pins this day'}</p>
          ${last ? html`<div class="rp-end"><span class="eyebrow">Peak-end</span><b class="num">${total.km} km · ${total.pins} pins · ${total.stops} stops</b><div class="row"><button class="btn btn-sm" type="button" data-rp-share>${icon('share')}Share</button><a class="btn btn-ghost btn-sm" href="split.html">${icon('wallet')}Settle up</a></div></div>` : ''}
        </div>
      </div>
      <div class="rp-bar">
        <button class="btn-icon" type="button" data-rp="prev" aria-label="Previous day" ${i === 0 ? 'disabled' : ''}>‹</button>
        <ol class="rp-dots" aria-label="Days">${frames.map((x, k) => html`<li><button type="button" data-rp-go="${k}" class="${k === i ? 'is-cur' : k < i ? 'is-done' : ''}" aria-label="Day ${x.n}" aria-current="${k === i ? 'step' : 'false'}"></button></li>`)}</ol>
        ${reduce ? '' : html`<button class="btn-icon" type="button" data-rp="toggle" aria-label="${playing ? 'Pause' : 'Play'}" aria-pressed="${String(playing)}">${playing ? '❚❚' : icon('play')}</button>`}
        <button class="btn-icon" type="button" data-rp="next" aria-label="Next day" ${last ? 'disabled' : ''}>›</button>
      </div>
    </div>`;
};
