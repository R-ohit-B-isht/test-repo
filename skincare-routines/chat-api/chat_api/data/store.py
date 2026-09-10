"""LedgerStore: the single read model over the generated dataset.

* Versioned by `manifest.generatedAt` — when the site regenerates data, the next refresh drops every cache and
  rebuilds the search index, so new categories/listings are picked up without a redeploy (Observer: listeners
  are notified of the new version).
* Category compact files and detail shards are loaded lazily into small LRU caches (Proxy / lazy loading).
"""
from __future__ import annotations

import asyncio
import time
from collections import OrderedDict
from collections.abc import Callable
from typing import Any

from .search import SearchIndex
from .source import DataError, JsonSource


class LRU:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self._items: OrderedDict[str, Any] = OrderedDict()

    def get(self, key: str) -> Any | None:
        if key not in self._items:
            return None
        self._items.move_to_end(key)
        return self._items[key]

    def put(self, key: str, value: Any) -> None:
        self._items[key] = value
        self._items.move_to_end(key)
        while len(self._items) > self.capacity:
            self._items.popitem(last=False)

    def clear(self) -> None:
        self._items.clear()

    def __len__(self) -> int:
        return len(self._items)


def rank_order(items: list[dict]) -> list[int]:
    """1-based overall rank per position: score desc, then price asc — identical to the frontend's `buildIndex`."""
    order = sorted(range(len(items)), key=lambda i: (-items[i]["s"], items[i]["p"]))
    ranks = [0] * len(items)
    for r, pos in enumerate(order):
        ranks[pos] = r + 1
    return ranks


def shard_of(product_id: str, shards: int) -> int:
    h = 0
    for ch in product_id:
        h = (h * 31 + ord(ch)) & 0xFFFFFFFF
    return h % shards


class CategoryView:
    """A loaded compact category with its rank array and tag lookup."""

    def __init__(self, data: dict):
        self.id: str = data["id"]
        self.items: list[dict] = data["items"]
        self.tag_index: list[str] = data["tagIndex"]
        self.facets: dict[str, list[dict]] = data["facets"]
        self.ranks = rank_order(self.items)
        self.tag_pos = {tag: i for i, tag in enumerate(self.tag_index)}
        self.pos_of = {item["id"]: i for i, item in enumerate(self.items)}
        self.by_rank = sorted(range(len(self.items)), key=lambda i: self.ranks[i])

    def tags_of(self, item: dict) -> list[str]:
        return [self.tag_index[t] for t in item["t"]]

    def has_tags(self, item: dict, wanted: list[int]) -> bool:
        have = set(item["t"])
        return all(t in have for t in wanted)


class LedgerStore:
    def __init__(self, source: JsonSource, *, refresh_seconds: int, category_cache: int, shard_cache: int):
        self.source = source
        self.refresh_seconds = refresh_seconds
        self.manifest: dict | None = None
        self.version: str | None = None
        self.routines: dict | None = None
        self.knowledge: dict | None = None
        self.index = SearchIndex()
        self._categories = LRU(category_cache)
        self._shards = LRU(shard_cache)
        self._checked_at = 0.0
        self._lock = asyncio.Lock()
        self._listeners: list[Callable[[str], None]] = []
        self.last_error: str | None = None
        self.indexed_at: float | None = None

    # ---- versioning -------------------------------------------------------------------------------------------
    def on_version(self, listener: Callable[[str], None]) -> None:
        self._listeners.append(listener)

    async def ensure_fresh(self, force: bool = False) -> dict:
        """Re-read the manifest at most every `refresh_seconds`; rebuild everything when `generatedAt` changed."""
        now = time.monotonic()
        if self.manifest is not None and not force and now - self._checked_at < self.refresh_seconds:
            return self.manifest
        async with self._lock:
            if self.manifest is not None and not force and time.monotonic() - self._checked_at < self.refresh_seconds:
                return self.manifest
            try:
                manifest = await self.source.read("manifest.json")
            except DataError as exc:
                self.last_error = str(exc)
                self._checked_at = time.monotonic()
                if self.manifest is None:
                    raise
                return self.manifest
            self._checked_at = time.monotonic()
            version = manifest.get("generatedAt")
            if version != self.version:
                await self._rebuild(manifest)
            return self.manifest or manifest

    async def _rebuild(self, manifest: dict) -> None:
        index = SearchIndex()
        for cat in manifest.get("categories", []):
            data = await self.source.read(f"{cat['id']}.json")
            index.add_category(cat["id"], data["items"], rank_order(data["items"]))
        self.manifest = manifest
        self.version = manifest.get("generatedAt")
        self.index = index
        self.routines = None
        self.knowledge = None
        self._categories.clear()
        self._shards.clear()
        self.indexed_at = time.time()
        self.last_error = None
        for listener in self._listeners:
            listener(self.version or "")

    # ---- reads ------------------------------------------------------------------------------------------------
    def category_meta(self, category_id: str) -> dict | None:
        if not self.manifest:
            return None
        return next((c for c in self.manifest["categories"] if c["id"] == category_id), None)

    def benchmark_for(self, category_id: str) -> dict | None:
        if not self.manifest:
            return None
        return next((b for b in self.manifest.get("benchmarks", []) if b["category"] == category_id), None)

    async def category(self, category_id: str) -> CategoryView:
        await self.ensure_fresh()
        cached = self._categories.get(category_id)
        if cached is not None:
            return cached
        if not self.category_meta(category_id):
            raise DataError(f"No ranked category called '{category_id}'")
        view = CategoryView(await self.source.read(f"{category_id}.json"))
        self._categories.put(category_id, view)
        return view

    async def detail(self, category_id: str, product_id: str) -> dict | None:
        manifest = await self.ensure_fresh()
        shards = int(manifest.get("shards", 1))
        key = f"{category_id}.d{shard_of(product_id, shards)}.json"
        shard = self._shards.get(key)
        if shard is None:
            shard = await self.source.read(key)
            self._shards.put(key, shard)
        return shard.get(product_id)

    async def get_routines(self) -> dict:
        await self.ensure_fresh()
        if self.routines is None:
            self.routines = await self.source.read("routines.json")
        return self.routines

    async def get_knowledge(self) -> dict:
        """The scorer's sourced ingredient tables + pairing guidance; absent on datasets generated before knowledge.json."""
        manifest = await self.ensure_fresh()
        if self.knowledge is None:
            meta = manifest.get("knowledge")
            if not meta:
                raise DataError("This dataset was generated without the ingredient knowledge file (knowledge.json).")
            self.knowledge = await self.source.read(meta["file"])
        return self.knowledge

    def stats(self) -> dict:
        return {
            "version": self.version,
            "indexed": len(self.index),
            "categoriesLoaded": len(self._categories),
            "shardsLoaded": len(self._shards),
            "source": self.source.label,
            "lastError": self.last_error,
            "indexedAt": self.indexed_at,
        }
