// Writes public/icons/icon.svg + icon.html — the header brand mark (accent disc, "S" in Plus Jakarta Sans) at icon scale,
// with the safe-zone padding maskable icons need. Rasterise the PNG sizes with any headless browser, e.g.
//   node scripts/pwa-icons.mjs && for s in 192 512; do npx playwright screenshot --viewport-size=$s,$s public/icons/icon.html public/icons/icon-$s.png; done
// Colours are the ones in src/index.css (--accent / --accent-ink, light theme) so the installed icon matches the app.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'icons');
const ACCENT = '#0f6e64';
const INK = '#ffffff';
const PAGE = '#f6f4f2';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="${PAGE}"/>
  <circle cx="256" cy="256" r="176" fill="${ACCENT}"/>
  <text x="256" y="256" fill="${INK}" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="800" font-size="224" text-anchor="middle" dominant-baseline="central" letter-spacing="-8">S</text>
</svg>`;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8" />
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800&display=swap" rel="stylesheet" />
<style>html,body{margin:0;height:100%;background:${PAGE}}svg{display:block;width:100vw;height:100vh}</style>
</head><body>${svg}</body></html>`;

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'icon.svg'), svg);
fs.writeFileSync(path.join(OUT, 'icon.html'), html);
console.log('icons/icon.svg + icon.html written');
