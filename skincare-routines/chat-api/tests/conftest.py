"""Fixtures build a small dataset out of REAL generated files (public/data) so tests never invent listings.

`small_dataset` copies two real categories + their shards + routines into a temp dir with a manifest restricted to them;
`add_category` copies a third real category and bumps `generatedAt` so version invalidation can be exercised."""
from __future__ import annotations

import json
import shutil
from pathlib import Path

import pytest

from chat_api.config import Settings
from chat_api.data.source import FileSource
from chat_api.data.store import LedgerStore

DATA = Path(__file__).resolve().parents[2] / "public" / "data"
BASE = ["scalpscrub", "kp", "bodyscrub"]  # scalpscrub and bodyscrub share real listings (same id ranked in both)
EXTRA = "calmserum"


def _write_manifest(root: Path, manifest: dict, ids: list[str], version: str) -> dict:
    m = dict(manifest)
    m["generatedAt"] = version
    m["categories"] = [c for c in manifest["categories"] if c["id"] in ids]
    m["benchmarks"] = [b for b in manifest.get("benchmarks", []) if b["category"] in ids]
    m["total"] = sum(c["count"] for c in m["categories"])
    (root / "manifest.json").write_text(json.dumps(m))
    return m


def _copy_category(root: Path, cid: str, shards: int) -> None:
    shutil.copy(DATA / f"{cid}.json", root / f"{cid}.json")
    for i in range(shards):
        shutil.copy(DATA / f"{cid}.d{i}.json", root / f"{cid}.d{i}.json")


@pytest.fixture(scope="session")
def real_manifest() -> dict:
    if not (DATA / "manifest.json").exists():
        pytest.skip("generated dataset missing — run `npm run data` first")
    return json.loads((DATA / "manifest.json").read_text())


@pytest.fixture()
def small_dataset(tmp_path: Path, real_manifest: dict) -> Path:
    shards = int(real_manifest["shards"])
    for cid in BASE:
        _copy_category(tmp_path, cid, shards)
    shutil.copy(DATA / "routines.json", tmp_path / "routines.json")
    _write_manifest(tmp_path, real_manifest, BASE, "2026-01-01T00:00:00.000Z")
    return tmp_path


@pytest.fixture()
def add_category(real_manifest: dict):
    def _add(root: Path, version: str = "2026-01-02T00:00:00.000Z") -> dict:
        _copy_category(root, EXTRA, int(real_manifest["shards"]))
        return _write_manifest(root, real_manifest, BASE + [EXTRA], version)

    return _add


@pytest.fixture()
def store(small_dataset: Path) -> LedgerStore:
    return LedgerStore(FileSource(small_dataset), refresh_seconds=0, category_cache=2, shard_cache=3)


@pytest.fixture()
def settings(small_dataset: Path) -> Settings:
    return Settings(gemini_api_key="", data_source=str(small_dataset), site_url="https://example.test", is_dev=True, refresh_seconds=0)
