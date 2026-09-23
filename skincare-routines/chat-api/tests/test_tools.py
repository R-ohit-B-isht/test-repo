"""Tools over the store: manifest-derived declarations, evidence preservation, explicit no-match / error states."""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from chat_api.data.store import LedgerStore
from chat_api.tools.base import ToolContext
from chat_api.tools.registry import ToolRegistry

@pytest.fixture()
async def ctx(store: LedgerStore) -> ToolContext:
    await store.ensure_fresh()
    return ToolContext(store=store, site_url="https://example.test", page={})


async def test_declarations_follow_manifest_version(store: LedgerStore, small_dataset: Path, add_category):
    manifest = await store.ensure_fresh()
    reg = ToolRegistry()
    decls = reg.declarations(manifest)
    by_name = {d["name"]: d for d in decls}
    assert set(by_name) >= {"get_site_overview", "list_categories", "search_products", "get_top_products", "get_product", "get_reference_ceiling", "compare_products", "get_scoring_method", "get_routines", "get_category_filters"}
    assert set(by_name["get_top_products"]["parameters"]["properties"]["category"]["enum"]) == {"scalpscrub", "kp", "bodyscrub"}
    assert reg.declarations(manifest) is decls

    add_category(small_dataset)
    manifest2 = await store.ensure_fresh(force=True)
    enum2 = {d["name"]: d for d in reg.declarations(manifest2)}["get_top_products"]["parameters"]["properties"]["category"]["enum"]
    assert "calmserum" in enum2


async def test_top_products_preserve_rank_score_and_inci_state(ctx: ToolContext):
    reg = ToolRegistry()
    result, _ = await reg.execute("get_top_products", {"category": "kp", "limit": 3}, ctx)
    assert result["totalInCategory"] == result["matching"] == ctx.store.category_meta("kp")["count"]
    rows = result["results"]
    assert [r["rank"] for r in rows] == [1, 2, 3]
    assert rows[0]["score"] >= rows[1]["score"] >= rows[2]["score"]
    for r in rows:
        assert set(r) >= {"id", "brand", "title", "score", "breakdown", "priceInr", "store", "inci", "url"}
        assert r["url"] == f"https://example.test/#/c/kp?open={r['id']}"


async def test_get_product_keeps_provenance_and_separates_claims(ctx: ToolContext):
    reg = ToolRegistry()
    top, _ = await reg.execute("get_top_products", {"category": "kp", "tags": ["inci:full"], "limit": 1}, ctx)
    pid = top["results"][0]["id"]
    product, _ = await reg.execute("get_product", {"product_id": pid}, ctx)
    ev = product["detail"]["evidence"]
    assert ev["inciStatus"] == "full"
    assert ev["inciSourceKind"] in {"listing", "brand-site", "secondary"}
    if ev["inciSourceKind"] != "listing":
        assert ev["inciSourceUrl"] and ev["inciMatchedOfficialTitle"]
    assert "sellerClaimsShownNotScored" in product["detail"]
    assert "scored" in ev["inciStatusMeaning"]


async def test_unscored_product_says_so(ctx: ToolContext):
    reg = ToolRegistry()
    top, _ = await reg.execute("get_top_products", {"category": "kp", "tags": ["inci:none"], "limit": 1}, ctx)
    product, _ = await reg.execute("get_product", {"product_id": top["results"][0]["id"]}, ctx)
    ev = product["detail"]["evidence"]
    assert ev["inciStatus"] == "none" and "NOT scored" in ev["inciStatusMeaning"]
    assert product["breakdown"]["ingredients"] == 0 and product["breakdown"]["skin"] == 0


async def test_search_no_match_is_empty_and_explicit(ctx: ToolContext):
    reg = ToolRegistry()
    result, _ = await reg.execute("search_products", {"query": "zzqx nonexistent product"}, ctx)
    assert result["count"] == 0 and result["results"] == []
    assert "no" in result["note"].lower()


async def test_unknown_tag_and_category_are_tool_errors(ctx: ToolContext):
    reg = ToolRegistry()
    bad_tag, _ = await reg.execute("get_top_products", {"category": "kp", "tags": ["nonsense:tag"]}, ctx)
    assert "error" in bad_tag and "get_category_filters" in bad_tag["error"]
    bad_cat, _ = await reg.execute("get_top_products", {"category": "calmserum"}, ctx)
    assert "error" in bad_cat
    unknown, _ = await reg.execute("no_such_tool", {}, ctx)
    assert "error" in unknown


