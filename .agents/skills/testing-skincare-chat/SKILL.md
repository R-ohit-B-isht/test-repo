---
name: testing-skincare-chat
description: How to run and end-to-end test the skincare-routines React app together with its Gemini chat-api (FastAPI) backend, including the "Ask the Ledger" drawer, dev-mode traces, and pitfalls seen during QA.
---

# Testing the skincare-routines app + Gemini chat-api

## Services (two processes, both required for the assistant)
- Backend (real Gemini; needs secrets file, never print the key):
  ```bash
  cd skincare-routines/chat-api
  set -a && . /home/ubuntu/.secrets/gemini.env && set +a
  IS_DEV=1 PYTHONPATH=. .venv/bin/uvicorn chat_api.main:app --host 127.0.0.1 --port 8787
  ```
  Health: `curl -s 127.0.0.1:8787/api/health` (reports listing count + model).
- Frontend: `cd skincare-routines && npm run dev -- --host 127.0.0.1 --port 5173` (Vite proxies `/api` → 8787).
- App uses HashRouter: `http://127.0.0.1:5173/#/c/facewash`. Dev mode is a query param BEFORE the hash: `http://127.0.0.1:5173/?dev=1#/c/facewash`.

## Pitfall: stale pre-running backend
If a uvicorn process was started from an older checkout, its SSE error payload may lack fields the current frontend expects (e.g. `tools`, `unverified`) and the drawer can crash to a blank page. Before testing chat flows, `pkill -f "uvicorn chat_api"` and restart from the current tree. Check `ps -o lstart -p $(pgrep -f 'uvicorn chat_api')` vs the last commit time.

## Useful selectors / hooks
- Trigger: `button[title="Ask the Ledger (?)"]`; `?` key toggles when focus is not in an input.
- Drawer: `[role=dialog][aria-label="Ask the Ledger"]`; composer `textarea[aria-label="Ask the assistant"]`; Stop `button[aria-label="Stop generating"]`; New chat `button[aria-label="New chat"]`; Retry button text "Try again".
- Lists: `[aria-label="Suggested questions"]`, `[aria-label="Follow-up questions"]`.
- Citation deep-link format: `#/c/<category>?open=<listing-id>` opens the product sheet and closes the drawer.
- Scroll lock check: `document.body.style.overflow === 'hidden'` while open.

## Real-Gemini answers
Allow 10–30 s per answer. Known-good prompts: "Where does Cetaphil Gentle Skin Cleanser rank and where does its INCI come from?" on /c/facewash → #1 of 1,940, INCI from cetaphil.in. For a no-match test pick a brand NOT in the dataset (e.g. Tatcha); "Some By Mi Miracle Serum" IS in the dataset (Snail True Cica Miracle Repair Serum, #24/224).

## Security check without devtools UI
Wrap `window.fetch` in the console to log `/api/chat` request headers/body, then send a message via the UI; confirm no `AIza`/`x-goog-api-key`. `/chat-config.json` should be exactly `{"apiBase": ""}`.

## Visual QA tips
- Chrome device-mode (Ctrl+Shift+M) works for 375/768/1440/1920; when it is on, screenshot coordinates map to the emulated frame only — physical clicks aimed using downscaled screenshots land on the DevTools pane. Prefer the `?` shortcut or JS `.click()` for opening while emulated, and verify with `aria-expanded`.
- Reduced motion: Ctrl+Shift+P → "Emulate CSS prefers-reduced-motion: reduce"; verify `matchMedia('(prefers-reduced-motion: reduce)').matches`.
- Overflow assertion: `document.documentElement.scrollWidth === clientWidth` with drawer open; composer pinned: dialog `lastElementChild` bottom === dialog bottom.

## Devin Secrets Needed
- `GEMINI_API_KEY` (loaded from `/home/ubuntu/.secrets/gemini.env`; never echo it).
