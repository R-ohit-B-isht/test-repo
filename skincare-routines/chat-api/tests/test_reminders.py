"""Reminder scheduling with a fixed clock, the record store, and the /api/reminders routes with a fake push sender."""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from chat_api.reminders.push import Pusher, SendResult, load_or_create_vapid
from chat_api.reminders.routes import router
from chat_api.reminders.schedule import GRACE_MINUTES, due_slots, notification, titles_for
from chat_api.reminders.schemas import ReminderRecord
from chat_api.reminders.service import ReminderService
from chat_api.reminders.store import ReminderStore, record_id

SUB = {
    "endpoint": "https://fcm.googleapis.com/fcm/send/abcdefghijklmnop",
    "keys": {"p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_KdZ2FsZ1ttrJ2f7i8KR9E6ZzB1bCkq7kcXrjGpH2JjD5vFq7Y", "auth": "tBHItJI5svbpez7KI4CCXg"},
}
# 2026-07-13 is a Monday.
WEEKS = [
    {"monday": "2026-07-13", "days": {"mon": {"am": ["Cleanser", "Vitamin C", "Sunscreen"], "pm": ["Cleanser", "Azelaic acid"]}, "wed": {"am": ["Cleanser"], "pm": []}}},
    {"monday": "2026-07-20", "days": {"mon": {"am": ["Cleanser", "Vitamin C", "Sunscreen"], "pm": ["Cleanser", "Retinol"]}}},
]


def record(**over) -> ReminderRecord:
    base = {
        "subscription": SUB,
        "tz": "Asia/Kolkata",
        "slots": {"am": {"enabled": True, "time": "07:30"}, "pm": {"enabled": True, "time": "21:30"}},
        "onlyRoutineDays": True,
        "weeks": WEEKS,
    }
    base.update(over)
    return ReminderRecord.model_validate(base)


def ist(y, mo, d, h, mi) -> datetime:
    """A wall-clock instant in Kolkata expressed as UTC (IST = UTC+5:30)."""
    return datetime(y, mo, d, h, mi, tzinfo=timezone.utc) - (datetime(2000, 1, 1, 5, 30) - datetime(2000, 1, 1))


# ── schedule ─────────────────────────────────────────────────────────────────


def test_due_exactly_at_time_and_within_grace():
    rec = record()
    assert [d.slot for d in due_slots(rec, {}, ist(2026, 7, 13, 7, 30))] == ["am"]
    assert [d.slot for d in due_slots(rec, {}, ist(2026, 7, 13, 7, 30 + GRACE_MINUTES - 1))] == ["am"]
    assert due_slots(rec, {}, ist(2026, 7, 13, 7, 30 + GRACE_MINUTES)) == []
    assert due_slots(rec, {}, ist(2026, 7, 13, 7, 29)) == []


def test_not_due_twice_on_same_local_day_but_again_next_day():
    rec = record()
    assert due_slots(rec, {"am": "2026-07-13"}, ist(2026, 7, 13, 7, 31)) == []
    assert [d.slot for d in due_slots(rec, {"am": "2026-07-13"}, ist(2026, 7, 14, 7, 31))] == ["am"]


def test_disabled_slot_never_due():
    rec = record(slots={"am": {"enabled": False, "time": "07:30"}, "pm": {"enabled": True, "time": "21:30"}})
    assert due_slots(rec, {}, ist(2026, 7, 13, 7, 30)) == []
    assert [d.slot for d in due_slots(rec, {}, ist(2026, 7, 13, 21, 30))] == ["pm"]


def test_time_zone_is_the_devices_not_the_servers():
    rec = record(tz="America/Los_Angeles")  # 07:30 PDT == 14:30 UTC in July
    assert [d.slot for d in due_slots(rec, {}, datetime(2026, 7, 13, 14, 30, tzinfo=timezone.utc))] == ["am"]
    assert due_slots(rec, {}, ist(2026, 7, 13, 7, 30)) == []


def test_titles_follow_the_week_block_so_rotations_read_right_next_week():
    rec = record()
    assert titles_for(rec, datetime(2026, 7, 13).date(), "pm") == ["Cleanser", "Azelaic acid"]
    assert titles_for(rec, datetime(2026, 7, 20).date(), "pm") == ["Cleanser", "Retinol"]
    # A week the browser never described falls back to the latest earlier block.
    assert titles_for(rec, datetime(2026, 8, 3).date(), "pm") == ["Cleanser", "Retinol"]
    # A day with no entry in the block means "nothing scheduled".
    assert titles_for(rec, datetime(2026, 7, 14).date(), "am") == []


