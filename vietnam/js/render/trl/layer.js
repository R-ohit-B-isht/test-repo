import { html } from '../../dom.js';
import { nearStop, OFF_PLAN_KM } from '../../trail.js';
import { pinPoint, toPolyline } from '../../trail/replay.js';

// SVG layer for the GPS trail: the actual line over the planned one, one dot
// per pin. `upto` (replay) limits how much of the trail is drawn; the last dot
// drawn is the "you are here" marker. Pure markup — no DOM, no state.

const dot = (p, i, last) => {
  const [x, y] = pinPoint(p);
  const off = nearStop(p.lat, p.lng).km > OFF_PLAN_KM;
  return html`<circle class="tr-dot ${off ? 'is-off' : ''} ${i === last ? 'is-last' : ''}" cx="${x}" cy="${y}" r="${i === last ? 5 : 3}" data-pin="${p.id}"><title>${off ? 'Off-plan pin' : 'Pin'}</title></circle>`;
};

export const trailLayer = (pins, upto = pins.length) => {
  const shown = pins.slice(0, upto);
  if (!shown.length) return '';
  const pts = shown.map(pinPoint);
  return html`<g class="trail" aria-label="${shown.length} GPS pins">
    ${pts.length > 1 ? html`<polyline class="tr-line" points="${toPolyline(pts)}"/>` : ''}
    ${shown.map((p, i) => dot(p, i, shown.length - 1))}
  </g>`;
};

// Tiny legend swatches used under the map and in the replay.
export const trailLegend = () => html`
  <span class="tr-key"><i class="k-plan"></i>Planned</span>
  <span class="tr-key"><i class="k-real"></i>Where you were</span>`;
