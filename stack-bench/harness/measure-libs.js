// Measures chart-lib variants (avg SSE-driven update cost) and table-tanstack (10k rows).
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = __dirname + '/../results/lib-metrics.json';

(async () => {
  const browser = await chromium.launch();
  const results = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
  for (const name of process.argv.slice(2)) {
    try {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      const t0 = Date.now();
      await page.goto('http://localhost:4000/fe/' + name + '/', { waitUntil: 'load', timeout: 60000 });
      await page.waitForFunction('window.__benchReady === true', null, { timeout: 60000 });
      const tti = Date.now() - t0;
      let r = { tti_ms: tti, measured: true };
      if (name.startsWith('chart-')) {
        await page.waitForTimeout(15000); // ~150 SSE updates
        const stats = await page.evaluate(() => {
          const a = window.__chartUpdateMs || [];
          if (!a.length) return null;
          const s = [...a].sort((x, y) => x - y);
          const avg = a.reduce((x, y) => x + y, 0) / a.length;
          return { n: a.length, avg_ms: +avg.toFixed(3), p99_ms: +s[Math.floor(s.length * 0.99)].toFixed(2) };
        });
        r = { ...r, update: stats };
      } else if (name.startsWith('state-')) {
        await page.waitForTimeout(15000);
        const stats = await page.evaluate(() => {
          const a = window.__stateUpdateMs || [];
          if (!a.length) return null;
          const s = [...a].sort((x, y) => x - y);
          const avg = a.reduce((x, y) => x + y, 0) / a.length;
          return { n: a.length, avg_ms: +avg.toFixed(3), p99_ms: +s[Math.floor(s.length * 0.99)].toFixed(2) };
        });
        r = { ...r, update: stats };
      } else {
        // 10k rows page
        const ctx2 = await browser.newContext();
        const p2 = await ctx2.newPage();
        const t1 = Date.now();
        await p2.goto('http://localhost:4000/fe/' + name + '/?n=10000', { waitUntil: 'load', timeout: 120000 });
        await p2.waitForFunction('window.__benchReady === true', null, { timeout: 120000 });
        r.load10k_total_ms = Date.now() - t1;
        r.table10k_ms = await p2.evaluate('window.__tableRenderedAt');
        // sort click cost on 10k rows
        r.sort10k_ms = await p2.evaluate(async () => {
          const th = document.querySelector('th') || document.querySelector('.ag-header-cell-label');
          const s = performance.now();
          th.click();
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          return +(performance.now() - s).toFixed(1);
        });
        await ctx2.close();
      }
      results[name] = r;
      console.log(name, JSON.stringify(r));
      await ctx.close();
    } catch (e) {
      results[name] = { measured: false, error: e.message };
      console.log(name, 'FAILED', e.message);
    }
    fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
  }
  await browser.close();
})();
