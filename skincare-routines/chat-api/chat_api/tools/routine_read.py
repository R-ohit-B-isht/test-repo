"""`read_routine`: the user's saved routine as structured data — every step with this week's product, shelf state ("with me"),
the whole weekly rotation (all options, this week's and next week's), and the reminder settings. Read-only. Twin of
src/chat/local/tools/routineRead.ts."""
from __future__ import annotations

from .base import Tool, ToolContext, ToolError

READ_TOOL = "read_routine"
SLOTS = ("am", "pm")


def _step(s: dict) -> dict:
    rotation = s.get("rotation")
    rot = None
    if isinstance(rotation, dict) and isinstance(rotation.get("options"), list) and rotation["options"]:
        active = rotation.get("active") if isinstance(rotation.get("active"), int) else 1
        n = len(rotation["options"])
        rot = {
            "active": active,
            "next_week": (active % n) + 1,
            "options": [
                {"option": i + 1, "title": (o or {}).get("title") if isinstance(o, dict) else None, "product": (o or {}).get("product") if isinstance(o, dict) else None}
                for i, o in enumerate(rotation["options"])
            ],
        }
    return {
        "id": s.get("id"), "slot": s.get("slot"), "position": s.get("position"), "days": s.get("days"), "zone": s.get("zone"),
        "title": s.get("title"), "category": s.get("category"), "product": s.get("product"), "with_me": s.get("withMe"),
        "note": s.get("note") or None, "rotation": rot,
    }


class ReadRoutine(Tool):
    name = READ_TOOL
    description = (
        "Read the user's saved routine on this device: every step (id, AM/PM, days, zone, product), which products are "
        'marked "not with me" on the shelf, each weekly rotation with all its options and this week\'s / next week\'s one, and the '
        "morning / night reminder settings. Read-only. Use it to answer questions about the routine, shelf, rotations or reminders "
        "and before proposing changes to them; it changes nothing."
    )

    def parameters(self, manifest: dict) -> dict:
        return {
            "type": "object",
            "properties": {"slot": {"type": "string", "nullable": True, "description": "am or pm to read one slot; omit for the whole routine"}},
        }

    async def run(self, args: dict, ctx: ToolContext) -> dict:
        steps = ctx.page.get("routineSteps")
        if not isinstance(steps, list):
            raise ToolError("The saved routine is not available on this page — ask the user to open My routine.")
        raw_slot = args.get("slot")
        slot = raw_slot.strip().lower() if isinstance(raw_slot, str) and raw_slot.strip() else None
        if slot and slot not in SLOTS:
            raise ToolError(f"slot must be am or pm, not '{slot}'")
        shown = [s for s in steps if isinstance(s, dict) and (not slot or s.get("slot") == slot)]
        not_with_me = [
            {"step_id": s.get("id"), "title": s.get("title"), "product": s.get("product")}
            for s in shown if s.get("withMe") is False and s.get("product")
        ]
        reminders = ctx.page.get("routineReminders")
        have_rem = isinstance(reminders, dict) and all(isinstance(reminders.get(k), dict) for k in SLOTS)
        n = len(shown)
        return {
            "steps": n,
            "list": [_step(s) for s in shown],
            "not_with_me": not_with_me,
            "rotating": [s.get("id") for s in shown if isinstance(s.get("rotation"), dict)],
            "reminders": {"am": dict(reminders["am"]), "pm": dict(reminders["pm"])} if have_rem else None,
            "note": (
                f"{n} step{'' if n == 1 else 's'}{f' in {slot.upper()}' if slot else ''}; {len(not_with_me)} not with the user; "
                "a rotating step uses exactly one option per Mon–Sun week (rotation.active), never several together. "
                "Change steps/shelf/rotations with edit_routine_steps and reminders with set_reminders — both only propose."
            ),
        }