async def test_reference_ceiling_is_separate_from_ranking(ctx: ToolContext):
    reg = ToolRegistry()
    bench, _ = await reg.execute("get_reference_ceiling", {"category": "kp"}, ctx)
    assert "NOT a marketplace listing score" in bench["role"]
    assert bench["makerPage"]["url"].startswith("http")
    assert bench["marketplaceStatus"] in {"found", "related", "unavailable", "not-sold", "missing", None} or isinstance(bench["marketplaceStatus"], str)
    if bench.get("marketplaceListing"):
        assert "identity" in bench["marketplaceListing"]


async def test_compare_keeps_valid_rows_when_one_id_is_bad(ctx: ToolContext):
    reg = ToolRegistry()
    top, _ = await reg.execute("get_top_products", {"category": "scalpscrub", "limit": 1}, ctx)
    result, _ = await reg.execute("compare_products", {"product_ids": [top["results"][0]["id"], "bogus-id"]}, ctx)
    rows = result["products"]
    assert rows[0]["id"] == top["results"][0]["id"] and "score" in rows[0]
    assert rows[1] == {"id": "bogus-id", "error": rows[1]["error"]} and "No listing" in rows[1]["error"]


async def test_overview_and_method_reflect_manifest(ctx: ToolContext):
    reg = ToolRegistry()
    overview, _ = await reg.execute("get_site_overview", {}, ctx)
    assert overview["totalListings"] == ctx.store.manifest["total"]
    assert overview["generatedAt"] == "2026-01-01T00:00:00.000Z"
    method, _ = await reg.execute("get_scoring_method", {}, ctx)
    assert method["weights"] == ctx.store.manifest["weights"]
    assert any("score 0" in rule or "0" in rule for rule in method["rules"])


async def test_routines_read_real_file(ctx: ToolContext):
    reg = ToolRegistry()
    result, _ = await reg.execute("get_routines", {"query": "xxxx-no-such-routine"}, ctx)
    assert result["count"] == 0 and result["routines"] == []
    all_r, _ = await reg.execute("get_routines", {}, ctx)
    assert all_r["count"] > 0


async def test_listing_ranked_in_two_categories_resolves_to_page_category(ctx: ToolContext):
    """The same marketplace listing is ranked in scalp scrub AND body scrub; the rank reported must follow the category asked for."""
    scalp_cat, body_cat = await ctx.store.category("scalpscrub"), await ctx.store.category("bodyscrub")
    shared = sorted(set(scalp_cat.pos_of) & set(body_cat.pos_of))
    assert shared, "fixture categories should share at least one real listing"
    pid = shared[0]
    assert len(ctx.store.index.placements(pid)) == 2
    reg = ToolRegistry()
    on_body = ToolContext(store=ctx.store, site_url=ctx.site_url, page={"category": {"id": "bodyscrub"}})
    body, _ = await reg.execute("get_product", {"product_id": pid}, on_body)
    scalp, _ = await reg.execute("get_product", {"product_id": pid, "category": "scalpscrub"}, on_body)
    assert body["category"] == "bodyscrub" and scalp["category"] == "scalpscrub"
    assert body["of"] == ctx.store.category_meta("bodyscrub")["count"] and scalp["of"] == ctx.store.category_meta("scalpscrub")["count"]
    assert [r["category"] for r in body["alsoRankedIn"]] == ["scalpscrub"]
    assert body["alsoRankedIn"][0]["rank"] == scalp["rank"] and body["url"].startswith("https://example.test/#/c/bodyscrub?open=")
    compared, _ = await reg.execute("compare_products", {"product_ids": [pid, shared[-1]], "category": "scalpscrub"}, on_body)
    assert {r["category"] for r in compared["products"]} == {"scalpscrub"}


async def test_ingredient_knowledge_resolves_pairing_with_sources(ctx: ToolContext):
    reg = ToolRegistry()
    result, _ = await reg.execute("get_ingredient_knowledge", {"ingredients": ["retinol", "BHA"]}, ctx)
    assert [i["family"] for i in result["ingredients"]] == ["retinoid", "bha"]
    assert result["notInKnowledgeBase"] == []
    pair = result["pairingsBetweenAsked"]
    assert len(pair) == 1 and pair[0]["verdict"] == "caution"
    assert pair[0]["sources"] and all(s["url"].startswith("http") for s in pair[0]["sources"])
    assert result["otherPairings"] == []
    retinoid = result["ingredients"][0]
    assert retinoid["actives"] and all(a["source"]["url"] for a in retinoid["actives"])
    assert retinoid["usage"]
    assert all(r["category"] in {"scalpscrub", "kp", "bodyscrub"} or r["listings"] is None for r in retinoid["rankedIn"])


