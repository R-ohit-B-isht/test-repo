// Writes public/og.html — a 1200×630 social card built from the real manifest (counts, categories, capture date, weights).
// Rasterise to public/og.png with any headless browser, e.g. `node scripts/og-image.mjs && npx playwright screenshot ...`.
// Nothing here is typed by hand: every number comes from public/data/manifest.json, so the card can never drift from the data.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'public', 'data', 'manifest.json'), 'utf8'));

const inr = (n) => n.toLocaleString('en-IN');
const captured = new Date(manifest.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const byScope = manifest.categories.reduce(
  (a, c) => ({ face: a.face + c.byScope.face, body: a.body + c.byScope.body, both: a.both + c.byScope.both }),
  { face: 0, body: 0, both: 0 },
);
const weights = [
  ['Brand trust', manifest.weights.trust],
  ['Skin safety', manifest.weights.skin],
  ['Actives & ingredients', manifest.weights.ingredients],
  ['Format & experience', manifest.weights.experience],
];
const top = [...manifest.categories].sort((a, b) => b.count - a.count).slice(0, 6);

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8" />
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&display=swap" rel="stylesheet" />
<style>
  html,body{margin:0}
  body{width:1200px;height:630px;overflow:hidden;background:#f6f4f2;color:#1a171d;font-family:"Plus Jakarta Sans",system-ui,sans-serif;display:grid;grid-template-columns:1fr 380px;}
  .l{padding:64px 0 64px 72px;display:flex;flex-direction:column;justify-content:space-between}
  .kicker{font-size:15px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#0f6e64}
  h1{margin:18px 0 0;font-size:56px;line-height:1.05;letter-spacing:-.03em;font-weight:800;max-width:660px}
  .n{font-size:112px;line-height:1;font-weight:800;letter-spacing:-.04em;color:#0f6e64;font-variant-numeric:tabular-nums}
  .sub{font-size:22px;color:#5e5852;margin-top:10px;font-weight:500}
  .zones{display:flex;gap:10px;margin-top:22px}
  .z{font-size:15px;font-weight:700;padding:8px 14px;border-radius:999px;border:1.5px solid}
  .r{background:#ffffff;border-left:1px solid #e6e1db;padding:56px 44px;display:flex;flex-direction:column;justify-content:space-between}
  .lab{font-size:13px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#8a837b}
  .w{margin-top:14px;display:flex;justify-content:space-between;font-size:17px;font-weight:700}
  .w b{color:#0f6e64;font-variant-numeric:tabular-nums}
  .bar{height:6px;border-radius:999px;background:#efebe7;margin-top:6px;overflow:hidden}
  .bar i{display:block;height:100%;background:#0f6e64;border-radius:999px}
  .foot{font-size:14px;color:#8a837b;font-weight:500;line-height:1.5}
  .cats{margin-top:18px;font-size:15px;color:#5e5852;line-height:1.55}
</style></head><body>
<div class="l">
  <div>
    <div class="kicker">Skincare · India · real listings only</div>
    <h1>Every skincare category, ranked from live Flipkart &amp; Amazon.in pages.</h1>
  </div>
  <div>
    <div class="n">${inr(manifest.total)}</div>
    <div class="sub">listings across ${manifest.categories.length} categories · captured ${captured}</div>
    <div class="zones">
      <span class="z" style="color:#0f6e64;border-color:#0f6e64;background:#e0efec">Face ${inr(byScope.face)}</span>
      <span class="z" style="color:#3b7a3a;border-color:#3b7a3a;background:#e7f1e6">Face + body ${inr(byScope.both)}</span>
      <span class="z" style="color:#b7791f;border-color:#b7791f;background:#f8efe0">Body ${inr(byScope.body)}</span>
      <span class="z" style="color:#8a837b;border-color:#cfc8c0">Scope not stated ${inr(manifest.total - byScope.face - byScope.body - byScope.both)}</span>
    </div>
  </div>
</div>
<div class="r">
  <div>
    <div class="lab">How the score is built</div>
    ${weights.map(([k, v]) => `<div class="w"><span>${k}</span><b>${Math.round(v * 100)}</b></div><div class="bar"><i style="width:${Math.round(v * 100)}%"></i></div>`).join('')}
    <div class="cats">${top.map((c) => `${c.label} ${inr(c.count)}`).join(' · ')} …</div>
  </div>
  <div class="foot">Price shown, never scored.<br />Fields a seller never stated read “Not stated in listing”.</div>
</div>
</body></html>`;

fs.writeFileSync(path.join(ROOT, 'public', 'og.html'), html);
console.log(`og.html written: ${inr(manifest.total)} listings, ${manifest.categories.length} categories, captured ${captured}`);
