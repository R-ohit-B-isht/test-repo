// Generates a self-contained dark HTML report (no external deps) from results.json
const fs = require('fs');
const R = JSON.parse(fs.readFileSync(__dirname + '/../results/results.json', 'utf8'));
const OUT = __dirname + '/../results/report.html';

const esc = (s) => String(s ?? '—').replace(/&/g, '&amp;').replace(/</g, '&lt;');

function bar(rows, fmt = (v) => v, invert = false) {
  // rows: [{label, value, lit}]
  const vals = rows.filter((r) => r.value != null).map((r) => r.value);
  const max = Math.max(...vals);
  return `<div class="chart">` + rows.map((r) => {
    if (r.value == null) return `<div class="brow"><span class="blabel">${esc(r.label)}</span><span class="bna">n/a${r.lit ? ' (literature)' : ''}</span></div>`;
    const pct = Math.max(1.5, (r.value / max) * 100);
    const cls = r.lit ? 'bfill lit' : 'bfill';
    return `<div class="brow"><span class="blabel">${esc(r.label)}${r.lit ? '<sup>†</sup>' : ''}</span><span class="btrack"><span class="${cls}" style="width:${pct}%"></span></span><span class="bval">${fmt(r.value)}</span></div>`;
  }).join('') + `</div>`;
}

const F = Object.entries(R.frontends).map(([k, v]) => ({ key: k, ...v }));
const B = Object.entries(R.backends).map(([k, v]) => ({ key: k, ...v }));

const sortBy = (arr, f, asc = true) => [...arr].sort((a, b) => {
  const av = f(a), bv = f(b);
  if (av == null) return 1; if (bv == null) return -1;
  return asc ? av - bv : bv - av;
});

const feTable = `<table><thead><tr>
<th>Frontend</th><th>Bundle gzip (kB)</th><th>Cold load (ms)</th><th>TTI (ms)</th><th>10k-row render (ms)</th><th>Heap after 45s SSE (MB)</th><th>Build (s)</th><th>Railway fit</th><th>TypeScript</th><th>Ecosystem</th><th>Hiring / AI familiarity</th><th>Maintenance risk</th>
</tr></thead><tbody>` +
sortBy(F, (r) => r.bundle_gzip_kb).map((r) => `<tr>
<td class="name">${esc(r.label)}</td><td>${r.bundle_gzip_kb}</td><td>${r.load_ms}</td><td>${r.tti_ms}</td><td>${r.table10k_ms}</td><td>${r.heap_after_soak_mb}</td><td>${r.build_s}</td>
<td>${esc(r.railway_fit)}</td><td>${esc(r.ts)}</td><td>${esc(r.ecosystem)}</td><td>${esc(r.hiring_ai)}</td><td>${esc(r.maintenance_risk)}</td></tr>`).join('') + '</tbody></table>';

const beTable = `<table><thead><tr>
<th>Backend</th><th>RPS (JSON, 64c)</th><th>p99 (ms)</th><th>RSS idle (MB)</th><th>RSS load (MB)</th><th>200 SSE CPU %</th><th>Cold start (ms)</th><th>Image (MB)</th><th>Railway fit</th><th>Hiring / AI</th><th>Maintenance risk</th>
</tr></thead><tbody>` +
sortBy(B, (r) => r.rps, false).map((r) => {
  const lit = r.literature;
  return `<tr class="${r.measured ? '' : 'litrow'}">
<td class="name">${esc(r.label)}${r.measured ? '' : ' <sup>†</sup>'}</td>
<td>${r.measured ? r.rps.toLocaleString() : esc(lit ? lit.rps_note : null)}</td>
<td>${r.measured ? r.p99_ms : '—'}</td>
<td>${r.measured ? r.rss_idle_mb.toFixed(0) : esc(lit ? lit.rss_idle_mb : null)}</td>
<td>${r.measured ? r.rss_load_mb.toFixed(0) : '—'}</td>
<td>${r.measured ? r.sse200_cpu_pct : '—'}</td>
<td>${r.measured ? r.cold_start_ms : esc(lit ? lit.cold_start : null)}</td>
<td>${esc(r.image_mb_est)}</td>
<td>${esc(r.railway_fit)}</td><td>${esc(r.hiring_ai)}</td><td>${esc(r.maintenance_risk)}</td></tr>`;
}).join('') + '</tbody></table>';

const M = B.filter((b) => b.measured);
const AV = Object.entries(R.astro_variants || {}).map(([k, v]) => ({ key: k, ...v }));
const PAIR = Object.entries(R.astro_backend_pairings || {}).map(([k, v]) => ({ key: k, label: (R.backends[k] || {}).label || k, ...v })).filter((p) => p.measured);

