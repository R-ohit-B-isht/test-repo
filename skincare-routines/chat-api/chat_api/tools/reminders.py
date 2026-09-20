"""`set_reminders`: the assistant's way to change the morning / night reminder time or switch. Twin of
src/chat/local/tools/reminders.ts — returns validated before → after changes that land as pending cards on the device;
nothing is set by this call."""
from __future__ import annotations

import re

from .base import Tool, ToolContext, ToolError

REMIND_TOOL = "set_reminders"
SLOTS = ("am", "pm")
SLOT_NAME = {"am": "morning", "pm": "night"}
_TIME = re.compile(r"^([01]\d|2[0-3]):([0-5]\d)$")
_LOOSE = re.compile(r"^(\d{1,2})(?:[:.h]?(\d{2}))?(am|pm)?$")


def parse_time(raw: str) -> str | None:
    """Accepts "22:00", "22.00", "2200", "10 pm", "10:30pm", "7am" → "HH:MM"; None when it cannot be read."""
    s = re.sub(r"\s+", "", raw.strip().lower())
    m = _LOOSE.match(s)
    if not m:
        return None
    h = int(m.group(1))
    minute = int(m.group(2)) if m.group(2) else 0
    ampm = m.group(3)
    if ampm:
        if h < 1 or h > 12:
            return None
        if ampm == "am" and h == 12:
            h = 0
        if ampm == "pm" and h != 12:
            h += 12
    out = f"{h:02d}:{minute:02d}"
    return out if _TIME.match(out) else None


def _s(value: object) -> str:
    return value.strip() if isinstance(value, str) else ""


class SetReminders(Tool):
    name = REMIND_TOOL
    surface = True
    description = (
        "Change the user's morning (am) or night (pm) routine reminder on this device: the time it fires and/or whether it is on. "
        'The page context lists the current state of both ("reminders: morning off 07:30 · night on 21:30"). Use it when the user '
        "asks to be reminded at a time, to move a reminder, or to turn one on or off. time is 24-hour HH:MM (10 pm = 22:00). "
        "Each change is shown to the user as a before/after card they apply or reject — this call changes nothing by itself. "
        "Notification permission and the push registration are handled in the app, not here."
    )

    def parameters(self, manifest: dict) -> dict:
        return {
            "type": "object",
            "properties": {
                "changes": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "slot": {"type": "string", "enum": list(SLOTS), "description": "am = morning reminder, pm = night reminder"},
                            "time": {"type": "string", "nullable": True, "description": "New time, 24-hour HH:MM (e.g. 22:00)"},
                            "enabled": {"type": "boolean", "nullable": True, "description": "true to turn the reminder on, false to turn it off"},
                            "why": {"type": "string", "description": "One short sentence: what the user asked for"},
                        },
                        "required": ["slot", "why"],
                    },
                },
            },
            "required": ["changes"],
        }

    async def run(self, args: dict, ctx: ToolContext) -> dict:
        raw = args.get("changes")
        if not isinstance(raw, list) or not raw:
            raise ToolError("changes must be a non-empty array")
        current = ctx.page.get("routineReminders")
        if not isinstance(current, dict) or not all(isinstance(current.get(s), dict) for s in SLOTS):
            raise ToolError("Reminder settings are not available on this page — ask the user to open My routine → Remind.")
        changes: list[dict] = []
        problems: list[str] = []
        seen: set[str] = set()
        for i, c in enumerate(raw[:2]):
            change = c if isinstance(c, dict) else {}
            slot = change.get("slot")
            if slot not in SLOTS:
                problems.append(f"change {i + 1}: slot must be am or pm")
                continue
            if slot in seen:
                problems.append(f"change {i + 1}: the {SLOT_NAME[slot]} reminder is already changed in this call")
                continue
            before = current[slot]
            before_time = str(before.get("time", ""))
            before_enabled = before.get("enabled") is True
            time = before_time
            t = _s(change.get("time"))
            if t:
                parsed = parse_time(t)
                if not parsed:
                    problems.append(f"change {i + 1}: time '{t}' is not HH:MM (24-hour)")
                    continue
                time = parsed
            has_enabled = isinstance(change.get("enabled"), bool)
            enabled = change["enabled"] if has_enabled else before_enabled
            if not t and not has_enabled:
                problems.append(f"change {i + 1}: needs a time and/or enabled")
                continue
            if time == before_time and enabled == before_enabled:
                problems.append(f"change {i + 1}: the {SLOT_NAME[slot]} reminder is already {'on' if enabled else 'off'} at {time}")
                continue
            seen.add(slot)
            changes.append({
                "slot": slot, "before": {"enabled": before_enabled, "time": before_time}, "after": {"enabled": enabled, "time": time},
                "enabled": enabled, "time": time, "why": _s(change.get("why")),
            })
        n = len(changes)
        return {
            "changes": changes,
            "problems": problems,
            "note": (
                f"{n} reminder change{'' if n == 1 else 's'} shown to the user as before/after cards to apply or reject — not applied yet. Tell the user to review them in My routine."
                if n else "No valid change — read `problems`."
            ),
        }
