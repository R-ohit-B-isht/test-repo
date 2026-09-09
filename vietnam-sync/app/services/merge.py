"""Last-writer-wins merge of flat room documents.

A document is `{ "f": { key: [value, stamp_ms] } }`. Keys are dotted paths
into the planner's shareable state (`picks.baNaHills`, `expenses.x-abc`,
`hearts.<activity>.<person>`, `travellers`, ...). Each key carries the
millisecond stamp of the device that last changed it; the newer stamp wins,
ties break on the JSON text so every replica converges on the same answer.
`value = None` is a tombstone: the key was cleared.

This is the whole conflict model on purpose. Two friends rarely edit the same
pick or expense within the same second, and when they do, the later tap wins —
the same rule Splitwise and Google Keep use for simple fields. Records (people,
expenses, custom spots) are whole-object keys, so a partial edit never mixes
two versions of one row.
"""

from __future__ import annotations

import json
from typing import Any

from ..config import ALLOWED_KEYS, ALLOWED_PREFIXES

Entry = list  # [value, stamp]
Fields = dict[str, Entry]


def key_allowed(key: str) -> bool:
    if key in ALLOWED_KEYS:
        return True
    return key.startswith(ALLOWED_PREFIXES) and len(key) <= 160


def clean_fields(raw: Any, max_keys: int) -> Fields:
    """Keep only well-formed `[value, stamp]` entries under allowed keys."""
    if not isinstance(raw, dict):
        return {}
    out: Fields = {}
    for key, entry in raw.items():
        if len(out) >= max_keys:
            break
        if not isinstance(key, str) or not key_allowed(key):
            continue
        if not (isinstance(entry, list) and len(entry) == 2):
            continue
        value, stamp = entry
        if not isinstance(stamp, (int, float)) or isinstance(stamp, bool) or stamp < 0:
            continue
        out[key] = [value, int(stamp)]
    return out


def _wins(a: Entry, b: Entry) -> bool:
    """True when `a` should replace `b`."""
    if a[1] != b[1]:
        return a[1] > b[1]
    return json.dumps(a[0], sort_keys=True) > json.dumps(b[0], sort_keys=True)


def merge(base: Fields, incoming: Fields) -> tuple[Fields, int]:
    """Return (merged, number_of_keys_changed_in_base)."""
    out = dict(base)
    changed = 0
    for key, entry in incoming.items():
        cur = out.get(key)
        if cur is None or _wins(entry, cur):
            if cur is None or cur[0] != entry[0] or cur[1] != entry[1]:
                changed += 1
            out[key] = entry
    return out, changed


def doc_bytes(fields: Fields) -> int:
    return len(json.dumps(fields, separators=(",", ":")).encode())