const avTable = AV.length ? `<table><thead><tr><th>Astro variant</th><th>Bundle gzip (kB)</th><th>Cold load (ms)</th><th>TTI (ms)</th><th>10k-row render (ms)</th><th>Heap after 45s SSE (MB)</th><th>Build (s)</th></tr></thead><tbody>` +
  sortBy(AV, (r) => r.bundle_gzip_kb).map((r) => `<tr><td class="name">${esc(r.label)}</td><td>${r.bundle_gzip_kb}</td><td>${r.load_ms}</td><td>${r.tti_ms}</td><td>${r.table10k_ms}</td><td>${r.heap_after_soak_mb}</td><td>${r.build_s}</td></tr>`).join('') + '</tbody></table>' : '';

const pairTable = PAIR.length ? `<table><thead><tr><th>Backend (serving Astro console)</th><th>Page TTI (ms)</th><th>Rows fetch (ms, avg 5)</th><th>POST action RTT (ms, avg 20)</th><th>SSE first event (ms)</th><th>SSE jitter vs 100ms tick (ms, σ over 30)</th></tr></thead><tbody>` +
  sortBy(PAIR, (r) => r.post_rtt_ms).map((r) => `<tr><td class="name">${esc(r.label)}</td><td>${r.tti_ms}</td><td>${r.rows_ms}</td><td>${r.post_rtt_ms}</td><td>${r.sse_first_ms}</td><td>${r.sse_jitter_ms}</td></tr>`).join('') + '</tbody></table>' : '';
const LIBS = Object.entries(R.lib_benchmarks || {}).map(([k, v]) => ({ key: k, ...v })).filter((l) => l.measured);
const CHARTS = LIBS.filter((l) => l.key.startsWith('chart-'));
const TT = LIBS.find((l) => l.key === 'table-tanstack');
const AG = LIBS.find((l) => l.key === 'table-aggrid');
const STATES = LIBS.filter((l) => l.key.startsWith('state-'));
const PG = R.postgres_driver_bench;
const GL = R.go_backend_libs;
const RT = R.realtime_transports;
const RC = R.sse_reconnect;
const CMP = R.compression;

const chartLibTable = CHARTS.length ? `<table><thead><tr><th>Chart library (in Astro+Preact island)</th><th>Bundle gzip (kB, whole page)</th><th>TTI (ms)</th><th>Update cost @10Hz SSE (avg ms, n≈150)</th><th>Update p99 (ms)</th></tr></thead><tbody>` +
  sortBy(CHARTS, (r) => r.bundle_gzip_kb).map((r) => `<tr><td class="name">${esc(r.label)}</td><td>${r.bundle_gzip_kb}</td><td>${r.tti_ms}</td><td>${r.update ? r.update.avg_ms : '-'}</td><td>${r.update ? r.update.p99_ms : '-'}</td></tr>`).join('') + '</tbody></table>' : '';

const stateTable = STATES.length ? `<table><thead><tr><th>State layer (Astro+Preact island, 200-row table)</th><th>Bundle gzip (kB, whole page)</th><th>TTI (ms)</th><th>Update+render cost @10Hz SSE (avg ms)</th><th>p99 (ms)</th></tr></thead><tbody>` +
  sortBy(STATES, (r) => r.update ? r.update.avg_ms : 99).map((r) => `<tr><td class="name">${esc(r.label)}</td><td>${r.bundle_gzip_kb}</td><td>${r.tti_ms}</td><td>${r.update ? r.update.avg_ms : '-'}</td><td>${r.update ? r.update.p99_ms : '-'}</td></tr>`).join('') + '</tbody></table>' : '';
const tableLibTable = (TT && AG) ? `<table><thead><tr><th>Table library (10k rows)</th><th>Bundle gzip (kB, whole page)</th><th>Initial 10k render (ms)</th><th>Sort click (ms)</th></tr></thead><tbody>` +
  [TT, AG].map((r) => `<tr><td class="name">${esc(r.label)}</td><td>${r.bundle_gzip_kb}</td><td>${r.table10k_ms.toFixed(0)}</td><td>${r.sort10k_ms}</td></tr>`).join('') + `<tr><td class="name">Plain Preact (unvirtualized baseline)</td><td>10.6</td><td>158</td><td>—</td></tr></tbody></table>` : '';
