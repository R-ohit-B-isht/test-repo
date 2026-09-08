// Day pills ("D3–6") and activity icons at each stop, plus hollow markers for
// picked islands the route never reaches. Pure: plan → SVG fragments.
import { PLACES } from '../data/geo.js';
import { isExtra } from '../data/catalogue.js';
import { esc } from '../dom.js';
import { W, CLUSTER, OFFMAP, proj } from './mapProj.js';

const ICON_MAX = 4;
const MERGE_PX = 18;

// Days whose anchors (a place, or the midpoint of a crossing) land within a
// pill's width of each other share one pill, e.g. both nights at sea → "D2, 8".
export function anchors(days) {
  const out = [];
  for (const d of days) {
    const pt = point(d.at);
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

function point(at) {
  if (!Array.isArray(at)) return proj(at);
  // Crossing: above the chord midpoint, clear of the mode badge on the arc.
  // A mainland-only day (Delhi–Kochi) shares the edge anchor's pill.
  if (at.every((p) => OFFMAP.has(p))) return proj(at[0]);
  const a = proj(at[0]), b = proj(at[1]);
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - 20 };
}

const where = (at) => (Array.isArray(at) ? 'sea' : OFFMAP.has(at) ? 'the mainland' : at);

function pill(a) {
  const { pt } = a;
  const label = rangeLabel(a.ns);
  const w = label.length * 4.6 + 8;
  const x = Math.min(Math.max(pt.x, w / 2 + 2), W - w / 2 - 2);
  const icons = [...new Set(a.picks.filter((p) => !isExtra(p) && p.group !== 'stopover').map((p) => p.icon))].slice(0, ICON_MAX);
  const row = icons.map((ic, i) => `<use href="#i-${ic}" x="${pt.x - (icons.length * 9) / 2 + i * 9}" y="${pt.y + 7}" width="8" height="8"/>`).join('');
  return `<g class="map__day" role="button" tabindex="0" data-daysheet="${a.ns[0]}" aria-label="Open day ${label.slice(1)} at ${esc(where(a.at))}">
    <rect x="${x - w / 2}" y="${pt.y - 20}" width="${w}" height="12" rx="6"/>
    <text x="${x}" y="${pt.y - 11.5}" text-anchor="middle">${label}</text>
    <g class="map__acts">${row}</g>
  </g>`;
}

export function dayLayer(plan) {
  return anchors(plan.days).map(pill).join('');
}

// Picked islands the route cannot reach: hollow dot at their real position.
// Agatti's islets are shown inside the lens instead.
export function ghostLayer(plan, drawn) {
  const ghosts = plan.skipped
    .map((s) => s.item)
    .filter((it) => it.group !== 'experience' && PLACES[it.at] && !drawn.has(it.at) && !CLUSTER.has(it.at) && !OFFMAP.has(it.at));
  return ghosts.map((it) => {
    const pt = proj(it.at);
    return `<circle class="map__ghost" cx="${pt.x}" cy="${pt.y}" r="3"><title>${esc(it.name)}: picked, not on this route</title></circle>`;
  }).join('');
}
