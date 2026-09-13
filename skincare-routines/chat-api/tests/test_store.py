"""LedgerStore: manifest loading, lazy loading, LRU bounds, and generatedAt-driven invalidation (new category pickup)."""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from chat_api.data.source import DataError, FileSource
from chat_api.data.store import LRU, LedgerStore, rank_order, shard_of

async def test_manifest_and_index_cover_only_listed_categories(store: LedgerStore):
    manifest = await store.ensure_fresh()
    assert store.version == "2026-01-01T00:00:00.000Z"
    assert {c["id"] for c in manifest["categories"]} == {"scalpscrub", "kp", "bodyscrub"}
    assert len(store.index) == manifest["total"] > 0
    assert store.stats()["categoriesLoaded"] == 0, "index build must not populate the category LRU"


async def test_category_and_detail_load_lazily_and_stay_bounded(store: LedgerStore):
    await store.ensure_fresh()
    kp = await store.category("kp")
    assert len(kp.items) == store.category_meta("kp")["count"]
    assert kp.ranks[kp.by_rank[0]] == 1
    top = kp.items[kp.by_rank[0]]
    detail = await store.detail("kp", top["id"])
    assert detail is not None and detail["title"]
    stats = store.stats()
    assert stats["categoriesLoaded"] == 1 and stats["shardsLoaded"] == 1
    for item in kp.items[:12]:
        await store.detail("kp", item["id"])
    assert store.stats()["shardsLoaded"] <= 3


async def test_unknown_category_and_product_are_explicit(store: LedgerStore):
    await store.ensure_fresh()
    with pytest.raises(DataError):
        await store.category("does-not-exist")
    assert store.index.get("nope-123") is None
    assert await store.detail("kp", "nope-123") is None


async def test_version_change_picks_up_new_category_and_clears_caches(store: LedgerStore, small_dataset: Path, add_category):
    await store.ensure_fresh()
    await store.category("kp")
    seen: list[str] = []
    store.on_version(seen.append)
    assert store.category_meta("calmserum") is None
    assert store.index.search("purito centella") == []

    add_category(small_dataset)
    manifest = await store.ensure_fresh(force=True)

    assert seen == ["2026-01-02T00:00:00.000Z"]
    assert store.category_meta("calmserum") is not None
    assert len(store.index) == manifest["total"]
    assert store.stats()["categoriesLoaded"] == 0 and store.stats()["shardsLoaded"] == 0
    hits = store.index.search("purito centella")
    assert hits and hits[0][1].category == "calmserum"
    assert store.benchmark_for("calmserum") is not None


async def test_same_version_does_not_rebuild(store: LedgerStore, small_dataset: Path):
    await store.ensure_fresh()
    first_index = store.index
    await store.category("kp")
    await store.ensure_fresh(force=True)
    assert store.index is first_index
    assert store.stats()["categoriesLoaded"] == 1


async def test_unreadable_manifest_keeps_last_good_dataset(store: LedgerStore, small_dataset: Path):
    await store.ensure_fresh()
    (small_dataset / "manifest.json").write_text("{not json")
    manifest = await store.ensure_fresh(force=True)
    assert manifest["generatedAt"] == "2026-01-01T00:00:00.000Z"
    assert store.last_error


async def test_missing_dataset_raises_at_first_load(tmp_path: Path):
    empty = LedgerStore(FileSource(tmp_path), refresh_seconds=0, category_cache=1, shard_cache=1)
    with pytest.raises(DataError):
        await empty.ensure_fresh()


def test_rank_order_matches_frontend_rule():
    items = [{"s": 50, "p": 300}, {"s": 90, "p": 500}, {"s": 50, "p": 100}]
    assert rank_order(items) == [3, 1, 2]


def test_shard_of_matches_generator(real_manifest: dict):
    data_dir = Path(__file__).resolve().parents[2] / "public" / "data"
    shards = int(real_manifest["shards"])
    kp = json.loads((data_dir / "kp.json").read_text())
    for item in kp["items"][:20]:
        shard = json.loads((data_dir / f"kp.d{shard_of(item['id'], shards)}.json").read_text())
        assert item["id"] in shard


def test_lru_evicts_oldest():
    lru = LRU(2)
    lru.put("a", 1)
    lru.put("b", 2)
    lru.get("a")
    lru.put("c", 3)
    assert lru.get("b") is None and lru.get("a") == 1 and lru.get("c") == 3
