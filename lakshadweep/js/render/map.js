// To-scale map of the archipelago (equirectangular, real coordinates) with a
// zoom lens for the islets around Agatti. Only toured places are plotted; the
// mainland legs run to one "Kochi →" anchor on the east edge. Pure function of
// plan → SVG string. Day pills and activity icons come from mapDays.js.
import { PLACES } from '../data/geo.js';
import { esc } from '../dom.js';
import { W, H, K, LAT0, LON0, LENS, CLUSTER, OFFMAP, EDGE, proj, lens, curve } from './mapProj.js';
import { dayLayer, ghostLayer } from './mapDays.js';

const DASH = { plane: '', ship: '7 5', boat: '2 4', train: '1 3' };

// Every arc bows to the right of its travel direction, so the out and back
// legs of a there-and-back pair fall on opposite sides of the chord.
function legPath(leg) {
  const stops = [leg.from, ...(leg.via || []), leg.to];
  let d = '', mid = null;
  for (let s = 0; s < stops.length - 1; s++) {
    const c = curve(proj(stops[s]), proj(stops[s + 1]), s % 2 ? -1 : 1);
    d += c.d;
    if (s === Math.floor((stops.length - 2) / 2)) mid = c.mid;
  }
  const badge = `<g class="map__mode" transform="translate(${mid.x} ${mid.y})"><circle r="9"/><use href="#i-${leg.icon}" x="-6" y="-6" width="12" height="12"/></g>`;
  return `<path class="map__leg" d="${d}" stroke-dasharray="${DASH[leg.icon] || ''}"/>${badge}`;
}

const LABEL = {
  w: (pt) => `x="${pt.x - 8}" y="${pt.y + 3.5}" text-anchor="end"`,
  e: (pt) => `x="${pt.x + 8}" y="${pt.y + 3.5}" text-anchor="start"`,
  n: (pt) => `x="${pt.x}" y="${pt.y - 7}" text-anchor="middle"`,
};

function node(name, pt, cls = '', side = PLACES[name].side) {
  const code = PLACES[name].code ? ` <tspan class="map__code">${PLACES[name].code}</tspan>` : '';
  return `<g class="map__node ${cls}"><circle cx="${pt.x}" cy="${pt.y}" r="3.5"/>
    <text ${LABEL[side](pt)}>${esc(name)}${code}</text></g>`;
}

// Mainland anchor: the legs from Delhi/Kochi arrive here from off the map.
function edgeNode() {
  const { x, y } = EDGE;
  return `<g class="map__node map__node--edge" aria-label="Kochi, 400 km east, off the map">
    <path d="M${x - 4} ${y - 4}L${x} ${y}L${x - 4} ${y + 4}"/>
    <text ${LABEL.w({ x: x - 1, y })}>Kochi <tspan class="map__code">→</tspan></text></g>`;
}

function graticule() {
  let g = '';
  for (let lat = 9; lat <= 11; lat++) {
    const y = (LAT0 - lat) * K;
    g += `<line class="map__grid" x1="0" y1="${y}" x2="${W}" y2="${y}"/><text class="map__gridlbl" x="4" y="${y - 3}">${lat}°N</text>`;
  }
  for (let lon = 72; lon <= 73; lon++) {
    const x = (lon - LON0) * K;
    g += `<line class="map__grid" x1="${x}" y1="0" x2="${x}" y2="${H}"/><text class="map__gridlbl" x="${x + 3}" y="${H - 6}">${lon}°E</text>`;
  }
  const km100 = 0.9 * K;
  g += `<g class="map__scale"><line x1="${W - 16 - km100}" y1="${H - 28}" x2="${W - 16}" y2="${H - 28}"/><text x="${W - 16}" y="${H - 34}" text-anchor="end">100 km</text></g>`;
  return g;
}

// Lens: Agatti and its lagoon islets at ×3. Filled dot = on the plan,
// dashed = picked but unreachable, plain = not picked.
function lensLayer(plan) {
  const agatti = proj('Agatti');
  const onPlan = new Set(plan.days.flatMap((d) => [d.base, ...d.picks.map((p) => p.at)]));
  const skipped = new Set(plan.skipped.map((s) => s.item.at));
  const isles = { Agatti: 9, Bangaram: 5, Thinnakara: 4, Kalpitti: 2.5 };
  const sides = { Agatti: 'w', Bangaram: 'w', Thinnakara: 'n', Kalpitti: 'w' };
  const state = (p) => (onPlan.has(p) ? 'is-on' : skipped.has(p) ? 'is-ghost' : 'is-off');
  return `
    <g class="map__lens">
      <line class="map__lensline" x1="${agatti.x}" y1="${agatti.y}" x2="${LENS.cx}" y2="${LENS.cy - LENS.r}"/>
      <circle class="map__lensbg" cx="${LENS.cx}" cy="${LENS.cy}" r="${LENS.r}"/>
      <clipPath id="lensclip"><circle cx="${LENS.cx}" cy="${LENS.cy}" r="${LENS.r - 1}"/></clipPath>
      <g clip-path="url(#lensclip)">
        ${Object.entries(isles).map(([p, r]) => `<circle class="map__isle" cx="${lens(p).x}" cy="${lens(p).y}" r="${r}"/>`).join('')}
      </g>
      ${Object.keys(isles).map((p) => node(p, lens(p), `map__node--lens ${state(p)}`, sides[p])).join('')}
      <text class="map__gridlbl" x="${LENS.cx}" y="${LENS.cy + LENS.r + 12}" text-anchor="middle">Agatti lagoon ×3</text>
    </g>`;
}

export function routeMap(plan) {
  const legs = plan.legs.filter((l) => ![l.from, l.to, ...(l.via || [])].every((p) => OFFMAP.has(p)));
  const places = new Set(legs.flatMap((l) => [l.from, l.to, ...(l.via || [])]));
  const islands = [...places].filter((p) => !OFFMAP.has(p));
  const showLens = islands.some((p) => CLUSTER.has(p));
  const summary = plan.legs.map((l) => `${l.from} to ${l.to} by ${l.mode}`).join('; ');

  return `<svg class="map" viewBox="0 0 ${W} ${H}" role="img" aria-label="Map of the islands on this route: ${esc(summary)}. Day numbers mark each stop.">
    ${graticule()}
    ${legs.map(legPath).join('')}
    ${edgeNode()}
    ${islands.map((p) => node(p, proj(p))).join('')}
    ${showLens ? lensLayer(plan) : ''}
    ${dayLayer(plan)}
    ${ghostLayer(plan, places)}
  </svg>`;
}
