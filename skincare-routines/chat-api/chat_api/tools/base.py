"""Command pattern: every site-knowledge tool is a small object with a Gemini declaration and a `run`.
Declarations are built from the live manifest so category enums etc. follow the data, not a hard-coded list."""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass

from ..data.store import LedgerStore


@dataclass(frozen=True)
class ToolContext:
    store: LedgerStore
    site_url: str
    page: dict

    def category_url(self, category_id: str, params: str = "") -> str:
        return f"{self.site_url}/#/c/{category_id}{params}"

    def product_url(self, category_id: str, product_id: str) -> str:
        return f"{self.site_url}/#/c/{category_id}?open={product_id}"


class ToolError(ValueError):
    """A tool-level problem the model should read back verbatim (unknown category, bad filter…)."""


class Tool(ABC):
    name: str
    description: str

    @abstractmethod
    def parameters(self, manifest: dict) -> dict: ...

    @abstractmethod
    async def run(self, args: dict, ctx: ToolContext) -> dict: ...

    def declaration(self, manifest: dict) -> dict:
        return {"name": self.name, "description": self.description, "parameters": self.parameters(manifest)}


def category_ids(manifest: dict) -> list[str]:
    return [c["id"] for c in manifest.get("categories", [])]


def category_param(manifest: dict, description: str) -> dict:
    return {"type": "string", "description": description, "enum": category_ids(manifest)}


def clamp(value: object, default: int, lo: int, hi: int) -> int:
    try:
        n = int(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return default
    return max(lo, min(hi, n))
