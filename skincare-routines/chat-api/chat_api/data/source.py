"""Strategy: where the generated JSON lives. The frontend build emits `public/data`; in production the same files are
served by the static site, so the API can read them over HTTP without a copy of the dataset."""
from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Protocol

import httpx


class JsonSource(Protocol):
    label: str

    async def read(self, name: str) -> dict: ...


class DataError(RuntimeError):
    """Raised when a generated file is missing or unreadable — surfaced honestly, never papered over."""


class FileSource:
    def __init__(self, root: Path):
        self.root = root
        self.label = f"file:{root}"

    async def read(self, name: str) -> dict:
        path = self.root / name
        if not path.is_file():
            raise DataError(f"{name} is not in the generated data directory")
        try:
            return await asyncio.to_thread(_load_file, path)
        except (ValueError, OSError) as exc:  # half-written file during a regenerate, or unreadable
            raise DataError(f"{name} is not valid JSON") from exc


def _load_file(path: Path) -> dict:
    with path.open("rb") as fh:
        return json.load(fh)


class HttpSource:
    def __init__(self, base_url: str):
        self.base = base_url.rstrip("/") + "/"
        self.label = f"http:{self.base}"
        self._client = httpx.AsyncClient(timeout=httpx.Timeout(30.0), follow_redirects=True)

    async def read(self, name: str) -> dict:
        res = await self._client.get(self.base + name, headers={"cache-control": "no-cache"})
        if res.status_code != 200:
            raise DataError(f"{name} returned HTTP {res.status_code} from the data host")
        try:
            return res.json()
        except ValueError as exc:
            raise DataError(f"{name} is not valid JSON") from exc

    async def aclose(self) -> None:
        await self._client.aclose()


def make_source(spec: str) -> JsonSource:
    if spec.startswith(("http://", "https://")):
        return HttpSource(spec)
    return FileSource(Path(spec))
