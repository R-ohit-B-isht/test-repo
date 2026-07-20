// EventSource auto-reconnect behavior: kill the SSE server mid-stream, restart after ~3s,
// measure gap until events resume and how many reconnect attempts the browser made.
const { chromium } = require('playwright');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const OUT = __dirname + '/../results/reconnect-metrics.json';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  try { execSync('fuser -k 4000/tcp 2>/dev/null'); } catch {}
  await sleep(500);
  let mock = spawn('node', [__dirname + '/mock-api.js'], { stdio: 'ignore', detached: true });
  await sleep(800);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:4000/fe/astro-preact/', { waitUntil: 'load' });
  await page.waitForFunction('window.__benchReady === true', null, { timeout: 30000 });
  await page.evaluate(() => {
    window.__events = [];
    window.__errors = 0;
    const es = new EventSource('/api/events');
    es.onmessage = () => window.__events.push(Date.now());
    es.onerror = () => window.__errors++;
  });
  await sleep(3000);
  const before = await page.evaluate('window.__events.length');
  process.kill(-mock.pid, 'SIGKILL');
  const killedAt = Date.now();
  await sleep(3000);
  mock = spawn('node', [__dirname + '/mock-api.js'], { stdio: 'ignore', detached: true });
  const restartedAt = Date.now();
  await sleep(8000);
  const r = await page.evaluate((killedAt) => {
    const ev = window.__events;
    const lastBefore = ev.filter((t) => t < killedAt).pop();
    const firstAfter = ev.find((t) => t > killedAt);
    return { total_events: ev.length, errors: window.__errors, last_before: lastBefore, first_after: firstAfter };
  }, killedAt);
  const out = {
    events_before_kill: before,
    server_down_ms: restartedAt - killedAt,
    gap_ms: r.first_after - r.last_before,
    resume_after_restart_ms: r.first_after - restartedAt,
    reconnect_error_events: r.errors,
    resumed: !!r.first_after,
    note: 'EventSource reconnects automatically (default ~1-3s backoff); no client code needed. Gap = last event before kill -> first after restart.',
  };
  console.log(JSON.stringify(out, null, 2));
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  await browser.close();
  process.kill(-mock.pid, 'SIGKILL');
})();
