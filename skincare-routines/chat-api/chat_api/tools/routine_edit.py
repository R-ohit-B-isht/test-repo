"""Routine-editing tool: Gemini reads the user's saved steps from the page context (`routineSteps`) and proposes changes
to them — swap the product, move days/slot, reorder within the slot, retitle, remove, set / change / stop a weekly rotation, or note
whether the product is with the user. Step ids must be ones the page listed and product ids must exist in the search index. Twin of src/chat/local/tools/routineEdit.ts — surfaced as a `tool_payload` and shown as PENDING
before/after diffs; nothing is changed by this call."""
from __future__ import annotations

from .base import Tool, ToolContext, ToolError
from .routine import SLOTS, parse_days

OPS = ("replace", "move", "update", "remove", "reorder", "rotate", "stop_rotation", "owned")
MAX_EDITS = 16
# Mirrors MAX_ALTERNATIVES (5) in src/schedule/rotation.ts: the step itself plus up to five alternatives.
MAX_OPTIONS = 6

EDIT_TOOL = "edit_routine_steps"


def _s(value: object) -> str:
    return value.strip() if isinstance(value, str) else ""


def _step_line(step: dict) -> str:
    product = step.get("product")
    prod = f" · {product.get('brand')} {product.get('title')}" if isinstance(product, dict) else ""
    pos = f" #{step['position']}" if isinstance(step.get("position"), int) else ""
    return f"{step.get('id')}: {step.get('title')} ({str(step.get('slot', '')).upper()}{pos} · {'/'.join(map(str, step.get('days') or []))} · {step.get('zone')}{prod})"


def _slot_size(steps: list[dict], target: dict, slot: str) -> int:
    """How many steps the slot holds after the edit — the target counts once, wherever it ends up."""
    return sum(1 for s in steps if s.get("slot") == slot and s.get("id") != target.get("id")) + 1


def _check_position(raw: object, steps: list[dict], target: dict, slot: str, alone: bool, problems: list[str]) -> int | None:
    """1-based place within `slot`; a position equal to the current one is kept when other edits ride along (re-sequencing a
    whole slot needs every step pinned) and only refused on its own."""
    n: int | None = None
    if isinstance(raw, bool):
        n = None
    elif isinstance(raw, int):
        n = raw
    elif isinstance(raw, float) and raw.is_integer():
        n = int(raw)
    elif isinstance(raw, str) and raw.strip().isdigit():
        n = int(raw.strip())
    if n is None or n < 1:
        problems.append(f"position must be a whole number from 1 (got '{raw}')")
        return None
    size = _slot_size(steps, target, slot)
    if n > size:
        problems.append(f"position {n} is past the end — the {slot.upper()} slot will have {size} step{'' if size == 1 else 's'}")
        return None
    if alone and slot == target.get("slot") and n == target.get("position"):
        problems.append(f"this step is already #{n} in the {slot.upper()} slot")
        return None
    return n


def _pinned(ctx: ToolContext, hit) -> dict:
    return {
        "id": hit.id, "category": hit.category, "brand": hit.brand, "title": hit.title, "rank": hit.rank,
        "of": (ctx.store.category_meta(hit.category) or {}).get("count"), "score": hit.score, "priceInr": hit.price,
        "store": hit.store, "inciStatus": hit.inci, "inciSourceKind": hit.inci_source, "url": ctx.product_url(hit.category, hit.id),
    }


def _check_active(raw: object, total: int, problems: list[str]) -> int | None:
    if raw is None or raw == "":
        return None
    n: int | None = None
    if isinstance(raw, bool):
        n = None
    elif isinstance(raw, int):
        n = raw
    elif isinstance(raw, float) and raw.is_integer():
        n = int(raw)
    elif isinstance(raw, str) and raw.strip().isdigit():
        n = int(raw.strip())
    if n is None or n < 1 or n > total:
        problems.append(f"active must be an option number from 1 to {total} (got '{raw}')")
        return None
    return n


