"""SQLite repository for rooms. One row per room: the merged document, a
monotonic version and the last-touched time. Standard library only."""

from __future__ import annotations

import json
import os
import sqlite3
import threading
import time
from dataclasses import dataclass

from ..config import DB_PATH, ROOM_TTL_DAYS


@dataclass
class Room:
    code: str
    version: int
    fields: dict
    updated: int  # unix seconds


class RoomRepo:
    def __init__(self, path: str = DB_PATH):
        if path != ":memory:":
            os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        self._conn = sqlite3.connect(path, check_same_thread=False)
        self._conn.execute("PRAGMA journal_mode=WAL")
        self._lock = threading.Lock()
        self._conn.execute(
            """CREATE TABLE IF NOT EXISTS rooms (
                 code TEXT PRIMARY KEY,
                 version INTEGER NOT NULL,
                 doc TEXT NOT NULL,
                 created INTEGER NOT NULL,
                 updated INTEGER NOT NULL
               )"""
        )
        self._conn.commit()

    def get(self, code: str) -> Room | None:
        row = self._conn.execute("SELECT code, version, doc, updated FROM rooms WHERE code = ?", (code,)).fetchone()
        if not row:
            return None
        return Room(code=row[0], version=row[1], fields=json.loads(row[2]), updated=row[3])

    def create(self, code: str) -> bool:
        """Insert an empty room; False if the code is already taken."""
        now = int(time.time())
        with self._lock:
            try:
                self._conn.execute(
                    "INSERT INTO rooms (code, version, doc, created, updated) VALUES (?, 1, '{}', ?, ?)",
                    (code, now, now),
                )
                self._conn.commit()
                return True
            except sqlite3.IntegrityError:
                return False

    def save(self, code: str, fields: dict, bump: bool) -> Room | None:
        """Write the merged document; bump the version only when it changed."""
        now = int(time.time())
        with self._lock:
            row = self._conn.execute("SELECT version FROM rooms WHERE code = ?", (code,)).fetchone()
            if not row:
                return None
            version = row[0] + (1 if bump else 0)
            self._conn.execute(
                "UPDATE rooms SET version = ?, doc = ?, updated = ? WHERE code = ?",
                (version, json.dumps(fields, separators=(",", ":")), now, code),
            )
            self._conn.commit()
        return Room(code=code, version=version, fields=fields, updated=now)

    def touch(self, code: str) -> None:
        with self._lock:
            self._conn.execute("UPDATE rooms SET updated = ? WHERE code = ?", (int(time.time()), code))
            self._conn.commit()

    def sweep(self) -> int:
        """Drop rooms idle for longer than ROOM_TTL_DAYS. Returns how many."""
        cutoff = int(time.time()) - ROOM_TTL_DAYS * 86400
        with self._lock:
            cur = self._conn.execute("DELETE FROM rooms WHERE updated < ?", (cutoff,))
            self._conn.commit()
            return cur.rowcount

    def count(self) -> int:
        return self._conn.execute("SELECT COUNT(*) FROM rooms").fetchone()[0]
