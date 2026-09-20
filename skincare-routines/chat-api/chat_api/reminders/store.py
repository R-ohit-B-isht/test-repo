"""One JSON file of reminder records, keyed by a hash of the push endpoint. Small (one record per device), rewritten
atomically on every change. Losing the file is survivable: the app re-sends its record every time it opens."""
from __future__ import annotations

import hashlib
import json
import logging
import os
import threading
from datetime import datetime, timezone
from pathlib import Path

from .schemas import ReminderRecord

log = logging.getLogger("chat_api.reminders")

MAX_RECORDS = 5000


def record_id(endpoint: str) -> str:
    return hashlib.sha256(endpoint.encode("utf-8")).hexdigest()[:24]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class ReminderStore:
    def __init__(self, path: Path):
        self.path = path
        self._lock = threading.Lock()
        self._records: dict[str, dict] = {}
        self._load()

    # ── persistence ───────────────────────────────────────────────────────────

    def _load(self) -> None:
        try:
            raw = json.loads(self.path.read_text("utf-8"))
        except FileNotFoundError:
            return
        except (OSError, ValueError) as exc:
            log.warning("reminders: could not read %s (%s) — starting empty", self.path, exc)
            return
        records = raw.get("records") if isinstance(raw, dict) else None
        if not isinstance(records, dict):
            return
        kept: dict[str, dict] = {}
        for rid, rec in records.items():
            try:
                ReminderRecord.model_validate(rec["record"])
            except Exception:  # noqa: BLE001 — a bad row must not take the rest down
                continue
            kept[rid] = rec
        self._records = kept
        log.info("reminders: %d record(s) loaded from %s", len(kept), self.path)

    def _flush(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        tmp = self.path.with_suffix(".tmp")
        tmp.write_text(json.dumps({"version": 1, "records": self._records}, ensure_ascii=False), "utf-8")
        os.replace(tmp, self.path)

    # ── API ───────────────────────────────────────────────────────────────────

    def upsert(self, record: ReminderRecord) -> dict:
        rid = record_id(record.subscription.endpoint)
        with self._lock:
            prev = self._records.get(rid, {})
            row = {
                "id": rid,
                "record": record.model_dump(),
                "updatedAt": now_iso(),
                "createdAt": prev.get("createdAt", now_iso()),
                "sent": prev.get("sent", {}),
                "lastError": None,
                "failures": 0,
            }
            if rid not in self._records and len(self._records) >= MAX_RECORDS:
                raise OverflowError("reminder store is full")
            self._records[rid] = row
            self._flush()
            return dict(row)

    def get(self, endpoint: str) -> dict | None:
        with self._lock:
            row = self._records.get(record_id(endpoint))
            return dict(row) if row else None

    def delete(self, endpoint: str) -> bool:
        with self._lock:
            gone = self._records.pop(record_id(endpoint), None) is not None
            if gone:
                self._flush()
            return gone

    def all_rows(self) -> list[dict]:
        with self._lock:
            return [dict(r) for r in self._records.values()]

    def mark_sent(self, rid: str, slot: str, local_date: str) -> None:
        with self._lock:
            row = self._records.get(rid)
            if not row:
                return
            row.setdefault("sent", {})[slot] = local_date
            row["lastError"] = None
            row["failures"] = 0
            row["lastSentAt"] = now_iso()
            self._flush()

    def mark_failed(self, rid: str, error: str, drop: bool) -> None:
        with self._lock:
            row = self._records.get(rid)
            if not row:
                return
            if drop:
                del self._records[rid]
            else:
                row["lastError"] = error[:300]
                row["failures"] = int(row.get("failures", 0)) + 1
            self._flush()

    def __len__(self) -> int:
        return len(self._records)
