"""Environment-driven settings. Every knob has a safe default so the service
runs with no configuration at all: `uvicorn app.main:app`."""

import os

DB_PATH = os.environ.get("SYNC_DB_PATH", "data/rooms.sqlite3")
# Rooms nobody has touched for this long are dropped on the next sweep.
ROOM_TTL_DAYS = int(os.environ.get("SYNC_ROOM_TTL_DAYS", "120"))
# A merged room document may not grow past this many bytes of JSON.
MAX_DOC_BYTES = int(os.environ.get("SYNC_MAX_DOC_BYTES", str(1_500_000)))
# One push may carry at most this many keys.
MAX_KEYS_PER_PUSH = int(os.environ.get("SYNC_MAX_KEYS", "5000"))
# Comma-separated origins allowed to call the API; "*" for any static host.
CORS_ORIGINS = [o.strip() for o in os.environ.get("SYNC_CORS_ORIGINS", "*").split(",") if o.strip()]
# Room codes: 6 characters from an alphabet without look-alikes (no 0/O, 1/I/L).
CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"
CODE_LENGTH = 6
# Keys the client may sync. Anything else in a push is dropped on the server
# too, so a buggy or hostile client can't park documents, money receipts or
# keys in a shared room. Prefixes end in '.'.
ALLOWED_KEYS = {"strategy", "travellers", "berth", "bed", "food", "local", "buffer"}
ALLOWED_PREFIXES = ("picks.", "order.", "hops.", "hearts.", "present.", "custom.", "people.", "expenses.", "events.")