async def test_ingredient_knowledge_single_ingredient_lists_all_pairings_and_flags(ctx: ToolContext):
    reg = ToolRegistry()
    result, _ = await reg.execute("get_ingredient_knowledge", {"ingredients": ["Vitamin C", "fragrance", "unobtainium"]}, ctx)
    assert [i["family"] for i in result["ingredients"]] == ["vitc"]
    assert result["notInKnowledgeBase"] == ["fragrance", "unobtainium"]
    assert result["pairingsBetweenAsked"] == []
    verdicts = [p["verdict"] for p in result["otherPairings"]]
    assert verdicts == sorted(verdicts, key=["avoid", "caution", "essential", "synergy", "fine"].index)
    assert any(f["id"] == "fragrance" for f in result["safetyFlags"])
    err, _ = await reg.execute("get_ingredient_knowledge", {"ingredients": []}, ctx)
    assert "error" in err


async def test_propose_routine_steps_validates_every_product_reference(ctx: ToolContext):
    reg = ToolRegistry()
    assert reg.surfaces("propose_routine_steps") and not reg.surfaces("get_product")
    top, _ = await reg.execute("get_top_products", {"category": "kp", "limit": 1}, ctx)
    real = top["results"][0]
    result, _ = await reg.execute("propose_routine_steps", {"steps": [
        {"title": "KP lotion", "slot": "pm", "days": ["mon", "wed", "fri", "wed"], "zone": "body", "category": "kp", "product_id": real["id"], "why": "urea + lactic acid"},
        {"title": "Cleanse", "slot": "am", "days": "daily", "zone": "body", "category": "bodyscrub", "product_id": None, "why": "pick later"},
        {"title": "Made up", "slot": "pm", "days": ["sun"], "zone": "body", "category": "kp", "product_id": "not-a-real-id", "why": "invented"},
        {"title": "Wrong category", "slot": "pm", "days": ["sun"], "zone": "body", "category": "bodyscrub", "product_id": real["id"], "why": "misfiled"},
        {"title": "Bad slot", "slot": "noon", "days": [], "zone": "face", "category": "kp", "why": "x"},
    ]}, ctx)
    assert result["proposed"] == 2 and result["rejected"] == 3
    ok = result["steps"]
    assert ok[0]["days"] == ["mon", "wed", "fri"]
    assert ok[1]["days"] == ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    assert ok[0]["product"]["id"] == real["id"] and ok[0]["product"]["rank"] == real["rank"] and ok[0]["product"]["of"] == real["of"]
    assert ok[0]["product"]["inciStatus"] == real["inciStatus"]
    assert ok[1]["product"] is None
    reasons = " ".join(" ".join(p["reasons"]) for p in result["problems"])
    assert "not-a-real-id" in reasons and "ranked in kp, not bodyscrub" in reasons and "slot must be am or pm" in reasons and "days is empty" in reasons


async def test_review_routine_plan_keeps_only_known_pick_ids(ctx: ToolContext):
    reg = ToolRegistry()
    assert reg.surfaces("review_routine_plan")
    top, _ = await reg.execute("get_top_products", {"category": "kp", "limit": 1}, ctx)
    real = top["results"][0]["id"]
    result, _ = await reg.execute("review_routine_plan", {"notes": [
        {"step": "urea20:pm", "why": "20% urea is body strength", "pick_id": real},
        {"step": "retinol:pm", "why": "alternate nights", "pick_id": "not-a-real-id"},
        {"step": "Retinol at night", "why": "bad id"},
        {"step": "sunscreen:am", "why": ""},
    ], "warnings": ["Retinol and glycolic share no night — good.", ""]}, ctx)
    assert result["noted"] == 2
    assert result["notes"][0]["pickId"] == real and result["notes"][1]["pickId"] is None
    assert result["warnings"] == ["Retinol and glycolic share no night — good."]
    joined = " ".join(result["problems"])
    assert "not-a-real-id" in joined and "not a step id" in joined and "empty note" in joined
    err, _ = await reg.execute("review_routine_plan", {"notes": [], "warnings": []}, ctx)
    assert "error" in err


