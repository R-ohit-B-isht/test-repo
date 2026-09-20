"""Pure decisions for the ticking loop: which slots of a record are due right now, and what the notification says.
No I/O, so it is testable with a fixed clock."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from .schemas import DAYS, ReminderRecord

# A push that comes a little late (loop hiccup, deploy) is still useful; one that comes an hour late is a nuisance.
GRACE_MINUTES = 10
SLOT_TITLE = {"am": "Morning routine", "pm": "Night routine"}
BODY_MAX = 150


@dataclass(frozen=True)
class Due:
    slot: str
    local_date: str
    titles: list[str]
    # Nothing in this slot today and the user asked to be left alone on such days.
    skip: bool = False


def local_now(record: ReminderRecord, now_utc: datetime) -> datetime:
    return now_utc.astimezone(ZoneInfo(record.tz))


def _hhmm_to_minutes(hhmm: str) -> int:
    h, m = hhmm.split(":")
    return int(h) * 60 + int(m)


def monday_of(d: date) -> date:
    return d - timedelta(days=d.weekday())


def titles_for(record: ReminderRecord, local_day: date, slot: str) -> list[str] | None:
    """Step names for that day and slot, from the week block matching its Monday, else the most recent earlier block.
    `None` when the record carries no week information at all."""
    if not record.weeks:
        return None
    monday = monday_of(local_day).isoformat()
    exact = [w for w in record.weeks if w.monday == monday]
    earlier = sorted((w for w in record.weeks if w.monday < monday), key=lambda w: w.monday)
    week = exact[0] if exact else (earlier[-1] if earlier else sorted(record.weeks, key=lambda w: w.monday)[0])
    day = week.days.get(DAYS[local_day.weekday()])
    if day is None:
        return []
    return list(getattr(day, slot))


def due_slots(record: ReminderRecord, sent: dict[str, str], now_utc: datetime) -> list[Due]:
    """Slots whose local time has just passed today (within the grace window) and were not yet sent for today."""
    local = local_now(record, now_utc)
    today = local.date().isoformat()
    minutes = local.hour * 60 + local.minute
    out: list[Due] = []
    for slot, setting in record.slots.items():
        if not setting.enabled or sent.get(slot) == today:
            continue
        target = _hhmm_to_minutes(setting.time)
        if 0 <= minutes - target < GRACE_MINUTES:
            titles = titles_for(record, local.date(), slot)
            skip = record.onlyRoutineDays and titles is not None and len(titles) == 0
            out.append(Due(slot=slot, local_date=today, titles=titles or [], skip=skip))
    return out


def notification(record: ReminderRecord, due: Due) -> dict:
    """The JSON the service worker turns into a notification. Step names only — no product evidence claims."""
    n = len(due.titles)
    if n == 0:
        body = "Nothing scheduled for this slot today — open the app if that looks wrong."
    else:
        body = f"{n} step{'s' if n != 1 else ''} · " + " → ".join(due.titles)
        if len(body) > BODY_MAX:
            body = body[: BODY_MAX - 1].rstrip() + "…"
    return {
        "title": SLOT_TITLE.get(due.slot, "Routine"),
        "body": body,
        "tag": f"routine-{due.slot}",
        "slot": due.slot,
        "date": due.local_date,
        "url": _with_slot(record.url, due.slot),
    }


def _with_slot(url: str, slot: str) -> str:
    sep = "&" if "?" in url else "?"
    return f"{url}{sep}slot={slot}&remind={slot}"
