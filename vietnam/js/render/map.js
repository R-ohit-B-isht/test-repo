import { $, html } from '../dom.js';
import { MAP } from '../data/map.js';
import { STOPS } from '../data/trip.js';
import { DAYS } from '../data/days.js';
import { livePins, trailStats } from '../trail.js';
import { trailLayer, trailLegend } from './trl/layer.js';

// Vietnam outline (Natural Earth) with the chosen route drawn on it, south to north.
// Delhi sits off-canvas to the west, so both international legs are arcs from the left edge.
// `mapSvg` is the bare map (the replay reuses it); `renderMap` mounts it on the
// Route page with the GPS trail drawn on top when there are pins.

const P = MAP.points;
const ORDER = ['hoian', 'danang', 'hue', 'hanoi'];
// [side, dy]: side = label left (-1) or right (+1) of the dot; dy nudges apart near-coincident stops.
const LABEL = { hanoi: [-1, 0], ninhbinh: [-1, 0], halong: [1, 0], hue: [-1, 0], danang: [1, -8], hoian: [1, 12] };

const arc = (a, b) => {
  const mx = (a[0] + b[0]) / 2; const my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0]; const dy = b[1] - a[1];
  return `M${a[0]} ${a[1]} Q${mx - dy * 0.25} ${my + dx * 0.25} ${b[0]} ${b[1]}`;
};

// Days spent at each stop, e.g. { hoian: [1, 2], hanoi: [5, 8] }.
const DAYS_AT = DAYS.reduce((m, d) => ({ ...m, [d.stop]: [...(m[d.stop] || []), d.n] }), {});
const dayText = (ns) => (ns.length > 1 && ns[ns.length - 1] - ns[0] === ns.length - 1 ? `${ns[0]}–${ns[ns.length - 1]}` : ns.join('·'));
let currentDay = 1;

const badge = (id, cur = currentDay) => {
  const ns = DAYS_AT[id]; if (!ns) return '';
  const [x, y0] = P[id]; const [side, dy] = LABEL[id]; const y = y0 + dy;
  const nameW = STOPS.find((s) => s.id === id).name.length * 7;
  const text = dayText(ns); const w = 10 + text.length * 7;
  const bx = x + side * (12 + nameW + 8 + w / 2);
  return html`<g class="day-badge ${ns.includes(cur) ? 'is-now' : ''}" data-days="${ns.join()}" role="button" tabindex="0" aria-label="Go to day ${text}">
    <rect x="${bx - w / 2}" y="${y - 9}" width="${w}" height="18" rx="9"/>
    <text x="${bx}" y="${y + 3.5}" text-anchor="middle">${text}</text>
  </g>`;
};

const label = (id) => {
  const s = STOPS.find((x) => x.id === id); const [x, y] = P[id]; const [side, dy] = LABEL[id];
  return html`<text class="lbl" x="${x + side * 12}" y="${y + 4 + dy}" text-anchor="${side < 0 ? 'end' : 'start'}">${s.name}</text>`;
};

export function mountMap() {
  document.addEventListener('day:current', (e) => {
    currentDay = e.detail;
    document.querySelectorAll('#map .day-badge').forEach((g) => g.classList.toggle('is-now', g.dataset.days.split(',').map(Number).includes(currentDay)));
  });
  // The day shelf lives on the Days page; from anywhere else a badge is a link there.
  const go = (g) => {
    const n = Number(g.dataset.days.split(',')[0]);
    if (!$('#shelf')) { window.location.href = `days.html?day=${n}`; return; }
    document.dispatchEvent(new CustomEvent('day:go', { detail: n }));
  };
  $('#map').addEventListener('click', (e) => { const g = e.target.closest('.day-badge'); if (g) go(g); });
  $('#map').addEventListener('keydown', (e) => { const g = e.target.closest('.day-badge'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); go(g); } });
}

export function mapSvg(strategy, overlay = '', extra = '', day = currentDay) {
  const [hx, hy] = P.hanoi;
  const [dx, dy] = P.danang;
  const hanoiLeg = `M-10 ${hy - 90} Q${hx - 60} ${hy - 80} ${hx} ${hy}`;
  const danangLeg = `M${dx} ${dy} Q${dx - 120} ${dy + 80} -10 ${dy + 30}`;
  const roundTrip = strategy.id === 'roundtrip';
  const segs = ORDER.slice(1).map((id, i) => {
    const from = P[ORDER[i]]; const to = P[id];
    const flying = strategy.transit === 'fly' && id === 'hanoi';
    return html`<path class="path ${flying ? 'path-fly' : ''}" d="${flying ? arc(from, to) : `M${from[0]} ${from[1]} L${to[0]} ${to[1]}`}"/>`;
  });
  const dayTrips = ['ninhbinh', 'halong'].map((id) => html`<path class="path" d="${arc(P.hanoi, P[id])}" stroke-dasharray="2 4"/>`);

  return html`
    <svg viewBox="${MAP.viewBox}" role="group" aria-label="Map of Vietnam showing the route from Hoi An and Da Nang up to Hue and Hanoi, with day trips to Ninh Binh and Ha Long Bay${extra}">
      <path class="land" d="${MAP.outline}"/>
      <rect class="rain-zone" x="0" y="${P.hue[1] - 40}" width="400" height="120" rx="12"/>
      <text class="rain-lbl" x="20" y="${P.hue[1] - 20}">TYPHOON WINDOW · OCT</text>
      <path class="path path-plane" d="${hanoiLeg}"/>
      <path class="path path-plane" d="${roundTrip ? arc(P.hanoi, P.danang) : danangLeg}"/>
      ${dayTrips}${segs}
      ${Object.keys(P).map((id) => html`<circle class="dot ${id === 'hanoi' || id === 'danang' ? 'dot-end' : ''}" cx="${P[id][0]}" cy="${P[id][1]}" r="${id === 'ninhbinh' || id === 'halong' ? 4 : 6}"/>`)}
      ${Object.keys(P).map(label)}
      ${Object.keys(P).map((id) => badge(id, day))}
      <text class="lbl-sub" x="14" y="${hy - 96}">${roundTrip ? 'DEL ✈ HAN ✈ DAD · HAN ✈ DEL' : 'HAN ✈ DEL'}</text>
      ${roundTrip ? '' : html`<text class="lbl-sub" x="14" y="${dy + 52}">DEL ✈ DAD</text>`}
      ${overlay}
    </svg>`;
}

export function renderMap(strategy, state) {
  const pins = state ? livePins(state) : [];
  const st = pins.length ? trailStats(state) : null;
  $('#map').innerHTML = html`
    ${mapSvg(strategy, trailLayer(pins), st ? `, with ${st.pins} GPS pins you dropped` : '')}
    ${st ? html`<div class="tr-under">${trailLegend()}<span class="sub num">${st.pins} pins · ${st.km} km</span><button class="btn btn-ghost btn-sm" type="button" data-replay>Replay</button></div>` : ''}`;
}
