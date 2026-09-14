"""Ingredient-aware lookup over REAL generated INCI columns: alias expansion, verified-vs-seller evidence,
exclusions, filter-panel tag semantics and natural-language facet lookup."""
from __future__ import annotations

import json

import pytest

from chat_api.data.store import LedgerStore
from chat_api.tools.base import ToolContext
from chat_api.tools.inci_match import expand_ingredient, find_ingredient, normalize_inci, title_has_words, title_tokens
from chat_api.tools.registry import ToolRegistry
from tests.conftest import DATA


@pytest.fixture()
async def ctx(store: LedgerStore) -> ToolContext:
    await store.ensure_fresh()
    return ToolContext(store=store, site_url="https://example.test", page={})


@pytest.fixture(scope="session")
def aliases(real_manifest: dict) -> list[dict]:
    return json.loads((DATA / real_manifest["knowledge"]["file"]).read_text())["ingredientAliases"]


def test_common_names_and_ci_numbers_expand_both_ways(aliases: list[dict]):
    iron = expand_ingredient("iron oxide", aliases)
    assert {"iron oxide", "ci 77491", "ci 77492", "ci 77499"} <= set(iron.inci)
    assert expand_ingredient("CI 77491", aliases).label == iron.label
    assert "titanium dioxide" in expand_ingredient("CI-77891", aliases).inci
    assert find_ingredient(normalize_inci("Aqua, Zinc Oxide, C.I. 77491, Parfum"), iron) == "ci 77491"
    assert find_ingredient(normalize_inci("Aqua, Iron Oxides (CI 77492)"), iron) is not None


def test_specific_ingredient_never_widens_into_its_group(aliases: list[dict]):
    zinc = expand_ingredient("zinc oxide", aliases)
    assert "titanium dioxide" not in zinc.inci
    assert find_ingredient(normalize_inci("Aqua, Titanium Dioxide, Octocrylene"), zinc) is None
    assert "zinc oxide" not in expand_ingredient("titanium dioxide", aliases).inci
    group = expand_ingredient("mineral filter", aliases)
    assert {"zinc oxide", "titanium dioxide"} <= set(group.inci)


def test_drying_alcohol_does_not_match_fatty_alcohols(aliases: list[dict]):
    alcohol = expand_ingredient("alcohol", aliases)
    assert find_ingredient(normalize_inci("Aqua, Cetearyl Alcohol, Glycerin"), alcohol) is None
    assert find_ingredient(normalize_inci("Aqua, Alcohol Denat., Glycerin"), alcohol) == "alcohol denat"
    assert find_ingredient(normalize_inci("Aqua, Alcohol, Glycerin"), alcohol) == "alcohol"


def test_unknown_name_is_searched_literally(aliases: list[dict]):
    q = expand_ingredient("Linalool", aliases)
    assert q.label is None and q.inci == ["linalool"]
    assert find_ingredient(normalize_inci("Parfum, Linalool, Limonene"), q) == "linalool"
    assert find_ingredient(normalize_inci("Parfum, Limonene"), q) is None


def test_title_words_prefix_match():
    tokens = title_tokens("Re'equil Sheer Zinc Tinted Sunscreen SPF 50")
    assert title_has_words(tokens, ["tinted", "spf"])
    assert not title_has_words(tokens, ["untinted"])


async def test_ingredient_filter_counts_only_verified_inci(ctx: ToolContext):
    reg = ToolRegistry()
    cols = json.loads((DATA / "kp.inci.json").read_text())
    verified_urea = sum(1 for t in cols["inci"] if t and find_ingredient(t, expand_ingredient("urea", [])))
    seller_only = sum(1 for i, t in enumerate(cols["claimed"]) if t and not cols["inci"][i] and "urea" in t)
    no_list = sum(1 for t in cols["inci"] if not t)
    out, _ = await reg.execute("get_top_products", {"category": "kp", "ingredients": ["urea"], "limit": 30}, ctx)
    assert out["matching"] == verified_urea == len(out["results"])
    f = out["ingredientFilter"]
    assert f["sellerClaimedOnly"] == seller_only and f["skippedNoVerifiedInci"] + f["sellerClaimedOnly"] == no_list
    assert f["verifiedListsInCategory"] == cols["verified"]
    for row in out["results"]:
        assert row["inciStatus"] in {"full", "partial"} and row["ingredientsFound"]["urea"]
    pos = {it["id"]: i for i, it in enumerate(json.loads((DATA / "kp.json").read_text())["items"])}
    for ex in f["sellerClaimedExamples"]:  # short "key ingredients" lines are tagged inci:partial but carry no verified text
        assert not cols["inci"][pos[ex["id"]]] and "urea" in cols["claimed"][pos[ex["id"]]] and "not counted" in ex["note"]


async def test_exclusion_removes_verified_hits_only(ctx: ToolContext):
    reg = ToolRegistry()
    with_frag, _ = await reg.execute("get_top_products", {"category": "kp", "ingredients": ["urea"], "limit": 30}, ctx)
    without, _ = await reg.execute("get_top_products", {"category": "kp", "ingredients": ["urea"], "without_ingredients": ["fragrance"], "limit": 30}, ctx)
    assert 0 < without["matching"] < with_frag["matching"]
    assert {r["id"] for r in without["results"]} < {r["id"] for r in with_frag["results"]}


async def test_tags_in_one_group_are_any_of_and_groups_stack(ctx: ToolContext):
    reg = ToolRegistry()
    amazon, _ = await reg.execute("get_top_products", {"category": "kp", "tags": ["store:amazon"], "limit": 1}, ctx)
    flipkart, _ = await reg.execute("get_top_products", {"category": "kp", "tags": ["store:flipkart"], "limit": 1}, ctx)
    either, _ = await reg.execute("get_top_products", {"category": "kp", "tags": ["store:amazon", "store:flipkart"], "limit": 1}, ctx)
    assert either["matching"] == amazon["matching"] + flipkart["matching"] > 0
    stacked, _ = await reg.execute("get_top_products", {"category": "kp", "tags": ["store:amazon", "inci:full"], "limit": 1}, ctx)
    assert 0 < stacked["matching"] < amazon["matching"]
    assert "f=store:amazon&f=inci:full" in stacked["url"] and "all=" not in stacked["url"]


async def test_unknown_tag_lists_nearest_real_tags_and_query_maps_words(ctx: ToolContext):
    reg = ToolRegistry()
    bad, _ = await reg.execute("get_top_products", {"category": "kp", "tags": ["fragrance-free"]}, ctx)
    assert "free:fragrance" in bad["error"]
    hints, _ = await reg.execute("get_category_filters", {"category": "kp", "query": "no fragrance full ingredient list"}, ctx)
    tags = [h["tag"] for h in hints["matches"]]
    assert "free:fragrance" in tags and "inci:full" in tags
