# vietnam-sync

Tiny room-code sync for the Vietnam planner (`../vietnam`). One FastAPI app,
one SQLite file, no accounts: whoever has the 6-character room code is in.

```
uvicorn app.main:app --reload            # http://127.0.0.1:8000/docs
```

| Method | Path            | Does                                                                 |
| ------ | --------------- | -------------------------------------------------------------------- |
| POST   | `/rooms`        | open a room → `{ room, version, f }`                                 |
| GET    | `/rooms/{code}` | read it (send `If-None-Match: "<version>"` to get a 304 when unchanged) |
| POST   | `/rooms/{code}` | body `{ f: { key: [value, stamp_ms] } }` → merged room + `changed`   |
| GET    | `/health`       | `{ ok, rooms }`                                                      |

`app/services/merge.py` is the whole conflict model: last writer wins per key,
ties break on JSON text so replicas converge. Only plan keys are accepted
(`picks.*`, `expenses.*`, `hearts.*`, dials …) — documents, photos, GPS, cash and
API keys are refused server-side, so a room can never hold them.

Settings (env): `SYNC_DB_PATH`, `SYNC_ROOM_TTL_DAYS` (120), `SYNC_MAX_DOC_BYTES`,
`SYNC_MAX_KEYS`, `SYNC_CORS_ORIGINS` (`*`).

## Pointing the site at it

The client (`vietnam/js/sync/`) reads the server URL from the `vietnam-sync-url`
localStorage slot; with nothing set the Book page shows an honest "not set up"
card. In dev mode (`?dev=1`) the dev bar has "Sync: local server", or run
`docker compose up` here and set the slot to `http://127.0.0.1:8000`.
