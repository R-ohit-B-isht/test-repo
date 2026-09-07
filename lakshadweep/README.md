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

- `js/data/` — source of truth: trip dates, geo coordinates, dated prices with status + source links, day blocks per route, named stays and eats, the picks catalogue (islands, landmarks, experiences), photo credits.
- `js/strategies.js` — the five route variants; each lists its day blocks and transport legs (Strategy pattern).
- `js/fares.js` — resolves ship / train class and lodging fares from state.
- `js/plan.js` — builds the dated plan for the selected strategy (Facade); marks fares read for a different date as `nearby`.
- `js/grouping.js` — route-aware placement of selected picks: reachable base per day, max four per day, unreachable picks kept visible with a reason.
- `js/budget.js` — pure budget arithmetic, bucketed into transport / stay / food / local / picks.
- `js/store.js` — observable localStorage-backed state (Observer pattern).
- `js/icons.js` — one SVG sprite, referenced by id (Flyweight).
- `js/render/` — one renderer per section: hero, route map (+ day pills, pick icons, off-route ghosts), strategy cards, picks, day cards, ledger, checklist, sources.
- `js/chrome/` — theme, clock, progress, rail, shortcuts.
- `img/` — Wikimedia Commons photographs (CC BY / BY-SA), credited in the Sources section.

Fare statuses: `seen` (read for that exact date), `nearby` (read for another date), `tariff` (official rate, sailing date TBC), `estimate`, `unavailable`. Observed Aug–Sep 2026 from the linked sources, not live fares.
