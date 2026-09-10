"""Registry of site tools. Declarations are rebuilt per dataset version so enums track the live manifest."""
from __future__ import annotations

import json
import time

from .base import Tool, ToolContext, ToolError
from .catalog import GetReferenceCeiling, GetRoutines, GetScoringMethod, GetSiteOverview, ListCategories
from .knowledge import GetIngredientKnowledge
from .products import CompareProducts, GetCategoryFilters, GetProduct, GetTopProducts, SearchProducts

ALL_TOOLS: list[Tool] = [
    GetSiteOverview(), ListCategories(), GetScoringMethod(), GetReferenceCeiling(), GetRoutines(),
    SearchProducts(), GetTopProducts(), GetCategoryFilters(), GetProduct(), CompareProducts(), GetIngredientKnowledge(),
]


class ToolRegistry:
    def __init__(self, tools: list[Tool] | None = None):
        self._tools = {t.name: t for t in (tools or ALL_TOOLS)}
        self._declared_for: str | None = None
        self._declarations: list[dict] = []

    def names(self) -> list[str]:
        return list(self._tools)

    def declarations(self, manifest: dict) -> list[dict]:
        version = str(manifest.get("generatedAt"))
        if version != self._declared_for:
            self._declarations = [t.declaration(manifest) for t in self._tools.values()]
            self._declared_for = version
        return self._declarations

    async def execute(self, name: str, args: dict, ctx: ToolContext) -> tuple[dict, float]:
        """Run a tool; tool-level problems come back as an `error` payload the model can read, never as a crash."""
        started = time.perf_counter()
        tool = self._tools.get(name)
        if not tool:
            return {"error": f"Unknown tool {name}"}, 0.0
        try:
            result = await tool.run(args, ctx)
        except ToolError as exc:
            result = {"error": str(exc)}
        return result, (time.perf_counter() - started) * 1000


def size_of(payload: dict) -> int:
    return len(json.dumps(payload, ensure_ascii=False))
