"""Listing-level tools: search, ranked lists with filters, product evidence, comparison."""
from __future__ import annotations

from ..data.source import DataError
from .base import Tool, ToolContext, ToolError, category_param, clamp
from .present import detail_summary, hit_summary, row_summary


class SearchProducts(Tool):
    name = "search_products"
    description = (
        "Find listings by brand and/or product name across every category (accent/apostrophe-insensitive). "
        "Returns rank, score, price, store and INCI state for each match. Returns an empty list when the product is not "
        "sold on Flipkart/Amazon.in in this dataset — say so rather than guessing."
    )

    def parameters(self, manifest: dict) -> dict:
        return {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Brand + product words, e.g. 'cetaphil gentle skin cleanser'"},
                "category": category_param(manifest, "Optional: restrict to one category id"),
                "limit": {"type": "integer", "description": "Max results (default 8, max 25)"},
            },
            "required": ["query"],
        }

    async def run(self, args: dict, ctx: ToolContext) -> dict:
        await ctx.store.ensure_fresh()
        query = str(args.get("query", "")).strip()
        if not query:
            raise ToolError("query is required")
        category = args.get("category") or None
        limit = clamp(args.get("limit"), 8, 1, 25)
        hits = ctx.store.index.search(query, category=category, limit=limit)
        results = [hit_summary(h, s, ctx, (ctx.store.category_meta(h.category) or {}).get("count")) for s, h in hits]
        return {"query": query, "count": len(results), "results": results, "note": None if results else "No listing matches every word of the query. Try fewer words, or the product is not sold on Flipkart/Amazon.in."}


class GetTopProducts(Tool):
    name = "get_top_products"
    description = (
        "Ranked listings for one category, optionally filtered by tags (e.g. 'target:acne', 'inci:full', 'scope:face', "
        "'store:amazon', 'free:fragrance'), a price cap or a brand. Use get_category_filters to see valid tags. Returns the "
        "top N with rank, score breakdown and INCI state."
    )

    def parameters(self, manifest: dict) -> dict:
        return {
            "type": "object",
            "properties": {
                "category": category_param(manifest, "Category id"),
                "tags": {"type": "array", "items": {"type": "string"}, "description": "Tags that must all be present"},
                "max_price_inr": {"type": "integer", "description": "Only listings at or below this price"},
                "brand": {"type": "string", "description": "Only this brand (case-insensitive)"},
                "limit": {"type": "integer", "description": "How many (default 10, max 30)"},
                "offset": {"type": "integer", "description": "Skip the first N ranked results (paging)"},
            },
            "required": ["category"],
        }

    async def run(self, args: dict, ctx: ToolContext) -> dict:
        cat = await _category(ctx, args)
        wanted_tags = [str(t) for t in (args.get("tags") or [])]
        unknown = [t for t in wanted_tags if t not in cat.tag_pos]
        if unknown:
            raise ToolError(f"Unknown tags for {cat.id}: {unknown}. Call get_category_filters('{cat.id}') for the valid tag list.")
        wanted = [cat.tag_pos[t] for t in wanted_tags]
        max_price = args.get("max_price_inr")
        brand = str(args.get("brand") or "").strip().lower()
        limit = clamp(args.get("limit"), 10, 1, 30)
        offset = clamp(args.get("offset"), 0, 0, 100_000)
        matched = 0
        rows = []
        for pos in cat.by_rank:
            item = cat.items[pos]
            if wanted and not cat.has_tags(item, wanted):
                continue
            if isinstance(max_price, (int, float)) and item["p"] > max_price:
                continue
            if brand and item["b"].lower() != brand:
                continue
            matched += 1
            if matched > offset and len(rows) < limit:
                rows.append(row_summary(cat, pos, ctx))
        params = "".join(f"&f={t}" for t in wanted_tags)
        if isinstance(max_price, (int, float)):
            params += f"&pmax={int(max_price)}"
        return {
            "category": cat.id,
            "totalInCategory": len(cat.items),
            "matching": matched,
            "results": rows,
            "url": ctx.category_url(cat.id, "?" + params[1:] if params else ""),
        }


class GetCategoryFilters(Tool):
    name = "get_category_filters"
    description = "Valid filter tags for a category with human labels and listing counts (evidence state, concern, format, actives, free-from, skin/hair type, size, rating, store)."

    def parameters(self, manifest: dict) -> dict:
        return {"type": "object", "properties": {"category": category_param(manifest, "Category id")}, "required": ["category"]}

    async def run(self, args: dict, ctx: ToolContext) -> dict:
        cat = await _category(ctx, args)
        groups = (ctx.store.manifest or {}).get("groups", {})
        return {
            "category": cat.id,
            "filters": {g: {"label": groups.get(g, {}).get("label", g), "hint": groups.get(g, {}).get("hint"), "options": rows} for g, rows in cat.facets.items()},
        }


class GetProduct(Tool):
    name = "get_product"
    description = (
        "Everything the site shows for one listing: rank, score breakdown, full INCI text and where it came from "
        "(marketplace listing / official brand site / third party, with URL, region, matched official title), evidence-graded actives, "
        "safety flags, maker accountability, buyer evidence, pros/cons, and the seller claims that are shown but NOT scored."
    )

    def parameters(self, manifest: dict) -> dict:
        return {"type": "object", "properties": {"product_id": {"type": "string", "description": "Listing id from search_products / get_top_products"}}, "required": ["product_id"]}

    async def run(self, args: dict, ctx: ToolContext) -> dict:
        return await product_record(str(args.get("product_id", "")), ctx)


class CompareProducts(Tool):
    name = "compare_products"
    description = "Side-by-side evidence for 2–5 listings (any categories): rank, score breakdown, INCI status + source, actives, flags, maker, price."

    def parameters(self, manifest: dict) -> dict:
        return {"type": "object", "properties": {"product_ids": {"type": "array", "items": {"type": "string"}, "minItems": 2, "maxItems": 5}}, "required": ["product_ids"]}

    async def run(self, args: dict, ctx: ToolContext) -> dict:
        ids = [str(i) for i in (args.get("product_ids") or [])][:5]
        if len(ids) < 2:
            raise ToolError("Give at least two product ids.")
        rows: list[dict] = []
        for pid in ids:
            try:
                rows.append(await product_record(pid, ctx))
            except ToolError as exc:
                rows.append({"id": pid, "error": str(exc)})
        return {"count": len(rows), "products": rows, "note": "Scores are only comparable within one category; a reference ceiling (100) is never a listing."}


async def product_record(product_id: str, ctx: ToolContext) -> dict:
    await ctx.store.ensure_fresh()
    hit = ctx.store.index.get(product_id)
    if not hit:
        raise ToolError(f"No listing with id '{product_id}' in the current dataset.")
    cat = await ctx.store.category(hit.category)
    row = row_summary(cat, cat.pos_of[product_id], ctx)
    try:
        detail = await ctx.store.detail(hit.category, product_id)
    except DataError as exc:
        return {**row, "detail": None, "detailError": str(exc)}
    if detail is None:
        return {**row, "detail": None, "detailError": "Listing detail not found in its data shard."}
    return {**row, "detail": detail_summary(detail)}


async def _category(ctx: ToolContext, args: dict):
    cid = str(args.get("category", "")).strip()
    try:
        return await ctx.store.category(cid)
    except DataError as exc:
        raise ToolError(str(exc)) from exc
