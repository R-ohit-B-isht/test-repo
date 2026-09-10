"""Tools over the store: manifest-derived declarations, evidence preservation, explicit no-match / error states."""
from __future__ import annotations

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
    assert set(by_name["get_top_products"]["parameters"]["properties"]["category"]["enum"]) == {"scalpscrub", "kp"}
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
