import { icon } from '../../icons.js';
import { templateOf, ATTRIBUTION, SUBS } from '../../gmap/tiles.js';

// Leaflet adapter · the only file that talks to window.L (vendor/leaflet).
// The view hands it plain pin records and gets events back; swap the library
// and nothing above this changes.

const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export const hasLeaflet = () => typeof window !== 'undefined' && !!window.L;

const pinIcon = (p) => window.L.divIcon({
  className: `gpin gpin-${p.kind}${p.must ? ' is-must' : ''}${p.tag === 'night' ? ' is-night' : ''}`,
  html: `<span class="gpin-i">${icon(p.icon || 'pin').s}</span>${p.day != null ? `<b class="gpin-d num">${p.day}</b>` : ''}`,
  iconSize: [34, 42],
  iconAnchor: [17, 40],
  popupAnchor: [0, -36],
});

export function createMap(el, theme, { onSelect, popupHtml } = {}) {
  const L = window.L;
  const map = L.map(el, {
    zoomControl: false, attributionControl: true, zoomAnimation: !still(), fadeAnimation: !still(), markerZoomAnimation: !still(),
    worldCopyJump: false, tap: false,
  });
  map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  let base = L.tileLayer(templateOf(theme), { subdomains: SUBS, detectRetina: false, maxZoom: 19, attribution: ATTRIBUTION, crossOrigin: 'anonymous' }).addTo(map);
  const layer = L.layerGroup().addTo(map);
  const trail = L.layerGroup().addTo(map);
  const markers = new Map();
  let bounds = null;
  let current = theme;

  const setTheme = (t) => {
    if (t === current) return;
    current = t;
    base.remove();
    base = L.tileLayer(templateOf(t), { subdomains: SUBS, detectRetina: false, maxZoom: 19, attribution: ATTRIBUTION, crossOrigin: 'anonymous' }).addTo(map);
  };

  const setPins = (pins) => {
    layer.clearLayers();
    markers.clear();
    pins.forEach((p) => {
      const m = L.marker([p.lat, p.lng], { icon: pinIcon(p), title: p.name, alt: p.name, keyboard: true, riseOnHover: true });
      m.bindPopup(() => popupHtml(p), { className: 'gpop', maxWidth: 280, minWidth: 220, autoPanPadding: [24, 24] });
      m.on('click', () => onSelect?.(p.id));
      m.addTo(layer);
      markers.set(p.id, m);
    });
  };

  const fitTo = (b, fly = false) => {
    if (!b) return;
    bounds = L.latLngBounds(b);
    if (fly && !still()) map.flyToBounds(bounds, { padding: [24, 24], maxZoom: 15, duration: 0.6 });
    else map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15, animate: false });
  };

  const focus = (id) => {
    const m = markers.get(id);
    if (!m) return false;
    const ll = m.getLatLng();
    const z = Math.max(map.getZoom(), 15);
    if (still()) map.setView(ll, z, { animate: false }); else map.flyTo(ll, z, { duration: 0.5 });
    m.openPopup();
    return true;
  };

  const setTrail = (pts) => {
    trail.clearLayers();
    if (pts.length < 1) return;
    const ll = pts.map((p) => [p.lat, p.lng]);
    if (ll.length > 1) L.polyline(ll, { className: 'gtrail', weight: 3, dashArray: '2 6', interactive: false }).addTo(trail);
    pts.forEach((p) => L.circleMarker([p.lat, p.lng], { className: 'gtrail-dot', radius: 5, weight: 2, interactive: true })
      .bindTooltip(`You were here${p.day ? ` · Day ${p.day}` : ''}`, { direction: 'top', offset: [0, -6] }).addTo(trail));
  };

  const home = () => fitTo(bounds, true);
  const closePopup = () => map.closePopup();
  const invalidate = () => map.invalidateSize({ animate: false });
  const destroy = () => map.remove();
  return { map, setTheme, setPins, fitTo, focus, setTrail, home, closePopup, invalidate, destroy };
}