def test_empty_slot_is_skipped_when_only_routine_days_and_sent_when_not():
    quiet = record()
    due = due_slots(quiet, {}, ist(2026, 7, 15, 21, 30))  # Wednesday night has no steps
    assert len(due) == 1 and due[0].skip is True
    loud = record(onlyRoutineDays=False)
    due = due_slots(loud, {}, ist(2026, 7, 15, 21, 30))
    assert len(due) == 1 and due[0].skip is False
    assert "Nothing scheduled" in notification(loud, due[0])["body"]


def test_notification_text_and_deep_link():
    rec = record(url="/#/routine")
    [due] = due_slots(rec, {}, ist(2026, 7, 13, 7, 30))
    n = notification(rec, due)
    assert n["title"] == "Morning routine"
    assert n["body"] == "3 steps · Cleanser → Vitamin C → Sunscreen"
    assert n["tag"] == "routine-am"
    assert n["url"] == "/#/routine?slot=am&remind=am"


def test_long_bodies_are_truncated():
    weeks = [{"monday": "2026-07-13", "days": {"mon": {"am": [f"Step number {i} with a long name" for i in range(12)], "pm": []}}}]
    rec = record(weeks=weeks)
    [due] = due_slots(rec, {}, ist(2026, 7, 13, 7, 30))
    body = notification(rec, due)["body"]
    assert len(body) <= 150 and body.endswith("…") and body.startswith("12 steps · ")


# ── schema ───────────────────────────────────────────────────────────────────


@pytest.mark.parametrize(
    "over",
    [
        {"tz": "Mars/Olympus"},
        {"slots": {"am": {"enabled": True, "time": "7:30"}}},
        {"slots": {"am": {"enabled": True, "time": "24:00"}}},
        {"weeks": [{"monday": "2026-07-14", "days": {}}]},  # a Tuesday
        {"subscription": {**SUB, "endpoint": "http://insecure.example/x"}},
        {"url": "https://elsewhere.example/"},
    ],
)
def test_bad_records_are_rejected(over):
    with pytest.raises(ValueError):
        record(**over)


def test_unknown_days_and_slots_are_dropped_and_titles_trimmed():
    rec = record(
        slots={"am": {"enabled": True, "time": "07:30"}, "noon": {"enabled": True, "time": "12:00"}},
        weeks=[{"monday": "2026-07-13", "days": {"mon": {"am": ["  Cleanser  ", "", "x" * 200], "pm": []}, "funday": {"am": ["?"], "pm": []}}}],
    )
    assert list(rec.slots) == ["am"]
    assert list(rec.weeks[0].days) == ["mon"]
    assert rec.weeks[0].days["mon"].am == ["Cleanser", "x" * 80]


# ── store ────────────────────────────────────────────────────────────────────


def test_store_round_trips_and_keeps_sent_marks_across_upserts(tmp_path: Path):
    store = ReminderStore(tmp_path / "records.json")
    row = store.upsert(record())
    store.mark_sent(row["id"], "am", "2026-07-13")
    row2 = store.upsert(record(onlyRoutineDays=False))
    assert row2["sent"] == {"am": "2026-07-13"} and row2["createdAt"] == row["createdAt"]
    reloaded = ReminderStore(tmp_path / "records.json")
    assert len(reloaded) == 1 and reloaded.get(SUB["endpoint"])["record"]["onlyRoutineDays"] is False
    assert reloaded.delete(SUB["endpoint"]) is True and len(reloaded) == 0
    assert record_id(SUB["endpoint"]) == row["id"]


def test_store_ignores_corrupt_file_and_bad_rows(tmp_path: Path):
    path = tmp_path / "records.json"
    path.write_text("{not json")
    assert len(ReminderStore(path)) == 0
    path.write_text('{"version":1,"records":{"bad":{"id":"bad","record":{"tz":"x"}}}}')
    assert len(ReminderStore(path)) == 0


# ── service with a fake sender ───────────────────────────────────────────────


