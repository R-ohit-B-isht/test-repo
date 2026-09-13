"""Second-opinion tool for the routine planner — twin of src/chat/local/tools/planReview.ts. The page builds the week
deterministically and picks listings from the rankings; Gemini writes one honest line per step and flags plan-level
concerns. A swapped pick must be a candidate id the model was shown; ids are checked here and by the page."""
from __future__ import annotations

import re

from .base import Tool, ToolContext, ToolError

REVIEW_TOOL = "review_routine_plan"
MAX_NOTES = 40
MAX_WARNINGS = 12
STEP_ID = re.compile(r"^[a-z0-9]+:(am|pm)$")


def _s(value: object) -> str:
    return value.strip() if isinstance(value, str) else ""


class ReviewRoutinePlan(Tool):
    name = REVIEW_TOOL
    surface = True
    description = (
        "Return your review of a weekly routine plan the user's 'My routine' page built (the plan and each step's candidate listings "
        "are in the message). For every step id give one plain sentence on why it sits where it does or what to watch; optionally "
        "swap the pick to another candidate id shown for that step (never an id from elsewhere). List any plan-level warnings — "
        "clashes, missing sunscreen, too many layers, ingredients that do not suit the stated skin type. Call it once, with all steps."
    )

    def parameters(self, manifest: dict) -> dict:
        return {
            "type": "object",
            "properties": {
                "notes": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "step": {"type": "string", "description": "Step id exactly as given in the plan, e.g. 'retinol:pm'"},
                            "why": {"type": "string", "description": "One sentence, plain words, no marketing"},
                            "pick_id": {"type": "string", "nullable": True, "description": "A candidate listing id shown for this step to use instead of the first one, or null to keep it"},
                        },
                        "required": ["step", "why"],
                    },
                },
                "warnings": {"type": "array", "items": {"type": "string"}, "description": "Plan-level cautions in one sentence each; empty when none"},
            },
            "required": ["notes", "warnings"],
        }

    async def run(self, args: dict, ctx: ToolContext) -> dict:
        await ctx.store.ensure_fresh()
        raw = args.get("notes")
        if not isinstance(raw, list) or not raw:
            raise ToolError("notes must be a non-empty array — one entry per step id in the plan")
        notes: list[dict] = []
        problems: list[str] = []
        for entry in raw[:MAX_NOTES]:
            n = entry if isinstance(entry, dict) else {}
            step, why = _s(n.get("step")), _s(n.get("why"))
            if not STEP_ID.match(step):
                problems.append(f"'{step or '(blank)'}' is not a step id from the plan")
                continue
            if not why:
                problems.append(f"{step}: empty note")
                continue
            pick_id = _s(n.get("pick_id")) or None
            if pick_id and ctx.store.index.get(pick_id) is None:
                problems.append(f"{step}: no listing with id '{pick_id}' in the dataset — pick kept")
                pick_id = None
            notes.append({"step": step, "why": why, "pickId": pick_id})
        raw_warnings = args.get("warnings")
        warnings = [w for w in (_s(x) for x in (raw_warnings if isinstance(raw_warnings, list) else [])) if w][:MAX_WARNINGS]
        return {
            "noted": len(notes), "notes": notes, "warnings": warnings, "problems": problems,
            "note": (
                "The review is now shown next to the plan on the My routine page. Reply with ONE short verdict sentence about the week itself (what is well spaced, the single thing to watch) — not a confirmation that notes were added."
                if notes else "Nothing usable — every entry was rejected; fix the step ids and call again."
            ),
        }