async def test_edit_routine_steps_binds_to_page_steps_and_real_listings(ctx: ToolContext):
    reg = ToolRegistry()
    assert reg.surfaces("edit_routine_steps")
    top, _ = await reg.execute("get_top_products", {"category": "kp", "limit": 2}, ctx)
    current, other = top["results"][0], top["results"][1]
    page = {"routineSteps": [
        {"id": "s1", "title": "KP lotion", "slot": "pm", "days": ["mon", "wed"], "zone": "body", "category": "kp", "note": "", "product": {"id": current["id"], "category": "kp", "brand": current["brand"], "title": current["title"], "rank": current["rank"]}},
        {"id": "s2", "title": "Cleanse", "slot": "am", "days": ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], "zone": "body", "category": "bodyscrub", "note": "", "product": None},
    ]}
    ctx2 = ToolContext(store=ctx.store, site_url=ctx.site_url, page=page)
    result, _ = await reg.execute("edit_routine_steps", {"edits": [
        {"step_id": "s1", "op": "replace", "product_id": other["id"], "why": "cheaper"},
        {"step_id": "s2", "op": "move", "slot": "pm", "days": "tue, thu", "why": "night"},
        {"step_id": "s2", "op": "remove", "why": "not needed"},
        {"step_id": "s1", "op": "replace", "product_id": "not-a-real-id", "why": "invented"},
        {"step_id": "s1", "op": "replace", "product_id": current["id"], "why": "same"},
        {"step_id": "nope", "op": "remove", "why": "stale"},
        {"step_id": "s2", "op": "move", "why": "nothing given"},
        {"step_id": "s1", "op": "replace", "product_id": "none", "why": "keep the step, drop the pin"},
        {"step_id": "s2", "op": "update", "product_id": "none", "why": "nothing pinned here"},
    ]}, ctx2)
    assert result["edited"] == 4 and result["rejected"] == 5
    assert result["edits"][3]["after"] == {"product": None}
    ok = result["edits"]
    assert ok[0]["op"] == "replace" and ok[0]["after"]["product"]["id"] == other["id"] and ok[0]["after"]["category"] == "kp"
    assert ok[0]["before"]["id"] == "s1" and ok[0]["before"]["product"]["id"] == current["id"]
    assert ok[1]["after"] == {"slot": "pm", "days": ["tue", "thu"]}
    assert ok[2]["op"] == "remove" and ok[2]["after"] == {}
    reasons = " ".join(" ".join(p["reasons"]) for p in result["problems"])
    assert "not-a-real-id" in reasons and "already the product" in reasons and "no step with id 'nope'" in reasons and "needs days and/or slot" in reasons and "no product to unpin" in reasons
    err, _ = await reg.execute("edit_routine_steps", {"edits": [{"step_id": "s1", "op": "remove", "why": "x"}]}, ctx)
    assert "no saved routine steps" in err["error"]


