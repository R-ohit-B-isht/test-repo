"""Wire shapes for /api/reminders — validated hard, because every field is later trusted by the ticking loop."""
from __future__ import annotations

import re
from datetime import date
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import BaseModel, Field, field_validator

SLOTS = ("am", "pm")
DAYS = ("mon", "tue", "wed", "thu", "fri", "sat", "sun")
TIME_RE = re.compile(r"^([01]\d|2[0-3]):([0-5]\d)$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
MAX_TITLES = 40
MAX_TITLE_CHARS = 80
MAX_WEEKS = 3


class PushKeys(BaseModel):
    p256dh: str = Field(min_length=16, max_length=512)
    auth: str = Field(min_length=8, max_length=256)


class PushSubscription(BaseModel):
    endpoint: str = Field(min_length=16, max_length=2048)
    keys: PushKeys
    expirationTime: int | float | None = None

    @field_validator("endpoint")
    @classmethod
    def _https(cls, v: str) -> str:
        if not v.startswith("https://"):
            raise ValueError("push endpoint must be https")
        return v


class SlotSetting(BaseModel):
    enabled: bool = False
    time: str = "07:30"

    @field_validator("time")
    @classmethod
    def _hhmm(cls, v: str) -> str:
        if not TIME_RE.match(v):
            raise ValueError("time must be HH:MM (24h)")
        return v


class DaySteps(BaseModel):
    am: list[str] = Field(default_factory=list, max_length=MAX_TITLES)
    pm: list[str] = Field(default_factory=list, max_length=MAX_TITLES)

    @field_validator("am", "pm")
    @classmethod
    def _titles(cls, v: list[str]) -> list[str]:
        return [t.strip()[:MAX_TITLE_CHARS] for t in v if isinstance(t, str) and t.strip()]


class WeekSteps(BaseModel):
    """Step names for one Monday-to-Sunday week (rotating steps differ week to week, so the browser sends this week and next)."""

    monday: str
    days: dict[str, DaySteps] = Field(default_factory=dict)

    @field_validator("monday")
    @classmethod
    def _monday(cls, v: str) -> str:
        if not DATE_RE.match(v):
            raise ValueError("monday must be YYYY-MM-DD")
        d = date.fromisoformat(v)
        if d.weekday() != 0:
            raise ValueError("monday must fall on a Monday")
        return v

    @field_validator("days")
    @classmethod
    def _days(cls, v: dict[str, DaySteps]) -> dict[str, DaySteps]:
        return {k: d for k, d in v.items() if k in DAYS}


class ReminderRecord(BaseModel):
    """Everything one device tells us. Replaces the previous record for the same endpoint wholesale."""

    subscription: PushSubscription
    tz: str = Field(min_length=1, max_length=64)
    slots: dict[str, SlotSetting] = Field(default_factory=dict)
    onlyRoutineDays: bool = True
    weeks: list[WeekSteps] = Field(default_factory=list, max_length=MAX_WEEKS)
    url: str = Field(default="/#/routine", max_length=200)

    @field_validator("tz")
    @classmethod
    def _tz(cls, v: str) -> str:
        try:
            ZoneInfo(v)
        except (ZoneInfoNotFoundError, ValueError) as exc:
            raise ValueError(f"unknown time zone {v!r}") from exc
        return v

    @field_validator("slots")
    @classmethod
    def _slots(cls, v: dict[str, SlotSetting]) -> dict[str, SlotSetting]:
        return {k: s for k, s in v.items() if k in SLOTS}

    @field_validator("url")
    @classmethod
    def _relative(cls, v: str) -> str:
        if not v.startswith("/"):
            raise ValueError("url must be a path on the site")
        return v


class EndpointBody(BaseModel):
    endpoint: str = Field(min_length=16, max_length=2048)


class TestBody(EndpointBody):
    slot: str = "am"

    @field_validator("slot")
    @classmethod
    def _slot(cls, v: str) -> str:
        if v not in SLOTS:
            raise ValueError("slot must be am or pm")
        return v
