import { $, html } from '../dom.js';
import { MAP } from '../data/map.js';
import { STOPS } from '../data/trip.js';

// Vietnam outline (Natural Earth) with the chosen route drawn on it.
// Delhi sits off-canvas to the west, so the arrival is an arc in from the left edge.

const P = MAP.points;
const ORDER = { train: ['hanoi', 'hue', 'danang', 'hoian'], bus: ['hanoi', 'hue', 'danang', 'hoian'], fly: ['hanoi', 'danang', 'hue', 'danang', 'hoian'] };
// [side, dy]: side = label left (-1) or right (+1) of the dot; dy nudges apart near-coincident stops.
const LABEL = { hanoi: [-1, 0], ninhbinh: [-1, 0], halong: [1, 0], hue: [-1, 0], danang: [1, -8], hoian: [1, 12] };

const arc = (a, b) => {
  const mx = (a[0] + b[0]) / 2; const my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0]; const dy = b[1] - a[1];
  return `M${a[0]} ${a[1]} Q${mx - dy * 0.25} ${my + dx * 0.25} ${b[0]} ${b[1]}`;
};

const label = (id) => {
  const s = STOPS.find((x) => x.id === id); const [x, y] = P[id]; const [side, dy] = LABEL[id];
  return html`<text class="lbl" x="${x + side * 12}" y="${y + 4 + dy}" text-anchor="${side < 0 ? 'end' : 'start'}">${s.name}</text>`;
};

export function renderMap(strategy) {
  const stops = ORDER[strategy.transit];
  const [hx, hy] = P.hanoi;
  const [dx, dy] = P.danang;
  const inbound = `M-10 ${hy - 90} Q${hx - 60} ${hy - 80} ${hx} ${hy}`;
  const outbound = `M${dx} ${dy} Q${dx - 120} ${dy + 80} -10 ${dy + 30}`;
  const roundTrip = strategy.id === 'roundtrip';
  const segs = stops.slice(1).map((id, i) => {
    const from = P[stops[i]]; const to = P[id];
    const flying = strategy.transit === 'fly' && i === 0;
    return html`<path class="path ${flying ? 'path-fly' : ''}" d="${flying ? arc(from, to) : `M${from[0]} ${from[1]} L${to[0]} ${to[1]}`}"/>`;
  });
  const dayTrips = ['ninhbinh', 'halong'].map((id) => html`<path class="path" d="${arc(P.hanoi, P[id])}" stroke-dasharray="2 4"/>`);

  $('#map').innerHTML = html`
    <svg viewBox="${MAP.viewBox}" role="img" aria-label="Map of Vietnam showing the route from Hanoi to Hue, Da Nang and Hoi An, with day trips to Ninh Binh and Ha Long Bay">
      <path class="land" d="${MAP.outline}"/>
      <rect class="rain-zone" x="0" y="${P.hue[1] - 40}" width="400" height="120" rx="12"/>
      <text class="rain-lbl" x="20" y="${P.hue[1] - 20}">TYPHOON WINDOW · OCT</text>
      <path class="path path-plane" d="${inbound}"/>
      <path class="path path-plane" d="${roundTrip ? arc(P.danang, P.hanoi) : outbound}"/>
      ${dayTrips}${segs}
      ${Object.keys(P).map((id) => html`<circle class="dot ${id === 'hanoi' || id === 'danang' ? 'dot-end' : ''}" cx="${P[id][0]}" cy="${P[id][1]}" r="${id === 'ninhbinh' || id === 'halong' ? 4 : 6}"/>`)}
      ${Object.keys(P).map(label)}
      <text class="lbl-sub" x="14" y="${hy - 96}">DEL ✈ HAN</text>
      <text class="lbl-sub" x="14" y="${roundTrip ? dy + 60 : dy + 52}">${roundTrip ? 'DAD ✈ HAN ✈ DEL' : 'DAD ✈ DEL'}</text>
    </svg>`;
}