async def test_edit_routine_steps_reorders_within_a_slot(ctx: ToolContext):
    reg = ToolRegistry()
    daily = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    page = {"routineSteps": [
        {"id": "t", "title": "Toner", "slot": "am", "position": 1, "days": daily, "zone": "face", "category": "toner", "note": "", "product": None},
        {"id": "c", "title": "Cleanser", "slot": "am", "position": 2, "days": daily, "zone": "face", "category": "facewash", "note": "", "product": None},
        {"id": "s", "title": "Sunscreen", "slot": "am", "position": 3, "days": daily, "zone": "face", "category": "sunscreen", "note": "", "product": None},
        {"id": "m", "title": "Moisturiser", "slot": "am", "position": 4, "days": daily, "zone": "face", "category": "moisturizer", "note": "", "product": None},
        {"id": "r", "title": "Retinol", "slot": "pm", "position": 1, "days": daily, "zone": "face", "category": "retinol", "note": "", "product": None},
    ]}
    ctx2 = ToolContext(store=ctx.store, site_url=ctx.site_url, page=page)
    # cleanser before toner, sunscreen last — preserves everything else
    result, _ = await reg.execute("edit_routine_steps", {"edits": [
        {"step_id": "c", "op": "reorder", "position": 1, "why": "cleanse first"},
        {"step_id": "s", "op": "reorder", "position": 4, "why": "spf last"},
    ]}, ctx2)
    assert result["edited"] == 2 and result["rejected"] == 0
    assert result["edits"][0]["op"] == "reorder" and result["edits"][0]["after"] == {"position": 1}
    assert result["edits"][1]["after"] == {"position": 4}
    assert result["edits"][0]["before"]["slot"] == "am" and result["edits"][0]["before"]["days"] == daily
    # whole-slot re-sequence: a step already at its position is kept when it rides with others
    result, _ = await reg.execute("edit_routine_steps", {"edits": [
        {"step_id": "s", "op": "reorder", "position": 1, "why": "x"},
        {"step_id": "c", "op": "reorder", "position": 2, "why": "x"},
        {"step_id": "t", "op": "reorder", "position": 3, "why": "x"},
        {"step_id": "m", "op": "reorder", "position": 4, "why": "x"},
    ]}, ctx2)
    assert result["edited"] == 4 and [e["after"]["position"] for e in result["edits"]] == [1, 2, 3, 4]
    # invalid: past the end, zero, fraction, missing, no-op on its own, stale id, cross-slot bound
    result, _ = await reg.execute("edit_routine_steps", {"edits": [
        {"step_id": "s", "op": "reorder", "position": 9, "why": "x"},
        {"step_id": "s", "op": "reorder", "position": 0, "why": "x"},
        {"step_id": "s", "op": "reorder", "position": 2.5, "why": "x"},
        {"step_id": "s", "op": "reorder", "why": "x"},
        {"step_id": "nope", "op": "reorder", "position": 1, "why": "x"},
        {"step_id": "r", "op": "move", "slot": "am", "position": 6, "why": "x"},
        {"step_id": "r", "op": "move", "slot": "am", "position": 5, "why": "x"},
    ]}, ctx2)
    assert result["edited"] == 1 and result["rejected"] == 6
    assert result["edits"][0]["after"] == {"slot": "am", "position": 5}
    reasons = " ".join(" ".join(p["reasons"]) for p in result["problems"])
    assert "position 9 is past the end" in reasons and "will have 4 steps" in reasons
    assert "whole number" in reasons and "'reorder' needs position" in reasons and "no step with id 'nope'" in reasons
    assert "position 6 is past the end — the AM slot will have 5 steps" in reasons
    alone, _ = await reg.execute("edit_routine_steps", {"edits": [{"step_id": "s", "op": "reorder", "position": 3, "why": "x"}]}, ctx2)
    assert alone["edited"] == 0 and "already #3 in the AM slot" in alone["problems"][0]["reasons"][0]