const glTables = GL ? `
<table><thead><tr><th>Go JSON encoder (200-row payload)</th><th>RPS</th><th>p99 (ms)</th></tr></thead><tbody>${Object.entries(GL.json_encoders).map(([k, v]) => `<tr><td class="name">${esc(k)}</td><td>${v.rps.toLocaleString()}</td><td>${v.p99_ms}</td></tr>`).join('')}</tbody></table>
<table><thead><tr><th>Echo DB layer (real Postgres, 200-row query)</th><th>RPS</th><th>p99 (ms)</th></tr></thead><tbody>${Object.entries(GL.db_layers).filter(([k]) => k !== 'note').map(([k, v]) => `<tr><td class="name">${esc(k)}</td><td>${v.rps.toLocaleString()}</td><td>${v.p99_ms}</td></tr>`).join('')}</tbody></table>
<table><thead><tr><th>Middleware / validation</th><th>RPS</th><th>p99 (ms)</th></tr></thead><tbody>${Object.entries({ ...GL.middleware, ...GL.validation }).map(([k, v]) => `<tr><td class="name">${esc(k)}</td><td>${v.rps.toLocaleString()}</td><td>${v.p99_ms}</td></tr>`).join('')}</tbody></table>` : '';
const rtTable = RT ? `<table><thead><tr><th>Transport (Go Echo, 10 ev/s per conn)</th><th>Conns</th><th>Delivery avg (ms)</th><th>p99 (ms)</th><th>Server CPU %</th></tr></thead><tbody>${Object.entries(RT).map(([k, v]) => `<tr><td class="name">${esc(k)}</td><td>${v.conns}</td><td>${v.latency.avg_ms}</td><td>${v.latency.p99_ms}</td><td>${v.server_cpu_pct}</td></tr>`).join('')}</tbody></table>` : '';
const cmpTable = CMP ? `<table><thead><tr><th>Astro build (JS+CSS)</th><th>Raw (kB)</th><th>gzip -9 (kB)</th><th>brotli -q11 (kB)</th><th>brotli saves vs gzip</th></tr></thead><tbody>${Object.entries(CMP).map(([k, v]) => `<tr><td class="name">${esc(k)}</td><td>${v.raw_kb}</td><td>${v.gzip_kb}</td><td>${v.brotli_kb}</td><td>${v.brotli_vs_gzip_pct}%</td></tr>`).join('')}</tbody></table>` : '';
const imgMeasuredTable = R.docker_images_measured ? `<table><thead><tr><th>Backend</th><th>Measured image (MB, uncompressed)</th><th>Earlier estimate (MB)</th></tr></thead><tbody>${Object.entries(R.docker_images_measured).filter(([, v]) => typeof v === 'number').sort((a, b) => a[1] - b[1]).map(([k, v]) => `<tr><td class="name">${esc(k)}</td><td>${v}</td><td>${(R.backends[k] && R.backends[k].image_mb_est) || '-'}</td></tr>`).join('')}</tbody></table>` : '';
const pgTable = PG ? `<table><thead><tr><th>Echo + Postgres endpoint</th><th>Driver</th><th>RPS (oha 5s × 64)</th><th>p99 (ms)</th></tr></thead><tbody>` +
  Object.entries(PG.endpoints).map(([k, v]) => `<tr><td class="name">${esc(k)}</td><td>${esc(v.driver)}</td><td>${v.rps.toLocaleString()}</td><td>${v.p99_ms}</td></tr>`).join('') + '</tbody></table>' : '';
