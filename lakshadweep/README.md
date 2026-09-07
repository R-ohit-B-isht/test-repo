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

Gemini planner (section 02): paste your own key via **Key** — it lives only in this browser's `localStorage` (`lakshadweep-ledger:gemini-key`), never in the repo or the deploy. Get one at https://aistudio.google.com/apikey.

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
- `js/render/` — one renderer per section: hero, route map (+ day pills, pick icons, off-route ghosts), strategy cards, picks, day cards (`itinerary.js` + `dayMedia.js`), ledger, checklist, sources, photo gallery (`gallery.js`, `<dialog>`), day sheet (`daySheet.js` + `daySheetModel.js`, `<dialog>`).
- Day sheet: tap a day card header or a map D-pill to open a popup grid for that day — Travel (route legs with fare/status), See & do (picks + fixed bits), Eat (B/L/D from `EATS`), Stay (`STAYS`). Tiles use the exact item photos where they exist and an icon otherwise; photo tiles open the gallery on top. `←`/`→` step days, `Esc` closes, focus returns to the opener; it re-renders on any store change so toggles stay in sync.
- `js/ai/` — Gemini layer: `key.js` (browser key adapter), `gemini.js` (REST client, structured JSON output, typed errors), `context.js` (prompt from state + budget + plan + reachability), `schema.js` (allow-listed ops + response schema), `validate.js` (rejects unknown ids/ops, out-of-range numbers, duplicates, no-ops), `apply.js` (patch → `store.set`, preview delta, undo closure), `planner.js` (facade). UI in `render/planner.js` + `plannerView.js`: tick suggestions, Apply reprices the ledger, Undo restores.
- `js/chrome/` — theme, clock, progress, rail, shortcuts.
- `img/` — photographs of the exact islands, landmarks and activities (Wikimedia Commons CC BY / BY-SA, one NASA public-domain image), several per item, mapped in `js/data/photos.js` (`ITEM_PHOTOS`; records split into `photos/trip.js` and `photos/items.js`) and credited in the Sources section. Items with no genuine photo show "No exact photo found" rather than a stand-in.

Fare statuses: `seen` (read for that exact date), `nearby` (read for another date), `tariff` (official rate, sailing date TBC), `estimate`, `unavailable`. Observed Aug–Sep 2026 from the linked sources, not live fares.
