"""Room use-cases: open a room, read it, push changes into it. Knows nothing
about HTTP; `main.py` maps its outcomes onto status codes."""

from __future__ import annotations

import secrets
import time

from ..config import CODE_ALPHABET, CODE_LENGTH, MAX_DOC_BYTES, MAX_KEYS_PER_PUSH
from ..models.rooms import Room, RoomRepo
from .merge import clean_fields, doc_bytes, merge


class RoomError(Exception):
    def __init__(self, code: str, detail: str):
        super().__init__(detail)
        self.code = code
        self.detail = detail


def normalise_code(raw: str) -> str:
    return "".join(ch for ch in raw.upper() if ch.isalnum())


def valid_code(code: str) -> bool:
    return len(code) == CODE_LENGTH and all(ch in CODE_ALPHABET for ch in code)


class RoomService:
    def __init__(self, repo: RoomRepo):
        self.repo = repo
        self._last_sweep = 0.0

    def _maybe_sweep(self) -> None:
        now = time.time()
        if now - self._last_sweep > 3600:
            self._last_sweep = now
            self.repo.sweep()

    def open(self) -> Room:
        self._maybe_sweep()
        for _ in range(20):
            code = "".join(secrets.choice(CODE_ALPHABET) for _ in range(CODE_LENGTH))
            if self.repo.create(code):
                room = self.repo.get(code)
                assert room is not None
                return room
        raise RoomError("exhausted", "Could not find a free room code; try again.")

    def read(self, raw_code: str) -> Room:
        code = normalise_code(raw_code)
        if not valid_code(code):
            raise RoomError("bad_code", "Room codes are 6 letters or digits.")
        room = self.repo.get(code)
        if room is None:
            raise RoomError("not_found", "No room with that code. It may have expired.")
        self.repo.touch(code)
        return room

    def push(self, raw_code: str, raw_fields) -> tuple[Room, int]:
        """Merge `raw_fields` into the room; returns (room, keys_changed)."""
        room = self.read(raw_code)
        incoming = clean_fields(raw_fields, MAX_KEYS_PER_PUSH)
        merged, changed = merge(room.fields, incoming)
        if doc_bytes(merged) > MAX_DOC_BYTES:
            raise RoomError("too_big", "This room is full; remove old expenses or open a new room.")
        saved = self.repo.save(room.code, merged, bump=changed > 0)
        assert saved is not None
        return saved, changed
