"""Routine-builder tool: Gemini proposes AM/PM steps; every product reference is validated against the search index, so a
proposal can only point at a listing that exists. Twin of src/chat/local/tools/routine.ts — the result is also surfaced to
the UI as a `tool_payload` event and lands as PENDING proposals, never as accepted steps."""
from __future__ import annotations

import re

from .base import Tool, ToolContext, ToolError, category_ids

SLOTS = ("am", "pm")
DAYS = ("mon", "tue", "wed", "thu", "fri", "sat", "sun")
ZONES = ("face", "body", "scalp", "lengths", "beard")
MAX_STEPS = 16


def parse_days(value: object) -> list[str]:
    """Days arrive as 'mon,wed,fri', 'daily' or a list (a plain string keeps the tool schema small enough for Gemini); unknown tokens are dropped."""
    parts = [str(x).lower() for x in value] if isinstance(value, list) else re.split(r"[\s,/;]+", str(value or "").lower())
    if any(p in ("daily", "everyday", "all") for p in parts):
        return list(DAYS)
    return [d for d in DAYS if any(p[:3] == d for p in parts)]


PROPOSE_TOOL = "propose_routine_steps"


def _s(value: object) -> str:
    return value.strip() if isinstance(value, str) else ""


class ProposeRoutineSteps(Tool):
    name = PROPOSE_TOOL
    surface = True
    description = (
        "Propose steps for the user's weekly AM/PM routine ('My routine' page). Each step names the action (e.g. 'Cleanse', "
        "'Vitamin C serum', 'Sunscreen'), the slot, the days it applies to, the zone, the site category and optionally ONE "
        "listing id taken from get_top_products / search_products results in this conversation. Every product id is checked "
        "against the dataset: unknown ids are rejected and reported back. Proposals are shown to the user as pending "
        "suggestions they accept, edit or reject — nothing is added to their routine by this call. Call it once with the full "
        "set of steps rather than once per step."
    )

    def parameters(self, manifest: dict) -> dict:
        return {
            "type": "object",
            "properties": {
                "steps": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string", "description": "Short step name, e.g. 'Cleanse', 'Retinol', 'Moisturise', 'Scalp serum'"},
                            "slot": {"type": "string", "enum": list(SLOTS), "description": "am = morning, pm = night"},
                            "days": {"type": "string", "description": "Comma-separated weekdays this step applies to, from mon,tue,wed,thu,fri,sat,sun — or 'daily' for every day; e.g. 'mon,wed,fri' for alternate-night actives"},
                            "zone": {"type": "string", "enum": list(ZONES)},
                            "category": {"type": "string", "description": "Site category id exactly as returned by list_categories / get_top_products (one of: " + ", ".join(category_ids(manifest)) + ")"},
                            "product_id": {"type": "string", "nullable": True, "description": "Listing id from a tool result in this conversation, or null when the user should pick a product later"},
                            "why": {"type": "string", "description": "One sentence: why this step / this pick, plain words, no marketing"},
                        },
                        "required": ["title", "slot", "days", "zone", "category", "why"],
                    },
                },
            },
            "required": ["steps"],
        }

    async def run(self, args: dict, ctx: ToolContext) -> dict:
        manifest = await ctx.store.ensure_fresh()
        raw = args.get("steps")
        if not isinstance(raw, list) or not raw:
            raise ToolError("steps must be a non-empty array")
        known = set(category_ids(manifest))
        accepted: list[dict] = []
        rejected: list[dict] = []
        for entry in raw[:MAX_STEPS]:
            s = entry if isinstance(entry, dict) else {}
            title, slot, zone = _s(s.get("title")), _s(s.get("slot")), _s(s.get("zone"))
            category = _s(s.get("category")) or None
            days = parse_days(s.get("days"))
            problems: list[str] = []
            if not title:
                problems.append("missing title")
            if slot not in SLOTS:
                problems.append(f"slot must be am or pm (got '{slot}')")
            if zone not in ZONES:
                problems.append(f"zone must be one of {'/'.join(ZONES)} (got '{zone}')")
            if not days:
                problems.append("days is empty")
            if category and category not in known:
                problems.append(f"unknown category '{category}'")
            product_id = _s(s.get("product_id")) or None
            product: dict | None = None
            if product_id and not problems:
                hit = ctx.store.index.get(product_id, category)
                if hit is None:
                    problems.append(f"no listing with id '{product_id}' in the dataset — use an id returned by a tool, or leave product_id null")
                elif category and hit.category != category:
                    problems.append(f"listing '{product_id}' is ranked in {hit.category}, not {category}")
                else:
                    product = {
                        "id": hit.id, "category": hit.category, "brand": hit.brand, "title": hit.title, "rank": hit.rank,
                        "of": (ctx.store.category_meta(hit.category) or {}).get("count"), "score": hit.score, "priceInr": hit.price,
                        "store": hit.store, "inciStatus": hit.inci, "inciSourceKind": hit.inci_source, "url": ctx.product_url(hit.category, hit.id),
                    }
            if problems:
                rejected.append({"title": title or "(untitled)", "reasons": problems})
            else:
                accepted.append({"title": title, "slot": slot, "days": days, "zone": zone, "category": category, "product": product, "why": _s(s.get("why"))})
        return {
            "proposed": len(accepted), "rejected": len(rejected), "steps": accepted, "problems": rejected,
            "note": (
                "These steps are now shown to the user as pending suggestions on the My routine page; they decide what to accept. "
                "Summarise the plan briefly in your answer and mention anything you could not fill."
                if accepted else
                "Nothing could be proposed — fix the problems and call again, or explain to the user what is missing."
            ),
        }
