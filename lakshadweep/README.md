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

- `js/data/` — source of truth: trip dates and places, researched prices with source links, itinerary day blocks, photo credits.
- `js/strategies.js` — the five route variants; each lists its day blocks and transport legs (Strategy pattern).
- `js/plan.js` — builds the dated plan for the selected strategy (Facade).
- `js/budget.js` — pure budget arithmetic, bucketed into transport / stay / food / local / extras.
- `js/store.js` — observable localStorage-backed state (Observer pattern).
- `js/icons.js` — one SVG sprite, referenced by id (Flyweight).
- `js/render/` — one renderer per section: hero, route map + strategy cards, day cards, ledger, checklist, sources.
- `js/chrome/` — theme, clock, progress, rail, shortcuts.
- `img/` — Wikimedia Commons photographs (CC BY / BY-SA), credited in the Sources section.

Prices are estimates observed Aug–Sep 2026 from the linked sources, not live fares.
