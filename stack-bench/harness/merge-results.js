// Merge all measurement artifacts + qualitative + literature into results.json
const fs = require('fs');
const R = __dirname + '/../results/';
const read = (f, d) => (fs.existsSync(R + f) ? JSON.parse(fs.readFileSync(R + f, 'utf8')) : d);
const readLines = (f) => (fs.existsSync(R + f) ? fs.readFileSync(R + f, 'utf8').trim().split('\n').map(JSON.parse) : []);

const qual = JSON.parse(fs.readFileSync(__dirname + '/qualitative.json', 'utf8'));
const fe = read('frontend-metrics.json', {});
const mem = read('frontend-mem.json', {});
const sizes = Object.fromEntries(readLines('bundle-sizes.jsonl').map((x) => [x.name, x]));
const builds = Object.fromEntries(readLines('build-times.jsonl').map((x) => [x.name, x]));
const be = read('backend-metrics.json', {});
const imgs = read('image-sizes.json', {});
const pairings = read('pairing-metrics.json', {});
const libs = read('lib-metrics.json', {});
const LIB_LABELS = {
  'chart-chartjs': 'Chart.js 4 (canvas)', 'chart-uplot': 'uPlot 1.6 (canvas)', 'chart-echarts': 'ECharts 5 (canvas)', 'chart-plot': 'Observable Plot 0.6 (SVG, full re-plot)',
  'chart-apex': 'ApexCharts 4 (SVG)', 'chart-lwc': 'Lightweight Charts 4 (canvas)', 'chart-d3': 'D3 7 raw (SVG path)', 'chart-plotly': 'Plotly.js 2 (WebGL/SVG)', 'chart-recharts': 'Recharts 2 (React, preact/compat)',
  'table-tanstack': 'TanStack Table 8 + Virtual 3 (preact/compat)', 'table-aggrid': 'AG Grid Community 33',
  'state-hooks': 'Preact hooks (useState) baseline', 'state-signals': '@preact/signals 2', 'state-zustand': 'Zustand 5 (preact/compat)', 'state-jotai': 'Jotai 2 (preact/compat)', 'state-nanostores': 'nanostores + @nanostores/preact',
};
const lib_benchmarks = {};
for (const [name, m] of Object.entries(libs)) {
  lib_benchmarks[name] = { label: LIB_LABELS[name] || name, bundle_gzip_kb: sizes[name] ? +(sizes[name].gzip_bytes / 1024).toFixed(1) : null, ...m };
}
const pg = read('pg-metrics.json', null);
const golibs = read('golibs-metrics.json', null);
const realtime = read('realtime-metrics.json', null);
const reconnect = read('reconnect-metrics.json', null);
const compression = read('compression-metrics.json', null);
const imgsMeasured = read('image-sizes-measured.json', {});
const astroBuilds = Object.fromEntries(readLines('astro-build-times.jsonl').map((x) => [x.name, x]));

const frontends = {};
for (const [name, q] of Object.entries(qual.frontends)) {
  frontends[name] = {
    ...q,
    measured: !!(fe[name] && fe[name].measured),
    bundle_gzip_kb: sizes[name] ? +(sizes[name].gzip_bytes / 1024).toFixed(1) : null,
    bundle_raw_kb: sizes[name] ? +(sizes[name].raw_bytes / 1024).toFixed(1) : null,
    build_s: builds[name] ? +(+builds[name].build_s).toFixed(1) : null,
    load_ms: fe[name] ? fe[name].load_ms : null,
    tti_ms: fe[name] ? fe[name].tti_ms : null,
    table10k_ms: fe[name] && fe[name].table10k_ms ? +fe[name].table10k_ms.toFixed(0) : null,
    heap_after_soak_mb: mem[name] ? mem[name].heap_after_soak_mb : null,
    heap_initial_mb: mem[name] ? mem[name].heap_initial_mb : null,
  };
}

const backends = {};
for (const [name, q] of Object.entries(qual.backends)) {
  const m = be[name];
  const lit = qual.literature_backends[name];
  backends[name] = {
    ...q,
    measured: !!(m && m.measured),
    ...(m && m.measured ? m : {}),
    ...(lit ? { literature: lit } : {}),
    image_mb_est: imgs[name] || null,
    image_mb_measured: typeof imgsMeasured[name] === 'number' ? imgsMeasured[name] : null,
  };
}

