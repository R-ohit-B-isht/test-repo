---
name: testing-skincare-chat
description: How to run and end-to-end test the skincare-routines React app's "Ask the Ledger" Gemini chat in both transports — server mode (FastAPI chat-api) and browser mode (@google/genai in the page, no backend) — including dev-mode traces, no-key error path, network proof, and pitfalls seen during QA.
---

# Testing the skincare-routines app + Gemini chat-api

## Services (two processes, both required for the assistant)
- Backend (real Gemini; needs secrets file, never print the key):
  ```bash
  cd skincare-routines/chat-api
  set -a && . /home/ubuntu/.secrets/gemini.env && set +a
  poetry install --with dev   # first time; the venv must live OUTSIDE chat-api (see below)
  IS_DEV=1 poetry run uvicorn chat_api.main:app --host 127.0.0.1 --port 8787
  ```
  Keep the virtualenv outside the project dir (`poetry config virtualenvs.in-project false`, or `~/.venvs/chat-api`): the backend deployer uploads the whole `chat-api/` folder and a 90 MB `.venv` inside it makes the deploy fail with a generic error. Tests: `PYTHONPATH=. poetry run pytest -q`.
  Deploy layout: the platform needs Poetry `pyproject.toml` + `poetry.lock` and a FastAPI `app` in `app/main.py` (a thin wrapper over `chat_api.main.create_app`). Runtime config comes from a git-ignored `chat-api/.env` (GEMINI_API_KEY, LEDGER_DATA=<site>/data, LEDGER_SITE_URL, ALLOWED_ORIGINS) that `Settings.from_env` reads when real env vars are absent.
  Health: `curl -s 127.0.0.1:8787/api/health` (reports listing count + model).
- Frontend: `cd skincare-routines && npm run dev -- --host 127.0.0.1 --port 5173` (Vite proxies `/api` → 8787).
- App uses HashRouter: `http://127.0.0.1:5173/#/c/facewash`. Dev mode is a query param BEFORE the hash: `http://127.0.0.1:5173/?dev=1#/c/facewash`.

## Browser mode (no backend) — `src/chat/transport.ts` picks `server` or `browser` from `/chat-config.json`
- Committed `public/chat-config.json` is server mode with an empty key. For local dev, a git-ignored `.env.local` with `VITE_GEMINI_API_KEY=…` makes `src/chat/config.ts` (`devOverride`, DEV builds only) force browser mode. Create it without echoing the key:
  `printf 'VITE_GEMINI_API_KEY=%s\n' "$(grep -oP '(?<=GEMINI_API_KEY=).*' /home/ubuntu/.secrets/gemini.env)" > skincare-routines/.env.local`
- To PROVE browser mode, stop uvicorn first: `pkill -f "[u]vicorn chat_api"` (the bracket trick stops pkill matching your own shell → exit -1) and confirm `curl 127.0.0.1:8787/api/health` fails. Any `/api/chat` request afterwards is a failure signal (Vite proxy 500s).
- Restart Vite after changing `.env.local` or `public/chat-config.json` (env is read at startup). `npm run dev` runs `npm run data` first (~1 min); if `public/data` already exists, `npx vite --host 127.0.0.1 --port 5173` skips it. Run Vite in its own `shell_id`; a `pkill` in the same one-shot shell can kill your freshly started server.
- Network proof: `performance.getEntriesByType('resource')` — expect `generativelanguage.googleapis.com` POSTs + `/data/manifest.json`, `/data/<cat>.json`, `/data/<cat>.dN.json`, `/data/search.json.gz`, and zero `/api/*`. `fonts.googleapis.com` is the Google Fonts stylesheet, not Gemini. The key IS in the Google request in this mode by design — report presence only, never the value.
- Browser tool names seen in `?dev=1` traces: `search_products`, `get_product`, `get_top_products`, `get_category_filters`, `get_reference_ceiling`, `compare_products`, `get_site_overview`, `list_categories`, `get_scoring_method`, `get_routines`.
- No-key path: `printf '{"mode":"browser"}\n' > public/chat-config.json` + `mv .env.local .env.local.bak`, restart Vite, send → expect the error "The assistant is not configured for this deployment: chat-config.json selects browser mode but carries no Gemini key." with Try again. Restore with `git checkout -- skincare-routines/public/chat-config.json && mv .env.local.bak .env.local` and restart Vite; verify with `git status --short`.
- Browser streams are fast (a whole answer in ~10–15 s); to click Stop mid-stream reliably, poll from the console for `button[aria-label="Stop generating"]` and `.click()` it once partial text exceeds a few hundred chars. Expected (≥ 1594024): partial text kept, phase `done`, alert row "Stopped — this answer is incomplete." with NO "Try again" button; "Stopped." only when no text arrived.
- Nested citation pills (≥ 1594024): `**Name [[id]]**` and link text are parsed recursively into pills. Gemini rarely nests markers in bold on its own — to exercise the path ask e.g. "Format each line exactly as: **<product name> [[listing-id]]** — rank …, keep the [[listing-id]] inside the bold", then check `dialog.querySelectorAll('strong a').length` and that the only `[[` text is in your own user bubble.
- Ingredient knowledge (≥ d99f619): `public/data/knowledge.json` (loaded lazily on first knowledge question; look for `/data/knowledge.json` in resource entries) backs tool `get_ingredient_knowledge`; trace label "Checking the sourced notes on …". Starter chip kicker "Ingredients" ("Can I use retinol and BHA together?" on skin pages, hair-oil question on hair pages). Expected: `[[cat:<slug>]]` in prose → inline category pills (`p a[href^="#/c/"]`), category chips with counts, and a "Sources read by the tools" list whose `<span class="label">` reads `study`. Check raw markers with `/\[\[[^\]]*\]\]/` over `dialog.textContent` — but also scan `[aria-label="Follow-up questions"] button` text separately: Gemini sometimes puts `[[cat:…]]` in a generated follow-up question, and follow-up chips are not marker-parsed. When checking for an "unverified" pill, match leaf elements whose text === 'unverified' — the dev trace contains "unverified cites none" and will false-positive a textContent search.
- Typing into the composer under device emulation: a physical click may land outside the textarea (selection ends up on page text). Focus via console (`textarea.focus(); setSelectionRange(0, value.length)`) then use the keyboard `type` action; verify `textarea.value` before pressing Enter.