def _parse_option(o: object) -> tuple[str, str]:
    """One option as the model sends it: the flat string 'Title = product_id' (a nested object schema pushes Gemini's
    forced-tool-call grammar past its state limit), or the same as an object. Returns (title, product_id)."""
    if isinstance(o, str):
        title, sep, pid = o.rpartition("=")
        return (title.strip(), pid.strip()) if sep else (o.strip(), "")
    opt = o if isinstance(o, dict) else {}
    return _s(opt.get("title")), _s(opt.get("product_id"))


def _check_options(raw: object, target: dict, ctx: ToolContext, problems: list[str]) -> list[dict] | None:
    """The whole weekly cycle in week order: each option a title plus a real listing ('current' keeps this week's product,
    'none' means no product); the same listing may not appear twice."""
    if not isinstance(raw, list) or not raw:
        return None
    if len(raw) < 2:
        problems.append(f"a rotation needs at least 2 options (got {len(raw)}) — one per week, in order")
        return None
    if len(raw) > MAX_OPTIONS:
        problems.append(f"a rotation holds at most {MAX_OPTIONS} options (got {len(raw)})")
        return None
    out: list[dict] = []
    seen: set[str] = set()
    target_category = target.get("category") if isinstance(target.get("category"), str) else None
    target_product = target.get("product") if isinstance(target.get("product"), dict) else None
    for i, o in enumerate(raw):
        title, pid = _parse_option(o)
        product: dict | None = None
        category = target_category
        note = ""
        if not pid:
            problems.append(f"option {i + 1}: write it as 'Title = product_id' ('current' keeps this week's product, 'none' = no product)")
        if pid.lower() == "current":
            note = _s(target.get("note"))
            if not target_product:
                problems.append(f"option {i + 1}: the step has no product this week to keep as 'current'")
            else:
                hit = ctx.store.index.get(str(target_product.get("id")), target_category)
                if hit is None:
                    problems.append(f"option {i + 1}: this week's listing is no longer in the dataset")
                else:
                    product = _pinned(ctx, hit)
                    category = hit.category
        elif pid and pid.lower() != "none":
            hit = ctx.store.index.get(pid, target_category)
            if hit is None:
                problems.append(f"option {i + 1}: no listing with id '{pid}' in the dataset — use an id returned by a tool")
            else:
                product = _pinned(ctx, hit)
                category = hit.category
                title = title or str((ctx.store.category_meta(hit.category) or {}).get("label") or "")
        if product and product["id"] in seen:
            problems.append(f"option {i + 1}: listing '{product['id']}' is already another option — each week needs a different product")
        if product:
            seen.add(product["id"])
        if not title:
            problems.append(f"option {i + 1}: needs a short title (e.g. 'Retinol')")
        out.append({"title": title, "category": category, "product": product, "note": note})
    return None if problems else out


