"""The ticking loop: every few seconds, look at every record, send what is due, remember what was sent."""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone

from .push import Pusher
from .schedule import Due, due_slots, local_now, notification, titles_for
from .schemas import ReminderRecord
from .store import ReminderStore, now_iso

log = logging.getLogger("chat_api.reminders")


class ReminderService:
    def __init__(self, store: ReminderStore, pusher: Pusher, tick_seconds: int = 20):
        self.store = store
        self.pusher = pusher
        self.tick_seconds = tick_seconds
        self.started_at = now_iso()
        self.last_tick: str | None = None
        self.sent_total = 0
        self.failed_total = 0

    async def run_forever(self) -> None:
        while True:
            try:
                await self.tick()
            except Exception:  # noqa: BLE001 — the loop must outlive any single bad record
                log.exception("reminders: tick failed")
            await asyncio.sleep(self.tick_seconds)

    async def tick(self, now_utc: datetime | None = None) -> int:
        now_utc = now_utc or datetime.now(timezone.utc)
        self.last_tick = now_utc.isoformat(timespec="seconds")
        sent = 0
        for row in self.store.all_rows():
            try:
                record = ReminderRecord.model_validate(row["record"])
            except Exception:  # noqa: BLE001
                continue
            for due in due_slots(record, row.get("sent", {}), now_utc):
                if due.skip:
                    self.store.mark_sent(row["id"], due.slot, due.local_date)
                    continue
                if await self._deliver(row["id"], record, due):
                    sent += 1
        return sent

    async def _deliver(self, rid: str, record: ReminderRecord, due: Due) -> bool:
        result = await self.pusher.send(record.subscription.model_dump(), notification(record, due))
        if result.ok:
            self.store.mark_sent(rid, due.slot, due.local_date)
            self.sent_total += 1
            return True
        self.failed_total += 1
        self.store.mark_failed(rid, result.error or f"HTTP {result.status}", drop=result.gone)
        log.warning("reminders: push failed for %s (%s%s)", rid, result.error, " — dropped" if result.gone else "")
        return False

    async def send_test(self, record: ReminderRecord, slot: str) -> tuple[bool, str | None]:
        """Immediate push so the user can see the permission + delivery path work, with today's real steps in it."""
        local = local_now(record, datetime.now(timezone.utc))
        titles = titles_for(record, local.date(), slot) or []
        payload = notification(record, Due(slot=slot, local_date=local.date().isoformat(), titles=titles))
        payload["title"] = f"Test · {payload['title']}"
        result = await self.pusher.send(record.subscription.model_dump(), payload)
        return result.ok, result.error

    def stats(self) -> dict:
        return {"records": len(self.store), "startedAt": self.started_at, "lastTick": self.last_tick, "sent": self.sent_total, "failed": self.failed_total}
