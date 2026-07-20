// End-to-end Astro-frontend x backend pairings.
// For each backend: start it, start pair-proxy, Playwright-load the Astro console,
// measure cold load, TTI, rows fetch time, POST action RTT (20x avg), SSE first-event
// latency and inter-event jitter (30 events).
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const { chromium } = require('playwright');

const OUT = __dirname + '/../results/pairing-metrics.json';
const DEFS = JSON.parse(fs.readFileSync(__dirname + '/backend-defs.json', 'utf8'));
const targets = process.argv.slice(2);
const PROXY_PORT = 4100;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function waitUp(port, pathname, timeoutMs = 90000) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    (function poll() {
      const req = http.get({ host: '127.0.0.1', port, path: pathname }, (res) => { res.resume(); resolve(Date.now() - t0); });
      req.on('error', () => { if (Date.now() - t0 > timeoutMs) reject(new Error('timeout')); else setTimeout(poll, 30); });
    })();
  });
}

(async () => {
  const results = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
  const browser = await chromium.launch();
  for (const name of targets) {
    const def = DEFS[name];
    if (!def) { console.log('no def', name); continue; }
    let be = null, proxy = null;
    try {
      be = spawn('bash', ['-c', def.cmd], { cwd: def.cwd, env: { ...process.env, PORT: String(def.port) }, stdio: 'ignore', detached: true });
      await waitUp(def.port, '/api/rows');
      proxy = spawn('node', [__dirname + '/pair-proxy.js', String(def.port), String(PROXY_PORT)], { stdio: 'ignore', detached: true });
      await waitUp(PROXY_PORT, '/fe/astro/index.html');

      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      const t0 = Date.now();
      await page.goto(`http://127.0.0.1:${PROXY_PORT}/fe/astro/`, { waitUntil: 'load', timeout: 60000 });
      const loadMs = Date.now() - t0;
      await page.waitForFunction('window.__benchReady === true', null, { timeout: 60000 });
      const ttiMs = Date.now() - t0;

      const m = await page.evaluate(async () => {
        // rows fetch (5x)
        const rows = [];
        for (let i = 0; i < 5; i++) { const s = performance.now(); await (await fetch('/api/rows')).json(); rows.push(performance.now() - s); }
        // POST RTT (20x)
        const posts = [];
        for (let i = 0; i < 20; i++) { const s = performance.now(); await (await fetch('/api/action', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"cmd":"x"}' })).json(); posts.push(performance.now() - s); }
        // SSE: first-event latency + inter-event gaps for 30 events
        const sse = await new Promise((resolve) => {
          const es = new EventSource('/api/events');
          const t0 = performance.now(); let first = null; let last = null; const gaps = [];
          es.onmessage = () => {
            const now = performance.now();
            if (first === null) first = now - t0; else gaps.push(now - last);
            last = now;
            if (gaps.length >= 30) { es.close(); resolve({ first, gaps }); }
          };
          setTimeout(() => { es.close(); resolve({ first, gaps }); }, 15000);
        });
        const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
        const jitter = sse.gaps.length ? Math.sqrt(avg(sse.gaps.map((g) => (g - 100) ** 2))) : null;
        return { rows_ms: +avg(rows).toFixed(2), post_rtt_ms: +avg(posts).toFixed(2), sse_first_ms: sse.first != null ? +sse.first.toFixed(1) : null, sse_jitter_ms: jitter != null ? +jitter.toFixed(2) : null, sse_events: sse.gaps.length + 1 };
      });
      results[name] = { load_ms: loadMs, tti_ms: ttiMs, ...m, measured: true };
      console.log(name, JSON.stringify(results[name]));
      await ctx.close();
    } catch (e) {
      console.log(name, 'FAILED', e.message);
      results[name] = { measured: false, error: e.message };
    }
    try { if (proxy) process.kill(-proxy.pid, 'SIGKILL'); } catch {}
    try { if (be) process.kill(-be.pid, 'SIGKILL'); } catch {}
    try { execSync(`fuser -k ${def.port}/tcp 2>/dev/null; fuser -k ${PROXY_PORT}/tcp 2>/dev/null`); } catch {}
    fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
    await sleep(800);
  }
  await browser.close();
})();