async def test_edit_routine_steps_shelf_and_weekly_rotation(ctx: ToolContext):
    reg = ToolRegistry()
    top, _ = await reg.execute("get_top_products", {"category": "kp", "limit": 3}, ctx)
    a, b, c = top["results"][0], top["results"][1], top["results"][2]
    daily = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    pin = {"id": a["id"], "category": "kp", "brand": a["brand"], "title": a["title"], "rank": a["rank"]}
    page = {"routineSteps": [
        {"id": "s1", "title": "KP lotion", "slot": "pm", "position": 1, "days": daily, "zone": "body", "category": "kp", "note": "thin layer", "product": pin, "withMe": True, "rotation": None},
        {"id": "s2", "title": "Cleanse", "slot": "am", "position": 1, "days": daily, "zone": "body", "category": "bodyscrub", "note": "", "product": None, "withMe": None, "rotation": None},
    ]}
    ctx2 = ToolContext(store=ctx.store, site_url=ctx.site_url, page=page)

    # owned: valid, same state, no product, missing have, same product twice
    result, _ = await reg.execute("edit_routine_steps", {"edits": [
        {"step_id": "s1", "op": "owned", "have": False, "why": "ran out"},
        {"step_id": "s1", "op": "owned", "have": True, "why": "same as now"},
        {"step_id": "s2", "op": "owned", "have": False, "why": "no product"},
        {"step_id": "s1", "op": "owned", "why": "no have"},
        {"step_id": "s1", "op": "owned", "have": False, "why": "dup"},
    ]}, ctx2)
    assert result["edited"] == 1 and result["rejected"] == 4
    assert result["edits"][0]["op"] == "owned" and result["edits"][0]["after"] == {"owned": False} and result["edits"][0]["before"]["withMe"] is True
    reasons = " ".join(" ".join(p["reasons"]) for p in result["problems"])
    assert "already marked with me" in reasons and "no product pinned" in reasons and "needs have" in reasons and "already covered by another edit" in reasons

    # rotate: 3-option cycle with 'current' as option 1, active 2
    result, _ = await reg.execute("edit_routine_steps", {"edits": [{"step_id": "s1", "op": "rotate", "active": 2, "why": "alternate", "options": [
        "Lotion A = " + "current", "Lotion B = " + b["id"], "Lotion C = " + c["id"],
    ]}]}, ctx2)
    assert result["edited"] == 1, result["problems"]
    rot = result["edits"][0]["after"]["rotation"]
    assert rot["active"] == 2 and [o["product"]["id"] for o in rot["options"]] == [a["id"], b["id"], c["id"]]
    assert rot["options"][0]["note"] == "thin layer" and rot["options"][1]["note"] == "" and rot["options"][1]["category"] == "kp"
    assert set(rot["options"][1]["product"]) == {"id", "category", "brand", "title", "rank", "of", "score", "priceInr", "store", "inciStatus", "inciSourceKind", "url"}

    # invalid cycles: one option, invented id, duplicate listing, 7 options, active-only without a cycle, stop on a plain step
    result, _ = await reg.execute("edit_routine_steps", {"edits": [
        {"step_id": "s1", "op": "rotate", "options": ["Only = " + b["id"]], "why": "x"},
        {"step_id": "s1", "op": "rotate", "options": ["A = " + b["id"], "B = " + "p-nope"], "why": "x"},
        {"step_id": "s1", "op": "rotate", "options": ["A = " + b["id"], "B = " + b["id"]], "why": "x"},
        {"step_id": "s1", "op": "rotate", "options": [f"O{i} = none" for i in range(7)], "why": "x"},
        {"step_id": "s1", "op": "rotate", "active": 2, "why": "x"},
        {"step_id": "s1", "op": "stop_rotation", "why": "x"},
        {"step_id": "s2", "op": "rotate", "options": ["A = " + "current", "B = " + "none"], "why": "x"},
        {"step_id": "s1", "op": "rotate", "active": 4, "options": ["A = " + "current", "B = " + "none"], "why": "x"},
    ]}, ctx2)
    assert result["edited"] == 0 and result["rejected"] == 8
    reasons = " ".join(" ".join(p["reasons"]) for p in result["problems"])
    assert "at least 2 options" in reasons and "no listing with id 'p-nope'" in reasons and "already another option" in reasons
    assert "at most 6 options" in reasons and "'rotate' needs options" in reasons and "does not rotate" in reasons
    assert "no product this week to keep as 'current'" in reasons and "from 1 to 2" in reasons

    # existing cycle: active-only switch, same active refused, stop keeping option 3
    rotating = dict(page["routineSteps"][0], title="Lotion B", product={"id": b["id"], "category": "kp", "brand": b["brand"], "title": b["title"], "rank": b["rank"]},
                    rotation={"active": 2, "options": [{"title": "Lotion A", "product": pin}, {"title": "Lotion B", "product": None}, {"title": "Lotion C", "product": None}]})
    ctx3 = ToolContext(store=ctx.store, site_url=ctx.site_url, page={"routineSteps": [rotating]})
    result, _ = await reg.execute("edit_routine_steps", {"edits": [
        {"step_id": "s1", "op": "rotate", "active": 3, "why": "C this week"},
        {"step_id": "s1", "op": "rotate", "active": 2, "why": "same"},
        {"step_id": "s1", "op": "rotate", "why": "nothing"},
        {"step_id": "s1", "op": "stop_rotation", "active": 3, "why": "stop"},
        {"step_id": "s1", "op": "stop_rotation", "active": 9, "why": "bad"},
    ]}, ctx3)
    assert result["edited"] == 2 and result["rejected"] == 3
    assert result["edits"][0]["after"] == {"rotation": {"active": 3}} and result["edits"][1]["op"] == "stop_rotation" and result["edits"][1]["after"] == {"rotation": {"active": 3}}
    reasons = " ".join(" ".join(p["reasons"]) for p in result["problems"])
    assert "already the one on this week" in reasons and "send options for a new cycle" in reasons and "from 1 to 3" in reasons


