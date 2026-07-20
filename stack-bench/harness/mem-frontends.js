// Precise JS heap after SSE soak, via CDP Performance.getMetrics.
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = __dirname + '/../results/frontend-mem.json';
const SOAK = Number(process.env.SOAK_SEC || 45);

(async () => {
  const browser = await chromium.launch();
  const results = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
  for (const name of process.argv.slice(2)) {
    try {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto('http://localhost:4000/fe/' + name + '/', { waitUntil: 'load', timeout: 60000 });
      await page.waitForFunction('window.__benchReady === true', null, { timeout: 60000 });
      const session = await ctx.newCDPSession(page);
      await session.send('Performance.enable');
      const m0 = (await session.send('Performance.getMetrics')).metrics.find((m) => m.name === 'JSHeapUsedSize').value;
      await page.waitForTimeout(SOAK * 1000);
      const m1 = (await session.send('Performance.getMetrics')).metrics.find((m) => m.name === 'JSHeapUsedSize').value;
      results[name] = { heap_initial_mb: +(m0 / 1048576).toFixed(2), heap_after_soak_mb: +(m1 / 1048576).toFixed(2), soak_sec: SOAK };
      console.log(name, JSON.stringify(results[name]));
      await ctx.close();
    } catch (e) { console.log(name, 'FAILED', e.message); results[name] = { error: e.message }; }
    fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
  }
  await browser.close();
})();
