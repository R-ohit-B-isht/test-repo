// Frontend measurements via Playwright (cold load, TTI, 10k render, SSE memory).
const { chromium } = require('playwright');
const fs = require('fs');

const FRONTENDS = process.argv.slice(2);
const BASE = 'http://localhost:4000/fe/';
const OUT = __dirname + '/../results/frontend-metrics.json';

async function coldLoad(browser, name, query, waitReady, memSeconds) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const t0 = Date.now();
  await page.goto(BASE + name + '/' + query, { waitUntil: 'load', timeout : 60000 });
  const loadMs = Date.now() - t0;
  let ttiMs = null, tableMs = null;
  if (waitReady) {
    try {
      await page.waitForFunction('window.__benchReady === true', null, { timeout: 60000 });
      ttiMs = Date.now() - t0;
      tableMs = await page.evaluate('window.__tableRenderedAt');
    } catch (e) { ttiMs = -1; }
  }
  const perf = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const fcp = performance.getEntriesByName('first-contentful-paint')[0];
    return { domContentLoaded: nav ? nav.domContentLoadedEventEnd : null, fcp: fcp ? fcp.startTime : null };
  });
  let memMB = null;
  if (memSeconds) {
    await page.waitForTimeout(memSeconds * 1000);
    memMB = await page.evaluate(() => (performance.memory ? performance.memory.usedJSHeapSize / 1048576 : null));
  }
  await ctx.close();
  return { loadMs, ttiMs, tableMs, ...perf, memMB };
}

(async () => {
  const browser = await chromium.launch();
  const results = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
  for (const name of FRONTENDS) {
    console.log('measuring', name);
    try {
      // cold load + TTI (median of 3)
      const runs = [];
      for (let i = 0; i < 3; i++) runs.push(await coldLoad(browser, name, '', true, 0));
      runs.sort((a, b) => a.ttiMs - b.ttiMs);
      const med = runs[1];
      // 10k rows render
      const big = await coldLoad(browser, name, '?n=10000', true, 0);
      // memory after SSE soak
      const soakSec = Number(process.env.SOAK_SEC || 45);
      const mem = await coldLoad(browser, name, '', true, soakSec);
      results[name] = {
        load_ms: med.loadMs, tti_ms: med.ttiMs, fcp_ms: med.fcp,
        table10k_ms: big.tableMs, load10k_total_ms: big.ttiMs,
        mem_after_soak_mb: mem.memMB, soak_sec: soakSec, measured: true,
      };
      console.log(name, JSON.stringify(results[name]));
    } catch (e) {
      console.log(name, 'FAILED', e.message);
      results[name] = { measured: false, error: e.message };
    }
    fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
  }
  await browser.close();
})();
