// Flyweight icon set: one hand-drawn 24×24 stroke path per symbol, defined
// once as an SVG sprite and referenced with <use>. Stroke = currentColor.
const PATHS = {
  plane: 'M3 13l8-1 4-8h2l-1.5 8H21l1 2-6 1-2 6h-2l.5-6-6 1z',
  train: 'M6 4h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM4 11h16M8 14h.01M16 14h.01M8 18l-2 3M16 18l2 3M9 4V2h6v2',
  ship: 'M3 17l2-6h14l2 6M6 11V6h12v5M10 6V3h4v3M2 20c2 0 2 1.5 4 1.5S8 20 10 20s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5',
  boat: 'M4 15h16l-3 4H7zM6 15l2-7h5l6 7M11 8V5M2 21c2 0 2 1.5 4 1.5S8 21 10 21s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5',
  wave: 'M2 8c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2 2 2 4 2M2 14c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2 2 2 4 2M2 20c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2 2 2 4 2',
  snorkel: 'M4 10a5 4 0 0 1 10 0v2a5 4 0 0 1-10 0zM9 16v3M16 3v10a3 3 0 0 0 6 0',
  dive: 'M3 9a6 4 0 0 1 12 0v2a6 4 0 0 1-12 0zM9 8h.01M9 15v4M17 4h.01M19 7h.01M21 3h.01',
  kayak: 'M2 13c6-3 14-3 20 0-6 3-14 3-20 0zM12 11.5v3M5 4l14 16',
  glass: 'M4 15h16l-3 4H7zM7 15l1-6h8l1 6M9 12h6M12 9v3',
  home: 'M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6',
  bunk: 'M3 4v17M21 4v17M3 8h18M3 15h18M6 8v-2h6v2M6 15v-2h6v2',
  moon: 'M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z',
  meal: 'M5 3v18M3 3v5a2 2 0 0 0 4 0V3M17 3c-2 2-2 6-2 8a2 2 0 0 0 2 2v8M17 3c2 2 2 6 2 8',
  permit: 'M4 5h16v14H4zM7 9h4v4H7zM14 10h3M14 13h3M7 16h10',
  bag: 'M5 8h14l1 12H4zM9 8V5a3 3 0 0 1 6 0v3',
  sun: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  check: 'M5 12l5 5 9-10',
  pin: 'M12 22s7-7 7-13a7 7 0 1 0-14 0c0 6 7 13 7 13zM12 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  rupee: 'M6 4h12M6 9h12M6 4c6 0 8 1 8 4s-2 4-8 4l8 8',
  bus: 'M5 4h14a2 2 0 0 1 2 2v11H3V6a2 2 0 0 1 2-2zM3 11h18M7 17v3M17 17v3M7 14h.01M17 14h.01',
  island: 'M12 13v8M12 13c-3-1-5-4-4-7 2 0 4 2 4 4M12 13c3-1 5-4 4-7-2 0-4 2-4 4M12 10c-1-3 0-6 3-7M2 21c2 0 2 1.5 4 1.5S8 21 10 21s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5',
  fish: 'M2 12c4-5 10-5 14 0-4 5-10 5-14 0zM16 12l6-4v8zM6 12h.01',
  light: 'M9 21l1-13h4l1 13zM8 8h8M12 2v2M7 4l1 1M17 4l-1 1M4 21h16',
  mosque: 'M4 21V11a8 8 0 0 1 16 0v10zM12 3v3M9 21v-5a3 3 0 0 1 6 0v5M2 21h20',
  bird: 'M2 12c4 0 7-2 9-6 1 3 4 4 8 3l3 1-4 2c-2 5-8 7-13 4z M9 14l-2 6M12 14l0 6',
  dance: 'M12 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM12 7v6M12 13l-4 8M12 13l4 8M5 9l7 2 7-4',
  spark: 'M12 2l1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5zM5 3l.5 2L7.5 5.5 5.5 6 5 8l-.5-2L2.5 5.5 4.5 5zM19 16l.5 2 2 .5-2 .5-.5 2-.5-2-2-.5 2-.5z',
  walk: 'M13 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM9 21l3-7 3 3v4M9 12l3-3 3 2 3 1M12 9l-2 5-3 3',
  aquarium: 'M3 5h18v13H3zM3 9c3 0 3 2 6 2s3-2 6-2 3 2 6 2M8 14h.01M14 15h.01M12 18v3M8 21h8',
  camp: 'M12 3l10 18H2zM12 3v18M9 21l3-8 3 8',
  ban: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM5.5 5.5l13 13',
  camera: 'M3 8h4l2-3h6l2 3h4v12H3zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  left: 'M15 5l-7 7 7 7',
  right: 'M9 5l7 7-7 7',
  close: 'M6 6l12 12M18 6L6 18',
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  play: 'M8 5v14l11-7z',
  external: 'M14 4h6v6M20 4l-9 9M18 13v7H4V6h7',
};

export const ICON_NAMES = Object.keys(PATHS);

export function iconSprite() {
  const symbols = ICON_NAMES.map((n) => `<symbol id="i-${n}" viewBox="0 0 24 24"><path d="${PATHS[n]}"/></symbol>`).join('');
  return `<svg class="sprite" aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden">${symbols}</svg>`;
}

// Inline reference. Decorative by default; pass a label for standalone meaning.
export function icon(name, label = '') {
  const n = PATHS[name] ? name : 'pin';
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  return `<svg class="ic ic--${n}" ${a11y} focusable="false"><use href="#i-${n}"/></svg>`;
}