async def test_set_reminders_reads_page_state_and_validates(ctx: ToolContext):
    reg = ToolRegistry()
    assert reg.surfaces("set_reminders")
    err, _ = await reg.execute("set_reminders", {"changes": [{"slot": "pm", "time": "22:00", "why": "x"}]}, ctx)
    assert "not available on this page" in err["error"]
    page = {"routineReminders": {"am": {"enabled": False, "time": "07:30"}, "pm": {"enabled": True, "time": "21:30"}}}
    ctx2 = ToolContext(store=ctx.store, site_url=ctx.site_url, page=page)
    result, _ = await reg.execute("set_reminders", {"changes": [
        {"slot": "pm", "time": "10 pm", "why": "later"},
        {"slot": "am", "enabled": True, "time": "7am", "why": "morning too"},
    ]}, ctx2)
    assert result["problems"] == [] and len(result["changes"]) == 2
    assert result["changes"][0] == {"slot": "pm", "before": {"enabled": True, "time": "21:30"}, "after": {"enabled": True, "time": "22:00"}, "enabled": True, "time": "22:00", "why": "later"}
    assert result["changes"][1]["after"] == {"enabled": True, "time": "07:00"}
    result, _ = await reg.execute("set_reminders", {"changes": [
        {"slot": "pm", "enabled": False, "why": "off"},
        {"slot": "pm", "time": "23:00", "why": "dup slot"},
        {"slot": "noon", "time": "12:00", "why": "bad slot"},
    ]}, ctx2)
    assert len(result["changes"]) == 1 and len(result["problems"]) == 1  # only the first two are read
    assert result["changes"][0]["after"] == {"enabled": False, "time": "21:30"} and "already changed in this call" in result["problems"][0]
    result, _ = await reg.execute("set_reminders", {"changes": [{"slot": "pm", "time": "21:30", "why": "same"}, {"slot": "noon", "time": "12:00", "why": "bad slot"}]}, ctx2)
    assert result["changes"] == [] and "already on at 21:30" in result["problems"][0] and "slot must be am or pm" in result["problems"][1]
    result, _ = await reg.execute("set_reminders", {"changes": [{"slot": "am", "time": "25:99", "why": "x"}, {"slot": "am", "why": "x"}]}, ctx2)
    assert result["changes"] == [] and "not HH:MM" in result["problems"][0] and "needs a time and/or enabled" in result["problems"][1]
    from chat_api.tools.reminders import parse_time
    assert [parse_time(t) for t in ["22:00", "22.00", "2200", "10 pm", "10:30pm", "7am", "12am", "12pm", "0:05", "13pm", "24:00", "x"]] == [
        "22:00", "22:00", "22:00", "22:00", "22:30", "07:00", "00:00", "12:00", "00:05", None, None, None]


@pytest.mark.asyncio
async def test_read_routine_is_exact_and_read_only(ctx: ToolContext):
    reg = ToolRegistry()
    assert "read_routine" in reg.names()
    steps = [
        {"id": "s1", "title": "Cleanser", "slot": "am", "position": 1, "days": ["mon"], "zone": "face", "category": "facewash", "note": "",
         "product": {"id": "p1", "category": "facewash", "brand": "A", "title": "Wash", "rank": 3}, "withMe": False, "rotation": None},
        {"id": "s2", "title": "Retinol", "slot": "pm", "position": 1, "days": ["mon", "thu"], "zone": "face", "category": "retinol", "note": "thin layer",
         "product": {"id": "p2", "category": "retinol", "brand": "B", "title": "Ret", "rank": 1}, "withMe": True,
         "rotation": {"active": 3, "options": [{"title": "Azelaic", "product": None}, {"title": "Lactic", "product": None}, {"title": "Retinol", "product": {"id": "p2", "brand": "B", "title": "Ret"}}]}},
        {"id": "s3", "title": "Toner", "slot": "am", "position": 2, "days": ["mon"], "zone": "face", "category": None, "note": "", "product": None, "withMe": None, "rotation": None},
    ]
    page = {"routineSteps": steps, "routineReminders": {"am": {"enabled": False, "time": "07:30"}, "pm": {"enabled": True, "time": "21:30"}}}
    before = json.dumps(page, sort_keys=True)
    ctx2 = ToolContext(store=ctx.store, site_url=ctx.site_url, page=page)
    out, _ = await reg.execute("read_routine", {}, ctx2)
    assert out["steps"] == 3 and out["not_with_me"] == [{"step_id": "s1", "title": "Cleanser", "product": steps[0]["product"]}]
    rot = next(s for s in out["list"] if s["id"] == "s2")["rotation"]
    assert rot["active"] == 3 and rot["next_week"] == 1 and [o["option"] for o in rot["options"]] == [1, 2, 3]
    assert out["rotating"] == ["s2"] and out["reminders"]["pm"] == {"enabled": True, "time": "21:30"}
    assert next(s for s in out["list"] if s["id"] == "s3")["with_me"] is None
    am, _ = await reg.execute("read_routine", {"slot": "AM"}, ctx2)
    assert am["steps"] == 2 and all(s["slot"] == "am" for s in am["list"])
    bad, _ = await reg.execute("read_routine", {"slot": "noon"}, ctx2)
    assert "slot must be am or pm" in bad["error"]
    none, _ = await reg.execute("read_routine", {}, ToolContext(store=ctx.store, site_url=ctx.site_url, page={}))
    assert "not available" in none["error"]
    assert json.dumps(page, sort_keys=True) == before


