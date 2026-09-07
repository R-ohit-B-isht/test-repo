// To-scale route map (equirectangular, real coordinates) with a zoom lens for
// the island cluster. Pure function of legs → SVG string.
import { PLACES } from '../data/trip.js';
import { esc } from '../dom.js';

const W = 260, H = 560, K = 25.5, LON0 = 69.6, LAT0 = 29.7;
const LENS = { cx: 78, cy: 300, r: 72, k: 110, lon: 72.41, lat: 10.75 };
const CLUSTER = new Set(['Agatti', 'Bangaram', 'Kavaratti']);
const DASH = { plane: '', ship: '7 5', boat: '2 4', train: '1 3' };
// Long overland legs bow east (over land, away from the lens); sea legs bow west.
const BOW = { plane: [-0.55, 1.25], train: [-0.55, 1.25] };

const proj = (name) => {
  const p = PLACES[name];
  return { x: (p.lon - LON0) * K, y: (LAT0 - p.lat) * K };
};
const lens = (name) => {
  const p = PLACES[name];
  return { x: LENS.cx + (p.lon - LENS.lon) * LENS.k, y: LENS.cy - (p.lat - LENS.lat) * LENS.k };
};

// Quadratic arc a→b, bowing perpendicular by `bow`. Badge sits at t=0.5, or offset along
// short legs so the out/back badges of a there-and-back pair don't stack.
function curve(a, b, bow) {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx - dy * 0.18 * bow, cy = my + dx * 0.18 * bow;
  const t = len < 140 ? 0.62 : 0.5;
  const u = 1 - t;
  const mid = { x: u * u * a.x + 2 * u * t * cx + t * t * b.x, y: u * u * a.y + 2 * u * t * cy + t * t * b.y };
  return { d: `M${a.x} ${a.y}Q${cx} ${cy} ${b.x} ${b.y}`, mid };
}

function legPath(leg, i, n, scope) {
  const at = scope === 'lens' ? lens : proj;
  const stops = [leg.from, ...(leg.via || []), leg.to];
  const out = i < n / 2;
  const bow = BOW[leg.icon] ? BOW[leg.icon][out ? 0 : 1] : (out ? 1 : -1);
  let d = '', mid = null;
  for (let s = 0; s < stops.length - 1; s++) {
    const c = curve(at(stops[s]), at(stops[s + 1]), leg.via ? (s % 2 ? -1 : 1) : bow);
    d += c.d;
    if (s === Math.floor((stops.length - 2) / 2)) mid = c.mid;
  }
  const badge = `<g class="map__mode" transform="translate(${mid.x} ${mid.y})"><circle r="9"/><use href="#i-${leg.icon}" x="-6" y="-6" width="12" height="12"/></g>`;
  return `<path class="map__leg" d="${d}" stroke-dasharray="${DASH[leg.icon] || ''}"/>${badge}`;
}

function node(name, pt, cls = '') {
  const code = PLACES[name].code ? ` <tspan class="map__code">${PLACES[name].code}</tspan>` : '';
  const labelLeft = PLACES[name].side === 'w';
  return `<g class="map__node ${cls}"><circle cx="${pt.x}" cy="${pt.y}" r="3.5"/>
    <text x="${pt.x + (labelLeft ? -8 : 8)}" y="${pt.y + 3.5}" text-anchor="${labelLeft ? 'end' : 'start'}">${esc(name)}${code}</text></g>`;
}

function graticule() {
  let g = '';
  for (let lat = 10; lat <= 25; lat += 5) {
    const y = (LAT0 - lat) * K;
    g += `<line class="map__grid" x1="0" y1="${y}" x2="${W}" y2="${y}"/><text class="map__gridlbl" x="4" y="${y - 3}">${lat}°N</text>`;
  }
  for (let lon = 72; lon <= 78; lon += 3) {
    const x = (lon - LON0) * K;
    g += `<line class="map__grid" x1="${x}" y1="0" x2="${x}" y2="${H}"/><text class="map__gridlbl" x="${x + 3}" y="${H - 6}">${lon}°E</text>`;
  }
  const km500 = 4.5 * K;
  g += `<g class="map__scale"><line x1="16" y1="${H - 28}" x2="${16 + km500}" y2="${H - 28}"/><text x="16" y="${H - 34}">500 km</text></g>`;
  return g;
}

export function routeMap(legs) {
  const places = new Set(legs.flatMap((l) => [l.from, l.to, ...(l.via || [])]));
  const mainLegs = legs.filter((l) => !(CLUSTER.has(l.from) && CLUSTER.has(l.to)));
  const lensLegs = legs.filter((l) => CLUSTER.has(l.from) && CLUSTER.has(l.to));
  const cluster = proj('Agatti');
  const inLens = [...places].filter((p) => CLUSTER.has(p));
  const showLens = inLens.length > 0;

  const mainNodes = [...places].filter((p) => !CLUSTER.has(p)).map((p) => node(p, proj(p)));
  const clusterNode = showLens ? `<g class="map__node"><circle cx="${cluster.x}" cy="${cluster.y}" r="3.5"/></g>` : '';
  const lensSvg = showLens ? `
    <g class="map__lens">
      <line class="map__lensline" x1="${cluster.x}" y1="${cluster.y}" x2="${LENS.cx + LENS.r * 0.7}" y2="${LENS.cy + LENS.r * 0.7}"/>
      <circle class="map__lensbg" cx="${LENS.cx}" cy="${LENS.cy}" r="${LENS.r}"/>
      <clipPath id="lensclip"><circle cx="${LENS.cx}" cy="${LENS.cy}" r="${LENS.r - 1}"/></clipPath>
      <g clip-path="url(#lensclip)">
        ${['Agatti', 'Bangaram', 'Kavaratti'].map((p) => `<circle class="map__isle" cx="${lens(p).x}" cy="${lens(p).y}" r="${p === 'Bangaram' ? 5 : 7}"/>`).join('')}
        ${lensLegs.map((l, i) => legPath(l, i, lensLegs.length, 'lens')).join('')}
      </g>
      ${inLens.map((p) => node(p, lens(p), 'map__node--lens')).join('')}
      <text class="map__gridlbl" x="${LENS.cx}" y="${LENS.cy + LENS.r + 12}" text-anchor="middle">island cluster ×4</text>
    </g>` : '';

  return `<svg class="map" viewBox="0 0 ${W} ${H}" role="img" aria-label="Map of the route: ${esc(legs.map((l) => `${l.from} to ${l.to} by ${l.mode}`).join('; '))}">
    ${graticule()}
    ${mainLegs.map((l, i) => legPath(l, i, mainLegs.length, 'main')).join('')}
    ${mainNodes.join('')}${clusterNode}
    ${lensSvg}
  </svg>`;
}