## Pitfall: stale pre-running backend
If a uvicorn process was started from an older checkout, its SSE error payload may lack fields the current frontend expects (e.g. `tools`, `unverified`) and the drawer can crash to a blank page. Before testing chat flows, `pkill -f "uvicorn chat_api"` and restart from the current tree. Check `ps -o lstart -p $(pgrep -f 'uvicorn chat_api')` vs the last commit time.

## Useful selectors / hooks
- Trigger: `button[title="Ask the Ledger (?)"]`; `?` key toggles when focus is not in an input. With xdotool, send `shift+slash` — the `question` keysym may not fire the handler.
- Drawer: `[role=dialog][aria-label="Ask the Ledger"]`; composer `textarea[aria-label="Ask the assistant"]`; Stop `button[aria-label="Stop generating"]`; New chat `button[aria-label="New chat"]`; Retry button text "Try again".
- Lists: `[aria-label="Suggested questions"]`, `[aria-label="Follow-up questions"]`.
- Citation deep-link format: `#/c/<category>?open=<listing-id>` opens the product sheet and closes the drawer.
- Scroll lock check: `document.body.style.overflow === 'hidden'` while open.

## Real-Gemini answers
Allow 10–30 s per answer. Known-good prompts: "Where does Cetaphil Gentle Skin Cleanser rank and where does its INCI come from?" on /c/facewash → #1 of 1,940, INCI from cetaphil.in. For a no-match test pick a brand NOT in the dataset (e.g. Tatcha); "Some By Mi Miracle Serum" IS in the dataset (Snail True Cica Miracle Repair Serum, #24/224).

## Security check without devtools UI
Wrap `window.fetch` in the console to log `/api/chat` request headers/body, then send a message via the UI; confirm no `AIza`/`x-goog-api-key`. `/chat-config.json` should be exactly `{"apiBase": ""}`.

## Visual QA tips
- Chrome device-mode (open DevTools with F12 first, then Ctrl+Shift+M — without DevTools open the shortcut opens Chrome's profile menu) works for 375/768/1440/1920; when it is on, screenshot coordinates map to the emulated frame only — physical clicks aimed using downscaled screenshots land on the DevTools pane. Prefer the `?` shortcut or JS `.click()` for opening while emulated, and verify with `aria-expanded`.
- Reduced motion: Ctrl+Shift+P → "Emulate CSS prefers-reduced-motion: reduce"; verify `matchMedia('(prefers-reduced-motion: reduce)').matches`.
- Overflow assertion: `document.documentElement.scrollWidth === clientWidth` with drawer open; composer pinned: dialog `lastElementChild` bottom === dialog bottom.

## Devin Secrets Needed
- `GEMINI_API_KEY` (loaded from `/home/ubuntu/.secrets/gemini.env`; never echo it).
