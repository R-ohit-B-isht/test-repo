# stack-bench — CEO Console stack benchmark harness

Benchmark rig (NOT a product) comparing 21 frontends and 23 backends against one
reference workload for a real-time single-user "CEO console":

- `GET /api/events` — SSE stream, 10 events/sec
- `GET /api/rows` — 200-row JSON list
- `POST /api/action` — JSON action endpoint
- Frontend: live feed (last 20 events) + sortable 200-row table updated from SSE;
  `?n=10000` variant for the 10k-row render test.

## Layout
- `harness/mock-api.js` — shared mock API + static server for all frontends (benchmark only)
- `harness/gen-frontends.js`, `gen-meta-frontends.js`, `gen-backends.js` — generators for equivalent minimal implementations
- `frontends/<name>/` — 21 frontend implementations (Vite/CLI-scaffolded)
- `backends/<name>/` — 18 runnable backend implementations
- `harness/measure-frontends.js` — Playwright: cold load, TTI, 10k render, SSE soak
- `harness/mem-frontends.js` — CDP JS-heap after SSE soak
- `harness/measure-backends.js` + `backend-defs.json` — cold start, oha RPS, RSS, 200-conn SSE CPU
- `harness/smoke-backends.sh` — endpoint smoke test
- `harness/merge-results.js`, `gen-report.js` — results.json + report.html
- `results/` — raw metrics, `results.json`, `report.html`

## Run
```
node harness/mock-api.js &                # port 4000
bash harness/build-frontends.sh <names>   # or npm run build per frontend
node harness/measure-frontends.js <names>
node harness/measure-backends.js <names>
node harness/merge-results.js && node harness/gen-report.js
```

Phoenix / Laravel / Rails / Vert.x / Fresh rows in the report are literature-derived
(TechEmpower Round 22, framework docs) — marked as such.