class EditRoutineSteps(Tool):
    name = EDIT_TOOL
    surface = True
    description = (
        "Change steps that are ALREADY in the user's saved routine (listed in the page context with their step ids). Use it when "
        "the user asks to swap a product, move a step to other days or the other slot, change the order steps are applied in, rename it, change its note, remove it, "
        "rotate products on it week by week, or note that they have / do not have a product. "
        "op 'replace' needs product_id (a listing id from get_top_products / search_products in this conversation — never "
        "invented) or the word 'none' to unpin the listing and keep the step; 'move' needs days and/or slot; 'reorder' needs "
        "position — the 1-based place within the step's AM or PM slot (the context shows each step's current #position; usual "
        "order is cleanse → exfoliant → toner → essence → serums → eye → moisturiser → oil → sunscreen last in the morning); 'update' takes any "
        "of title, note, days, slot, position, product_id; 'remove' deletes the step and needs nothing else. To re-sequence a whole "
        "slot, send one reorder per step in ascending position order (1, 2, 3…). "
        f"'rotate' sets a WEEKLY cycle on one step (one option per calendar week, Mon–Sun, then back to option 1): options = the whole cycle in week order, 2 to {MAX_OPTIONS} strings, each 'Title = product_id' ('current' = the product the step has this week, 'none' = no product, e.g. 'Azelaic acid = current', 'Retinol = minimalist-itm…'); active = which option (1-based) is on THIS week (default 1). "
        "To only change which option is on this week of an existing rotation, send 'rotate' with just active. 'stop_rotation' ends the cycle and keeps one option as the step (active = which, default 1). "
        "'owned' needs have: true when the user has the step's pinned product with them, false when they do not (ran out, not bought yet) — a shelf note, the step stays. "
        "Every change is shown to the user as a before/after diff they accept or reject — this call changes "
        "nothing by itself. To ADD new steps use propose_routine_steps instead. Call once with all the edits."
    )

    def parameters(self, manifest: dict) -> dict:
        return {
            "type": "object",
            "properties": {
                "edits": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "step_id": {"type": "string", "description": "Id of a step exactly as listed in the page context"},
                            "op": {"type": "string", "enum": list(OPS)},
                            "product_id": {"type": "string", "nullable": True, "description": "Listing id from a tool result in this conversation, or 'none' to unpin the product (for 'replace' / 'update')"},
                            "days": {"type": "string", "nullable": True, "description": "Comma-separated weekdays from mon,tue,wed,thu,fri,sat,sun or 'daily' (for 'move' / 'update')"},
                            "slot": {"type": "string", "nullable": True, "enum": list(SLOTS), "description": "am or pm (for 'move' / 'update')"},
                            "position": {"type": "integer", "nullable": True, "description": "1-based place within the slot the step ends up in — 1 goes on first, the slot's step count goes on last (for 'reorder' / 'move' / 'update')"},
                            "title": {"type": "string", "nullable": True, "description": "New short step name (for 'update')"},
                            "note": {"type": "string", "nullable": True, "description": "New note shown under the step (for 'update')"},
                            "options": {
                                "type": "array", "nullable": True,
                                "description": f"The whole weekly cycle in week order, 2–{MAX_OPTIONS} strings 'Title = product_id' — listing id from a tool result, 'current' for this week's product, or 'none' (for 'rotate'; omit to keep the cycle and only change active)",
                                "items": {"type": "string"},
                            },
                            "active": {"type": "integer", "nullable": True, "description": "1-based option that is on this week (for 'rotate'), or the option to keep as the step (for 'stop_rotation')"},
                            "have": {"type": "boolean", "nullable": True, "description": "For 'owned': true = the user has this step's product with them, false = they do not"},
                            "why": {"type": "string", "description": "One sentence: why this change, plain words, no marketing"},
                        },
                        "required": ["step_id", "op", "why"],
                    },
                },
            },
            "required": ["edits"],
        }

    async def run(self, args: dict, ctx: ToolContext) -> dict:
        await ctx.store.ensure_fresh()
        raw = args.get("edits")
        if not isinstance(raw, list) or not raw:
            raise ToolError("edits must be a non-empty array")
        steps = [s for s in (ctx.page.get("routineSteps") or []) if isinstance(s, dict) and isinstance(s.get("id"), str)]
        if not steps:
            raise ToolError("The user has no saved routine steps to edit — offer to build one with propose_routine_steps instead.")
        by_id = {s["id"]: s for s in steps}
        accepted: list[dict] = []
        rejected: list[dict] = []
        owned_seen: set[str] = set()
        for entry in raw[:MAX_EDITS]:
            e = entry if isinstance(entry, dict) else {}
            step_id, op = _s(e.get("step_id")), _s(e.get("op"))
            target = by_id.get(step_id)
            problems: list[str] = []
            if target is None:
                problems.append(f"no step with id '{step_id}' in the routine — the steps are: {'; '.join(_step_line(s) for s in steps)}")
            if op not in OPS:
                problems.append(f"op must be one of {'/'.join(OPS)} (got '{op}')")
            after: dict = {}
            if target is not None and op == "owned":
                have = e.get("have")
                product = target.get("product") if isinstance(target.get("product"), dict) else None
                if not isinstance(have, bool):
                    problems.append("'owned' needs have: true or false")
                elif not product:
                    problems.append("this step has no product pinned, so there is nothing to mark on the shelf")
                elif target.get("withMe") == have:
                    problems.append(f"{product.get('brand')} {product.get('title')} is already marked {'with me' if have else 'not with me'}")
                elif str(product.get("id")) in owned_seen:
                    problems.append("this product is already covered by another edit in this call")
                else:
                    after["owned"] = have
                    owned_seen.add(str(product.get("id")))
            elif target is not None and op in ("rotate", "stop_rotation"):
                rotation = target.get("rotation") if isinstance(target.get("rotation"), dict) else None
                total = len(rotation.get("options") or []) if rotation else 1
                raw_options = e.get("options")
                if op == "stop_rotation":
                    if not rotation:
                        problems.append("this step does not rotate")
                    else:
                        active = _check_active(e.get("active"), total, problems)
                        if not problems:
                            after["rotation"] = {"active": active or 1}
                elif isinstance(raw_options, list) and raw_options:
                    options = _check_options(raw_options, target, ctx, problems)
                    active = _check_active(e.get("active"), len(raw_options), problems)
                    if options:
                        after["rotation"] = {"options": options, "active": active or 1}
                elif not rotation:
                    problems.append(f"'rotate' needs options — the whole cycle in week order (2 to {MAX_OPTIONS} options)")
                else:
                    active = _check_active(e.get("active"), total, problems)
                    if active is None and not problems:
                        problems.append("send options for a new cycle, or active to change which option is on this week")
                    elif active == rotation.get("active"):
                        problems.append(f"option {active} is already the one on this week")
                    elif active is not None:
                        after["rotation"] = {"active": active}
            elif target is not None and op in OPS and op != "remove":
                product_id, days_raw, slot, title = _s(e.get("product_id")), _s(e.get("days")), _s(e.get("slot")), _s(e.get("title"))
                note = e.get("note").strip() if isinstance(e.get("note"), str) else None
                if op == "replace" and not product_id:
                    problems.append("'replace' needs product_id")
                has_position = e.get("position") not in (None, "")
                if op == "move" and not days_raw and not slot:
                    problems.append("'move' needs days and/or slot")
                if op == "reorder" and not has_position:
                    problems.append("'reorder' needs position")
                if product_id and product_id.lower() == "none":
                    if not target.get("product"):
                        problems.append("this step has no product to unpin")
                    else:
                        after["product"] = None
                elif product_id:
                    category = target.get("category") if isinstance(target.get("category"), str) else None
                    hit = ctx.store.index.get(product_id, category)
                    current = target.get("product")
                    if hit is None:
                        problems.append(f"no listing with id '{product_id}' in the dataset — use an id returned by a tool")
                    elif isinstance(current, dict) and current.get("id") == hit.id:
                        problems.append(f"listing '{product_id}' is already the product on this step")
                    else:
                        after["category"] = hit.category
                        after["product"] = {
                            "id": hit.id, "category": hit.category, "brand": hit.brand, "title": hit.title, "rank": hit.rank,
                            "of": (ctx.store.category_meta(hit.category) or {}).get("count"), "score": hit.score, "priceInr": hit.price,
                            "store": hit.store, "inciStatus": hit.inci, "inciSourceKind": hit.inci_source, "url": ctx.product_url(hit.category, hit.id),
                        }
                if days_raw:
                    days = parse_days(days_raw)
                    if not days:
                        problems.append(f"days '{days_raw}' names no weekday")
                    else:
                        after["days"] = days
                if slot:
                    if slot not in SLOTS:
                        problems.append(f"slot must be am or pm (got '{slot}')")
                    else:
                        after["slot"] = slot
                if title:
                    after["title"] = title
                if note:
                    after["note"] = note
                if has_position:
                    alone = len(raw) == 1 and not after
                    position = _check_position(e.get("position"), steps, target, after.get("slot") or str(target.get("slot", "")), alone, problems)
                    if position is not None:
                        after["position"] = position
                if not problems and not after:
                    problems.append("the edit changes nothing")
            if problems:
                rejected.append({"step_id": step_id, "title": (target or {}).get("title", "(unknown step)"), "reasons": problems})
            else:
                accepted.append({"step_id": step_id, "op": op, "before": target, "after": after, "why": _s(e.get("why"))})
        return {
            "edited": len(accepted), "rejected": len(rejected), "edits": accepted, "problems": rejected,
            "note": (
                "These changes are now shown to the user as pending before/after diffs on the My routine page; nothing is applied "
                "until they accept. Say what you changed in one or two lines and mention anything you could not do."
                if accepted else
                "Nothing could be proposed — fix the problems and call again, or explain to the user what is missing."
            ),
        }