class FakePusher:
    public_key = "BFAKEKEY"

    def __init__(self, result: SendResult | None = None):
        self.sent: list[tuple[dict, dict]] = []
        self.result = result or SendResult(ok=True, status=201, error=None)

    async def send(self, subscription: dict, payload: dict) -> SendResult:
        self.sent.append((subscription, payload))
        return self.result


async def test_tick_sends_once_and_skips_quiet_days(tmp_path: Path):
    store = ReminderStore(tmp_path / "records.json")
    row = store.upsert(record())
    pusher = FakePusher()
    svc = ReminderService(store, pusher, tick_seconds=5)  # type: ignore[arg-type]
    assert await svc.tick(ist(2026, 7, 13, 7, 31)) == 1
    assert await svc.tick(ist(2026, 7, 13, 7, 33)) == 0  # same day, already sent
    assert pusher.sent[0][1]["body"] == "3 steps · Cleanser → Vitamin C → Sunscreen"
    assert await svc.tick(ist(2026, 7, 15, 21, 31)) == 0  # Wednesday night: nothing scheduled → marked, not pushed
    assert store.get(SUB["endpoint"])["sent"] == {"am": "2026-07-13", "pm": "2026-07-15"}
    assert len(pusher.sent) == 1
    assert row["id"] == record_id(SUB["endpoint"])


async def test_gone_subscription_is_dropped_and_other_failures_kept(tmp_path: Path):
    store = ReminderStore(tmp_path / "records.json")
    store.upsert(record())
    svc = ReminderService(store, FakePusher(SendResult(ok=False, status=500, error="boom")), tick_seconds=5)  # type: ignore[arg-type]
    assert await svc.tick(ist(2026, 7, 13, 7, 31)) == 0
    assert store.get(SUB["endpoint"])["failures"] == 1
    svc.pusher = FakePusher(SendResult(ok=False, status=410, error="gone", gone=True))  # type: ignore[assignment]
    await svc.tick(ist(2026, 7, 13, 7, 32))
    assert store.get(SUB["endpoint"]) is None


# ── vapid ────────────────────────────────────────────────────────────────────


def test_vapid_key_is_created_once_and_reused_or_taken_from_env(tmp_path: Path):
    first = Pusher(load_or_create_vapid("", tmp_path / "vapid.pem"), "mailto:x@example.com")
    second = Pusher(load_or_create_vapid("", tmp_path / "vapid.pem"), "mailto:x@example.com")
    assert first.public_key == second.public_key and len(first.public_key) == 87
    pem = (tmp_path / "vapid.pem").read_text()
    from_env = Pusher(load_or_create_vapid(pem, tmp_path / "other.pem"), "mailto:x@example.com")
    assert from_env.public_key == first.public_key and not (tmp_path / "other.pem").exists()


# ── routes ───────────────────────────────────────────────────────────────────


def _client(tmp_path: Path, pusher: FakePusher) -> TestClient:
    app = FastAPI()
    app.include_router(router)
    app.state.reminders = ReminderService(ReminderStore(tmp_path / "records.json"), pusher, tick_seconds=5)  # type: ignore[arg-type]
    return TestClient(app)


def test_routes_register_status_test_unsubscribe(tmp_path: Path):
    pusher = FakePusher()
    c = _client(tmp_path, pusher)
    cfg = c.get("/api/reminders/config").json()
    assert cfg["enabled"] is True and cfg["publicKey"] == "BFAKEKEY" and cfg["records"] == 0
    body = record().model_dump()
    r = c.put("/api/reminders/subscription", json=body)
    assert r.status_code == 200 and r.json()["ok"] is True
    assert c.post("/api/reminders/status", json={"endpoint": SUB["endpoint"]}).json()["registered"] is True
    r = c.post("/api/reminders/test", json={"endpoint": SUB["endpoint"], "slot": "pm"})
    assert r.status_code == 200 and pusher.sent[-1][1]["title"].startswith("Test · Night routine")
    assert c.post("/api/reminders/unsubscribe", json={"endpoint": SUB["endpoint"]}).json()["removed"] is True
    assert c.post("/api/reminders/test", json={"endpoint": SUB["endpoint"], "slot": "am"}).status_code == 404
    assert c.put("/api/reminders/subscription", json={**body, "tz": "Nowhere/Land"}).status_code == 422


def test_routes_503_when_reminders_disabled():
    app = FastAPI()
    app.include_router(router)
    app.state.reminders = None
    assert TestClient(app).get("/api/reminders/config").status_code == 503
