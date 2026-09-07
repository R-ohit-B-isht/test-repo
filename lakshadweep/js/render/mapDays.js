// Day pills ("D3–6") and activity icons at each stop, plus hollow markers for
// picked islands the route never reaches. Pure: plan → SVG fragments.
import { PLACES } from '../data/geo.js';
import { esc } from '../dom.js';
import { locate, proj } from './mapProj.js';

const ICON_MAX = 4;
const MERGE_PX = 18;

// Days whose anchors (a place, or the midpoint of a crossing) land within a
// pill's width of each other share one pill, e.g. both nights at sea → "D2, 8".
export function anchors(days, showLens) {
  const out = [];
  for (const d of days) {
    const pt = point(d.at, showLens);
    const near = out.find((a) => Math.hypot(a.pt.x - pt.x, a.pt.y - pt.y) < MERGE_PX);
    const a = near || { at: d.at, pt, ns: [], picks: [] };
    a.ns.push(d.n);
    a.picks.push(...d.picks);
    if (!near) out.push(a);
  }
  return out;
}

// [1, 9, 10] → "D1, 9–10"
export function rangeLabel(ns) {
  const out = [];
  for (let i = 0; i < ns.length; i++) {
    let j = i;
    while (ns[j + 1] === ns[j] + 1) j++;
    out.push(j > i ? `${ns[i]}–${ns[j]}` : `${ns[i]}`);
    i = j;
  }
  return `D${out.join(', ')}`;
}

function point(at, showLens) {
  if (!Array.isArray(at)) return locate(at, showLens);
  const a = proj(at[0]), b = proj(at[1]);
  return { x: (a.x + b.x) / 2 - 24, y: (a.y + b.y) / 2 - 10 };
}

function pill(a) {
  const { pt } = a;
  const label = rangeLabel(a.ns);
  const w = label.length * 4.6 + 8;
  const icons = [...new Set(a.picks.map((p) => p.icon))].slice(0, ICON_MAX);
  const row = icons.map((ic, i) => `<use href="#i-${ic}" x="${pt.x - (icons.length * 9) / 2 + i * 9}" y="${pt.y + 7}" width="8" height="8"/>`).join('');
  return `<g class="map__day" aria-label="Day ${label.slice(1)} at ${esc(Array.isArray(a.at) ? 'sea' : a.at)}">
    <rect x="${pt.x - w / 2}" y="${pt.y - 20}" width="${w}" height="12" rx="6"/>
    <text x="${pt.x}" y="${pt.y - 11.5}" text-anchor="middle">${label}</text>
    <g class="map__acts">${row}</g>
  </g>`;
}

export function dayLayer(plan, showLens) {
  return anchors(plan.days, showLens).map(pill).join('');
}

// Picked islands the route cannot reach: hollow dot at their real position.
export function ghostLayer(plan, drawn) {
  const ghosts = plan.skipped
    .map((s) => s.item)
    .filter((it) => it.group !== 'experience' && PLACES[it.at] && !drawn.has(it.at) && it.at !== 'Kalpitti');
  if (!ghosts.length) return '';
  const dots = ghosts.map((it) => {
    const pt = proj(it.at);
    return `<circle class="map__ghost" cx="${pt.x}" cy="${pt.y}" r="3"><title>${esc(it.name)}: picked, not on this route</title></circle>`;
  });
  return `${dots.join('')}<text class="map__gridlbl" x="6" y="12">○ picked, off this route</text>`;
}