async def test_routine_parts_teeth_and_other_steps(ctx: ToolContext):
    """Oral / other zones: proposable bare, never with a ranked category or listing; steps can move between zones (TS twin
    in scripts/routine-check.mjs)."""
    reg = ToolRegistry()
    daily = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    top, _ = await reg.execute("get_top_products", {"category": "kp", "limit": 1}, ctx)
    real = top["results"][0]
    result, _ = await reg.execute("propose_routine_steps", {"steps": [
        {"title": "Brush teeth", "slot": "pm", "days": daily, "zone": "oral", "category": "", "why": "x"},
        {"title": "Floss", "slot": "pm", "days": daily, "zone": "oral", "category": "kp", "why": "x"},
        {"title": "Nail oil", "slot": "pm", "days": daily, "zone": "other", "product_id": real["id"], "why": "x"},
        {"title": "KP lotion", "slot": "pm", "days": daily, "zone": "body", "category": "kp", "product_id": real["id"], "why": "x"},
    ]}, ctx)
    assert result["proposed"] == 2 and result["rejected"] == 2
    assert [s["zone"] for s in result["steps"]] == ["oral", "body"] and result["steps"][0]["category"] is None and result["steps"][0]["product"] is None
    assert all("no ranked pages" in " ".join(p["reasons"]) for p in result["problems"])

    pin = {"id": real["id"], "category": "kp", "brand": real["brand"], "title": real["title"], "rank": real["rank"]}
    page = {"routineSteps": [
        {"id": "t1", "title": "Brush teeth", "slot": "pm", "position": 1, "days": daily, "zone": "face", "part": "oral", "category": None, "note": "", "product": None, "withMe": None, "rotation": None},
        {"id": "t2", "title": "KP lotion", "slot": "pm", "position": 2, "days": daily, "zone": "body", "part": "body", "category": "kp", "note": "", "product": pin, "withMe": True, "rotation": None},
        {"id": "t3", "title": "Shampoo", "slot": "am", "position": 1, "days": daily, "zone": "scalp", "part": "hair", "category": None, "note": "", "product": None, "withMe": None, "rotation": None},
    ]}
    ctx2 = ToolContext(store=ctx.store, site_url=ctx.site_url, page=page)
    result, _ = await reg.execute("edit_routine_steps", {"edits": [
        {"step_id": "t1", "op": "move", "zone": "oral", "why": "teeth tab"},
        {"step_id": "t2", "op": "move", "zone": "other", "why": "pinned listing blocks"},
        {"step_id": "t3", "op": "move", "zone": "scalp", "why": "same zone"},
        {"step_id": "t3", "op": "move", "zone": "nails", "why": "unknown"},
        {"step_id": "t3", "op": "move", "why": "nothing to move"},
    ]}, ctx2)
    assert result["edited"] == 1 and result["rejected"] == 4
    assert result["edits"][0]["after"] == {"zone": "oral", "category": None}
    reasons = " ".join(" ".join(p["reasons"]) for p in result["problems"])
    assert "product_id 'none'" in reasons and "already in the scalp zone" in reasons and "zone must be one of" in reasons and "needs days and/or slot and/or zone" in reasons
    result, _ = await reg.execute("edit_routine_steps", {"edits": [
        {"step_id": "t2", "op": "update", "zone": "other", "product_id": "none", "why": "unpin and move"},
        {"step_id": "t3", "op": "move", "zone": "lengths", "why": "still hair"},
    ]}, ctx2)
    assert result["edited"] == 2
    assert result["edits"][0]["after"]["zone"] == "other" and result["edits"][0]["after"]["product"] is None and result["edits"][0]["after"]["category"] is None
    assert result["edits"][1]["after"] == {"zone": "lengths"}

    out, _ = await reg.execute("read_routine", {"part": "oral"}, ctx2)
    assert out["steps"] == 1 and out["list"][0]["id"] == "t1" and out["list"][0]["part"] == "oral" and out["parts"] == {"body": 1, "hair": 1, "oral": 1}
    bad, _ = await reg.execute("read_routine", {"part": "nails"}, ctx2)
    assert "part must be one of" in bad["error"]