const ASTRO_VARIANTS = ['astro', 'astro-react', 'astro-preact', 'astro-vue', 'astro-svelte', 'astro-solid'];
const astro_variants = {};
for (const name of ASTRO_VARIANTS) {
  const b = builds[name] || astroBuilds[name];
  astro_variants[name] = {
    label: name === 'astro' ? 'Astro 5 + plain script (no island)' : 'Astro 5 + ' + name.replace('astro-', '') + ' island (client:only)',
    measured: !!(fe[name] && fe[name].measured),
    bundle_gzip_kb: sizes[name] ? +(sizes[name].gzip_bytes / 1024).toFixed(1) : null,
    build_s: b ? +(+b.build_s).toFixed(1) : null,
    load_ms: fe[name] ? fe[name].load_ms : null,
    tti_ms: fe[name] ? fe[name].tti_ms : null,
    table10k_ms: fe[name] && fe[name].table10k_ms ? +fe[name].table10k_ms.toFixed(0) : null,
    heap_after_soak_mb: mem[name] ? mem[name].heap_after_soak_mb : null,
  };
}

const out = {
  generated_at: new Date().toISOString(),
  environment: {
    machine: '8 vCPU, 31GB RAM, Linux 5.15 (Devin VM)',
    node: 'v20.18.1', bun: '1.3.14', deno: '2.9.3', go: '1.23.4', rust: 'stable 2026-06', python: '3.10.12', java: '17 (temurin)', dotnet: '8.0.423',
    load_tool: 'oha 1.15 (5s, 64 conns, /api/rows 200-row JSON)',
    browser: 'Playwright Chromium, cold contexts, median of 3',
    caveats: [
      'Localhost benchmarks on a shared VM: numbers have run-to-run noise (~5-15%); treat orderings of nearby bars as ties.',
      'SSE memory soak was 45s (not 5min) per frontend to fit the time budget; all frames arrive at 10/s so heap growth is near-linear to observe leaks. Labeled as such.',
      'FastAPI measured with default JSONResponse (jsonable_encoder dominates); ORJSONResponse typically gives 5-10x more RPS on this payload.',
      'Flask/Django ran gunicorn 4 workers x 8 threads: 200 concurrent SSE connections exceed the 32-slot sync capacity - most connections stalled. This is a real deployment constraint of sync WSGI, not a measurement artifact.',
      'Docker image sizes: all 23 backends now have REAL built images (docker build, uncompressed size); the earlier estimated column is retained for comparison. Rust images use debian-slim runtime (~65MB base) - musl/distroless would land near the Go numbers. Registry-compressed sizes are typically 2-3x smaller.',
      'Chart update cost = synchronous JS time per SSE event with 300 retained points; Recharts/state-management costs measured through requestAnimationFrame (includes render commit).',
      'Realtime transport test: 200 concurrent SSE/WebSocket conns at 10 ev/s each; LISTEN/NOTIFY test used 50 conns (one Postgres conn per LISTEN in this naive impl - production should fan out from a single LISTEN connection).',
      'All 23 backends measured locally. Version caveats: Phoenix 1.6 on Elixir 1.16/OTP 24 (apt Erlang); Laravel 10 on PHP 8.1 via artisan serve + PHP_CLI_SERVER_WORKERS=8 (dev server - production php-fpm/Octane is faster); Rails 7.1 on Ruby 3.0 (system ruby, no YJIT - YJIT typically +15-30%).',
      'Frontend numbers for 21 frameworks are all locally measured; js-framework-benchmark (krausest) agrees directionally with our 10k-row ordering.'
    ],
  },
  workload: {
    sse: 'GET /api/events - SSE stream, 10 events/sec',
    list: 'GET /api/rows - 200-row JSON (7 columns)',
    action: 'POST /api/action - JSON echo',
    frontend: 'live feed (last 20 events) + sortable 200-row table updated from SSE; 10k-row variant via ?n=10000',
  },
  frontends, backends, astro_variants, astro_backend_pairings: pairings, lib_benchmarks, postgres_driver_bench: pg,
  go_backend_libs: golibs, realtime_transports: realtime, sse_reconnect: reconnect, compression, docker_images_measured: imgsMeasured,
};
fs.writeFileSync(R + 'results.json', JSON.stringify(out, null, 2));
console.log('wrote results.json');
