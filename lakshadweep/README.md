# Lakshadweep Ledger

Static site: a ten-day Lakshadweep itinerary from Delhi with a recalculating
per-person budget. No build step, no dependencies.

## Run

```sh
cd lakshadweep
python3 -m http.server 8765
# open http://localhost:8765/
```

Developer mode: `?dev=1`, `localStorage.IS_DEV = 'true'`, or press `D`.

## Check

```sh
for f in $(find js -name '*.js'); do node --check "$f"; done
```

## Layout

- `js/data/` — source of truth: trip dates, researched prices with source links, itinerary days.
- `js/strategies.js` — route variants (Strategy pattern).
- `js/store.js` — observable localStorage-backed state (Observer pattern).
- `js/budget.js` — pure budget arithmetic.
- `js/render/` — one renderer per section.
- `js/chrome/` — theme, clock, progress, rail, shortcuts.

Prices are estimates observed Aug–Sep 2026 from the linked sources, not live fares.