const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>CEO Console — Stack Benchmark Report</title>
<style>
:root{--bg:#0d1117;--card:#161b22;--line:#21262d;--fg:#c9d1d9;--dim:#8b949e;--acc:#58a6ff;--lit:#d29922}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.5 system-ui,-apple-system,sans-serif;padding:32px;max-width:1400px;margin:auto}
h1{font-size:26px;font-weight:600}h2{font-size:19px;margin-top:44px;border-bottom:1px solid var(--line);padding-bottom:6px}h3{font-size:15px;color:var(--acc)}
table{border-collapse:collapse;width:100%;font-size:12.5px;margin:14px 0}
th,td{border:1px solid var(--line);padding:5px 8px;text-align:left;vertical-align:top}
th{background:var(--card);position:sticky;top:0}
td.name{font-weight:600;white-space:nowrap}
tr:nth-child(even){background:#10151c}
tr.litrow{color:var(--lit)}
.chart{margin:10px 0 26px}
.brow{display:flex;align-items:center;gap:8px;margin:3px 0}
.blabel{width:210px;text-align:right;font-size:12px;color:var(--dim);flex-shrink:0}
.btrack{flex:1;background:var(--card);border-radius:3px;height:14px;overflow:hidden}
.bfill{display:block;height:100%;background:linear-gradient(90deg,#1f6feb,#58a6ff)}
.bfill.lit{background:linear-gradient(90deg,#9e6a03,#d29922)}
.bval{width:110px;font-size:12px;color:var(--fg)}
.bna{color:var(--dim);font-size:12px}
.card{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:18px 22px;margin:14px 0}
.win{border-left:3px solid var(--acc)}
code{background:var(--card);padding:1px 5px;border-radius:4px;font-size:12px}
ul{margin:6px 0}
.dim{color:var(--dim)}
sup{color:var(--lit)}
</style></head><body>
<h1>CEO Console — Technology Stack Benchmark</h1>
<p class="dim">Generated ${R.generated_at} · ${R.environment.machine} · workload: ${esc(R.workload.sse)}; ${esc(R.workload.list)}; ${esc(R.workload.action)}. Frontend renders live feed + sortable 200-row table updating from SSE. All 21 frontends and all 23 backends were measured locally (version/deployment caveats in section 4). Section 3 deep-dives Astro 5 (the chosen frontend): island combinations and end-to-end pairings with all 23 backends.</p>

<div class="card win"><h3>Chosen direction: Astro 5</h3>
With Astro 5 locked as the frontend, the measured pairing data (section 3) says: use a <b>plain-script or Solid island</b> (0.9–9&nbsp;kB gzip, 73–110&nbsp;ms 10k render), and pair with <b>Go/Echo</b> (cheapest on Railway), <b>Node/Fastify</b> (TS-first), or <b>Phoenix</b> (many-user live-push future). Avoid the React island unless you need React libraries — it costs 46&nbsp;kB and ~2.2x the render time for identical code.<br><br>
<b>Full recommended stack (all layers measured, sections 3c–3h):</b> Astro 5 + Preact island · <b>@preact/signals or nanostores</b> for state · <b>uPlot</b> charts (Lightweight Charts/D3 the only close seconds) · <b>TanStack Table + Virtual</b> via preact/compat · <b>Go Echo + pgx</b> (sqlc for type-safety) · SSE (built-in auto-reconnect measured) with optional <b>Postgres LISTEN/NOTIFY</b> push (+~1&nbsp;ms) · brotli precompression · <b>5.9&nbsp;MB real Docker image</b>.</div>
<div class="card win"><h3>Winners</h3>
<b>(a) Single-user internal console:</b> <b>Svelte 5 (Vite) or Preact + Fastify/Hono on Node</b> — but honestly, at one user every measured stack is instant; pick React (Vite) + Fastify if you want maximum AI-agent &amp; hiring familiarity at negligible cost (46&nbsp;kB gzip, 46&nbsp;ms TTI).<br><br>
<b>(b) Growth to multi-view live dashboard:</b> <b>React 18 (Vite SPA) + Node/Fastify</b>, with SolidJS as the performance-ceiling alternative (5.2&nbsp;kB, 105&nbsp;ms 10k-row render, flat heap under SSE). React's ecosystem (charting, tables, virtualization) and AI familiarity dominate long-term cost. Avoid SSR meta-frameworks (Next/Nuxt) — they add build weight and deploy complexity with no benefit for an authenticated live dashboard.<br><br>
<b>(c) API/control-plane backend on Railway:</b> <b>Go (net/http or Echo)</b> — 97k RPS, 6&nbsp;MB RSS, 21&nbsp;ms cold start, ~12&nbsp;MB image, stdlib-stable. If the team is TypeScript-first: <b>Node + Fastify</b> (12.9k RPS is far beyond a console's needs; best Postgres/ecosystem story). Bun+Elysia/Hono is the measured TS performance king (29k RPS) but younger operationally.</div>

<h2>1. Frontends — measured results (all 21 measured locally)</h2>
${feTable}

<h3>Production bundle size, gzip (kB) — lower is better</h3>
${bar(sortBy(F, (r) => r.bundle_gzip_kb).map((r) => ({ label: r.label, value: r.bundle_gzip_kb })), (v) => v + ' kB')}

<h3>Time to interactive, cold load (ms, median of 3) — lower is better</h3>
${bar(sortBy(F, (r) => r.tti_ms).map((r) => ({ label: r.label, value: r.tti_ms })), (v) => v + ' ms')}

<h3>10,000-row table render (ms) — lower is better</h3>
${bar(sortBy(F, (r) => r.table10k_ms).map((r) => ({ label: r.label, value: r.table10k_ms })), (v) => v + ' ms')}

<h3>JS heap after 45s of SSE updates (MB) — lower is better</h3>
${bar(sortBy(F, (r) => r.heap_after_soak_mb).map((r) => ({ label: r.label, value: r.heap_after_soak_mb })), (v) => v + ' MB')}

<h3>Production build time (s) — lower is better</h3>
${bar(sortBy(F, (r) => r.build_s).map((r) => ({ label: r.label, value: r.build_s })), (v) => v + ' s')}

<div class="card"><b>Frontend notes (honest reading):</b><ul>
<li>At 200 rows + 10 events/sec, <b>every framework is comfortably fast</b> — TTI spread is 33–99&nbsp;ms on localhost. Differences only matter at 10k rows.</li>
<li><b>Alpine.js collapses at 10k rows (8.2&nbsp;s)</b> — its DOM-scanning reactivity is wrong for large tables. htmx is fine here only because our harness renders the table with a plain innerHTML helper; idiomatic htmx would server-render fragments.</li>
<li><b>VanJS</b> looks great on size (2.6&nbsp;kB) but its naive full re-render pattern took 3.9&nbsp;s total on 10k rows with SSE churn.</li>
<li>Fastest 10k renders: vanilla/astro-script (~72&nbsp;ms), htmx-helper (86&nbsp;ms), Inferno (87&nbsp;ms), SolidJS (105&nbsp;ms). React-family re-render cost is visible (React 309&nbsp;ms, RR7 346&nbsp;ms) but still fine.</li>
<li>Meta-frameworks pay in build time and bundle (Next 230&nbsp;kB gzip, 8.4&nbsp;s builds; Ember 194&nbsp;kB) with zero benefit for this app class.</li>
<li>Heap: growth over the 45s soak was &lt;10&nbsp;MB everywhere; no leaks observed. Mithril/Next/Vue grew most (SSE-driven redraws); Solid/Lit/Qwik stayed flat.</li>
<li>These orderings agree directionally with js-framework-benchmark (krausest) — e.g. vanilla &lt; Solid/Inferno &lt; Svelte/Vue &lt; React &lt; Angular/Ember on row creation.</li>
</ul></div>

<h2>2. Backends — measured results (all 23 measured locally)</h2>
${beTable}

<h3>Requests/sec on 200-row JSON endpoint (oha, 5s, 64 conns) — higher is better</h3>
${bar(sortBy(M, (r) => r.rps, false).map((r) => ({ label: r.label, value: r.rps })), (v) => v.toLocaleString())}

<h3>RSS idle (MB) — lower is better</h3>
${bar(sortBy(M, (r) => r.rss_idle_mb).map((r) => ({ label: r.label, value: +r.rss_idle_mb.toFixed(1) })), (v) => v + ' MB')}

<h3>Cold start to first response (ms) — lower is better</h3>
${bar(sortBy(M, (r) => r.cold_start_ms).map((r) => ({ label: r.label, value: r.cold_start_ms })), (v) => v + ' ms')}

<h3>CPU % while holding 200 SSE connections at 10 ev/s — lower is better</h3>
${bar(sortBy(M, (r) => r.sse200_cpu_pct).map((r) => ({ label: r.label, value: r.sse200_cpu_pct })), (v) => v + ' %')}

<div class="card"><b>Backend notes (honest reading):</b><ul>
<li><b>Go and Rust are in a different league</b> (55–98k RPS, 1–10&nbsp;MB RSS, ~21&nbsp;ms cold start) — but a single-user console needs ~10 RPS. This headroom is free insurance, not a requirement.</li>
<li><b>Bun (Elysia/Hono) and Deno (Oak) measured ~2.2x Node throughput</b> on identical Hono code — real, but operationally younger runtimes.</li>
<li><b>FastAPI's 1.3k RPS is a serialization artifact</b>: default JSONResponse + jsonable_encoder on 200 dicts. With ORJSONResponse it typically lands near Flask/Django (~6k here). Python is fine for this app either way.</li>
<li><b>Sync WSGI (Flask/Django + gunicorn) has a hard SSE ceiling</b>: 4 workers × 8 threads = 32 concurrent streams; our 200-connection test saturated it. For SSE on Python use ASGI (uvicorn/daphne). This is the most decision-relevant backend finding.</li>
<li>Spring Boot works fine but costs 209&nbsp;MB idle / 385&nbsp;MB under load and 1.2&nbsp;s cold start — the wrong shape for a small Railway service.</li>
<li>Everything measured held 200 concurrent SSE connections at &lt;8% of one core — SSE at this scale is trivial for any async runtime.</li>
<li><b>Vert.x measured 70.8k RPS at 2.9&nbsp;ms p99</b> — top JVM performer as TechEmpower predicts — but the JVM ballooned to 777&nbsp;MB under load (no -Xmx cap set).</li>
<li><b>Phoenix measured 6k RPS (~ Flask/Django tier)</b> on JSON, holding 200 SSE connections easily — BEAM + LiveView remains architecturally ideal for live dashboards. Measured on Phoenix 1.6/Elixir 1.16/OTP 24 (apt Erlang); current Phoenix 1.7/OTP 27 should do somewhat better.</li>
<li><b>Laravel (638 RPS, p99 564&nbsp;ms) was measured on the PHP dev server</b> (artisan serve + 8 CLI workers, PHP 8.1) — a real production php-fpm or Octane deployment is significantly faster; treat this row as a lower bound. Its 200-SSE test also saturated the 8 worker slots (CPU ~0% because connections stalled).</li>
<li><b>Rails 7.1 measured 2.5k RPS</b> (puma 4x16, Ruby 3.0 without YJIT) at 361&nbsp;MB idle — workable but the heaviest footprint per unit of throughput measured.</li>
</ul></div>

<h2>3. Deep dive: Astro 5 as the chosen frontend</h2>
<h3>3a. Astro island combinations (all measured)</h3>
${avTable}
<h3>Bundle gzip by island choice (kB) — lower is better</h3>
${bar(sortBy(AV, (r) => r.bundle_gzip_kb).map((r) => ({ label: r.label, value: r.bundle_gzip_kb })), (v) => v + ' kB')}
<h3>10k-row render by island choice (ms) — lower is better</h3>
${bar(sortBy(AV, (r) => r.table10k_ms).map((r) => ({ label: r.label, value: r.table10k_ms })), (v) => v + ' ms')}
<div class="card"><b>Astro island notes:</b><ul>
<li>The plain-script variant is the floor: 0.9&nbsp;kB gzip, 73&nbsp;ms 10k render — Astro adds essentially zero runtime when you don't ship an island.</li>
<li><b>Solid island is the best framework island</b>: 8.9&nbsp;kB gzip, 110&nbsp;ms 10k render, flat heap — nearly plain-script performance with real reactivity.</li>
<li>Preact island (10.6&nbsp;kB, 158&nbsp;ms) is the best React-API option; the React island costs 46&nbsp;kB gzip and 239&nbsp;ms for identical code.</li>
<li>Vue island: 29.8&nbsp;kB, 165&nbsp;ms but the largest SSE-soak heap (10&nbsp;MB); Svelte island: 14.7&nbsp;kB but slowest 10k render of the islands (332&nbsp;ms — keyed each-block overhead).</li>
<li>All variants use <code>client:only</code> (pure CSR island), matching the SPA console use case.</li>
</ul></div>

<h3>3b. Astro × all 23 backends, end-to-end (measured via static-serve + /api proxy)</h3>
<p class="dim">Each backend ran behind an identical Node static+proxy shim serving the Astro build; the browser measured real fetch/POST/SSE behavior. The shim adds a constant ~0.5-1&nbsp;ms to every row — fair for comparison, slightly pessimistic in absolute terms.</p>
${pairTable}
<h3>POST action round-trip through the Astro console (ms) — lower is better</h3>
${bar(sortBy(PAIR, (r) => r.post_rtt_ms).map((r) => ({ label: r.label, value: r.post_rtt_ms })), (v) => v + ' ms')}
<div class="card"><b>Pairing notes (honest reading):</b><ul>
<li><b>At single-user scale the backend choice barely matters for feel</b>: TTI is 23–47&nbsp;ms and POST RTT 1.8–3.3&nbsp;ms for almost every pairing. Choose on operational grounds (RAM, cold start, image size, team skills) from section 2.</li>
<li>Exceptions visible even at 1 user: <b>FastAPI</b> (44–48&nbsp;ms rows/POST — default-serializer overhead), <b>Laravel dev-server</b> (7.8–11.9&nbsp;ms), and <b>Rails SSE jitter of ±142&nbsp;ms</b> around the 100&nbsp;ms tick (puma thread scheduling + sleep-loop streaming) — the live feed visibly stutters on Rails.</li>
<li>SSE 'first event' spread (1–104&nbsp;ms) is mostly phase: some backends emit an event immediately on connect, others wait one 100&nbsp;ms tick. Not a quality signal.</li>
<li>Every backend held a stable 10&nbsp;Hz SSE stream with ≤2&nbsp;ms jitter except Rails (±142&nbsp;ms) and the two flagged above.</li>
<li>Best-fit pairings for an Astro console on Railway: <b>Astro + Go/Echo</b> (cheapest, instant), <b>Astro + Fastify</b> (TS-first), <b>Astro + Phoenix</b> (if the feed becomes many-user push-heavy).</li>
</ul></div>

<h3>3c. Library layer: charts &amp; tables on Astro+Preact (all measured)</h3>
${chartLibTable}
<div class="card"><b>Chart library notes:</b><ul>
<li><b>uPlot wins outright</b>: 33.4&nbsp;kB page (22.8&nbsp;kB of it uPlot), 0.013&nbsp;ms per 10&nbsp;Hz SSE update — ~80x cheaper than Chart.js, built exactly for streaming time-series.</li>
<li>Chart.js (56&nbsp;kB, 1.09&nbsp;ms/update) and Observable Plot (100&nbsp;kB, 0.76&nbsp;ms/update, full SVG re-plot of ≤300 pts) are both fine at 10&nbsp;Hz; Plot's re-plot cost grows with point count.</li>
<li>ECharts costs 353&nbsp;kB gzip — 10x uPlot — only worth it if you need its exotic chart types.</li>
<li><b>Round 2 (all 9 chart libs measured):</b> Lightweight Charts (62&nbsp;kB, 0.089&nbsp;ms/update) and raw D3 (28&nbsp;kB, 0.089&nbsp;ms/update) are the only libs near uPlot; ApexCharts (166&nbsp;kB, 4.2&nbsp;ms/update, p99 7.1&nbsp;ms) and Plotly (1.4&nbsp;MB gzip, 643&nbsp;ms TTI, 4.4&nbsp;ms/update) are the worst streaming choices; Recharts (120&nbsp;kB, 2.9&nbsp;ms/update incl. React render) ran fine on preact/compat but costs 200x uPlot per frame.</li>
</ul>
<b>Table libraries (measured, 10k rows):</b>
${tableLibTable}
<ul>
<li>preact/compat ran TanStack Table + Virtual without issues (compat concern resolved empirically).</li>
<li><b>TanStack wins</b>: 106&nbsp;ms initial 10k render / 17.6&nbsp;ms sort at 33.6&nbsp;kB — AG Grid Community matches functionality with far more built-in UI, but costs 256&nbsp;kB gzip (7.6x) and ~26&nbsp;ms slower initial render. Pick AG Grid only if you want its full feature set (filtering UI, column menus) without building it.</li>
</ul>
<b>State management (measured, 200-row table updated from 10&nbsp;Hz SSE):</b>
${stateTable}
<ul>
<li><b>They are all equivalent at this scale</b> (0.72–0.82&nbsp;ms per event, within noise) — the cost is Preact's re-render of 200 rows, not the store. Choose on ergonomics: <b>@preact/signals</b> is the idiomatic Preact choice (fine-grained updates matter at bigger scale), <b>nanostores</b> is the Astro-idiomatic choice (shares state across islands, +0.4&nbsp;kB), Zustand/Jotai work via compat but add 5–7&nbsp;kB for no measured benefit here.</li>
</ul></div>

<h3>3d. Real Postgres: Go Echo driver comparison (measured)</h3>
<p class="dim">${PG ? esc(PG.setup) : ''}</p>
${pgTable}
<div class="card"><b>Postgres notes:</b> ${PG ? esc(PG.notes) : ''}</div>

<h3>3e. Go backend libraries on Echo (all measured)</h3>
<p class="dim">${GL ? esc(GL.setup) : ''}</p>
${glTables}
<div class="card"><b>Backend library notes:</b><ul>
<li><b>JSON encoder</b>: sonic is 1.55x stdlib (101.7k vs 65.6k RPS) and go-json 1.14x — but on the real-DB path the query dominates, so stdlib is fine; swap in sonic only for large hot JSON endpoints.</li>
<li><b>DB layer</b>: pgx pool 15.4k RPS &gt; sqlx+lib/pq 9.3k &gt; GORM 8.2k on the identical query — GORM costs ~47% of pgx's throughput for ORM convenience. Explicit prepared statements add nothing (pgxpool already auto-caches). sqlc generates code over pgx, so it performs like raw pgx with type-safety — the recommended sweet spot.</li>
<li><b>Middleware</b>: logger+recover are near-free; per-request <b>gzip</b> drops the 200-row endpoint from 65.6k to 24.2k RPS — enable gzip only for large payloads or let a CDN/proxy do it.</li>
<li><b>Validation</b>: go-playground/validator on the POST path still ran at 258k RPS — negligible; always validate.</li>
</ul></div>

<h3>3f. Realtime transport: SSE vs WebSocket vs Postgres LISTEN/NOTIFY (measured)</h3>
${rtTable}
<div class="card"><b>Transport notes:</b><ul>
<li>At 200 concurrent connections × 10&nbsp;ev/s, <b>both SSE and WebSocket deliver in &lt;1&nbsp;ms p99</b>. WebSocket used less CPU (1.7% vs 6.8%) because SSE writes text-framed HTTP chunks; both are trivial for one user.</li>
<li><b>Postgres LISTEN/NOTIFY → SSE adds ~1&nbsp;ms</b> end-to-end (avg 1.1&nbsp;ms, p99 2&nbsp;ms) — a clean way to push DB changes to the console without polling. Caveat: this naive impl holds one Postgres connection per SSE client; production should hold ONE LISTEN connection and fan out in-process.</li>
<li><b>SSE auto-reconnect (measured)</b>: killed the server mid-stream for ${RC ? (RC.server_down_ms / 1000).toFixed(1) : '-'}&nbsp;s — EventSource reconnected by itself and events resumed ${RC ? (RC.resume_after_restart_ms / 1000).toFixed(1) : '-'}&nbsp;s after restart (total gap ${RC ? (RC.gap_ms / 1000).toFixed(1) : '-'}&nbsp;s, ${RC ? RC.reconnect_error_events : '-'} retry attempts), with zero client code. This built-in resilience is SSE's main advantage over WebSocket (which needs manual reconnect logic).</li>
</ul></div>

<h3>3g. Brotli vs gzip static serving (measured)</h3>
${cmpTable}
<div class="card">Brotli -q11 saves ~9–10% over gzip -9 on these bundles — worth precompressing at build time (near-zero effort with a Vite/Astro plugin), irrelevant to feel on a fast connection at these sizes (&lt;35&nbsp;kB pages).</div>

<h3>3h. Real Docker images — all 23 backends built &amp; measured</h3>
${imgMeasuredTable}
<div class="card"><b>Image notes:</b> Go scratch images are <b>5.5–13.8&nbsp;MB</b> — 10–20x smaller than everything except Phoenix's mix release (28&nbsp;MB). Rust's 73–78&nbsp;MB is the debian-slim runtime base, not the binary (~5&nbsp;MB) — a musl/distroless build lands near Go. Node/Bun/Deno/Python cluster at 99–154&nbsp;MB, JVM at ~290–300&nbsp;MB, Rails at 531&nbsp;MB. Sizes are uncompressed; registry pulls are typically 2–3x smaller. The earlier estimates were directionally right but understated interpreter images.</div>

<h2>4. Measurement noise &amp; method caveats</h2>
<div class="card"><ul>${R.environment.caveats.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
<p class="dim">Env: ${esc(R.environment.machine)} · node ${R.environment.node}, bun ${R.environment.bun}, deno ${R.environment.deno}, go ${R.environment.go}, ${esc(R.environment.rust)}, python ${R.environment.python}, java ${R.environment.java}, dotnet ${R.environment.dotnet} · ${esc(R.environment.load_tool)} · ${esc(R.environment.browser)}</p></div>

<h2>5. Recommendations in full</h2>
<div class="card win">
<b>(a) Single-user internal CEO console (ship this):</b>
<ul><li><b>Frontend: React 18 + Vite SPA</b> (or Svelte 5 if you value the 3x smaller bundle over ecosystem). Static build served by the backend — no meta-framework.</li>
<li><b>Backend: Node 20 + Fastify</b> (12.9k RPS, first-class TS, SSE trivial, biggest talent/AI pool) serving both API and the static frontend from one Railway service + Railway Postgres.</li>
<li>Total measured footprint: ~58&nbsp;MB RSS, 107&nbsp;ms cold start, 46&nbsp;kB gzip frontend, TTI &lt;50&nbsp;ms.</li></ul>
<b>(b) Growth path to multi-view live dashboard:</b>
<ul><li>Same stack scales: add react-router (client-side), TanStack Table/Query + a virtualized table for &gt;5k rows (our 10k unvirtualized render was 309&nbsp;ms — virtualize before it matters).</li><li>Performance-ceiling alternative: <b>SolidJS</b> (best measured update performance + flat heap), at ecosystem/hiring cost.</li><li>If the dashboard becomes many-user and push-heavy, <b>Elixir Phoenix LiveView</b> is the architectural best-fit (literature, not measured).</li></ul>
<b>(c) API/control-plane backend on Railway:</b>
<ul><li><b>Go + Echo or stdlib net/http</b>: 97k RPS, 6–7&nbsp;MB RSS, 21&nbsp;ms cold start, ~12&nbsp;MB scratch image, decades-stable stdlib. Cheapest possible Railway bill.</li><li>TypeScript-first team: <b>Fastify</b>; performance-hungry TS: <b>Bun + Elysia</b> (29k RPS measured) accepting runtime youth.</li><li>Avoid for this shape: Spring Boot (RAM/cold start), sync WSGI Python if SSE matters, Rails/Laravel (SSE awkward in default deployment).</li></ul>
</div>
<p class="dim">Raw data: results.json in the same bundle. Benchmark harness: stack-bench repo zip (mock API + 21 frontend + 18 backend implementations + measurement scripts).</p>
</body></html>`;
fs.writeFileSync(OUT, html);
console.log('wrote report.html', (html.length / 1024).toFixed(0) + 'kB');
