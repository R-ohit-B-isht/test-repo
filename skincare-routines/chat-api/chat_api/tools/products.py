"""Listing-level tools: search, ranked lists with filters, product evidence, comparison."""
from __future__ import annotations

from ..data.source import DataError
from ..data.store import CategoryView, TagGroupQuery
from .base import Tool, ToolContext, ToolError, category_param, clamp
from .facet_hints import match_facets
from .inci_match import IngredientQuery, expand_ingredient, find_ingredient, title_has_words, title_tokens
from .present import detail_summary, hit_summary, row_summary


def _str_list(value: object) -> list[str]:
    return [str(v).strip() for v in value if str(v).strip()] if isinstance(value, list) else []


def _resolve_tags(cat: CategoryView, wanted_tags: list[str], groups: dict) -> list[TagGroupQuery]:
    """Tags grouped the way the site's filter panel matches them: any-of within a group (all-of for `and` groups such as
    ing:/free:), every group required. Unknown tag ids come back with the closest real options instead of a dead end."""
    unknown = [t for t in wanted_tags if t not in cat.tag_pos]
    if not unknown:
        by_group: dict[str, list[int]] = {}
        for t in wanted_tags:
            by_group.setdefault(t.split(":", 1)[0], []).append(cat.tag_pos[t])
        return [TagGroupQuery(group=g, tags=tags, all=groups.get(g, {}).get("mode") == "and") for g, tags in by_group.items()]
    hints = []
    for t in unknown:
        near = [f"{h.tag} ({h.label}, {h.count})" for h in match_facets(t, cat.facets, groups, 5)]
        tail = f" — closest real tags: {'; '.join(near)}" if near else " — no similar tag; if it is an ingredient, pass it in `ingredients` instead"
        hints.append(f"'{t}' is not a tag in {cat.id}{tail}")
    raise ToolError(f"{'. '.join(hints)}. Retry with real tags, or call get_category_filters('{cat.id}', query) to look them up.")


def _ingredient_pass(inci_text: str, claimed_text: str, wanted: list[IngredientQuery], excluded: list[IngredientQuery]) -> tuple[bool, bool, dict[str, str]]:
    """(verified hit, seller-line-only hit, names found). Every `wanted` present and no `excluded` on the verified list."""
    found: dict[str, str] = {}
    if inci_text:
        for q in wanted:
            hit = find_ingredient(inci_text, q)
            if not hit:
                return False, False, found
            found[q.term] = hit
        if any(find_ingredient(inci_text, q) for q in excluded):
            return False, False, found
        return True, False, found
    claimed = bool(claimed_text) and bool(wanted) and all(find_ingredient(claimed_text, q) for q in wanted)
    return False, claimed, found


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
        "Ranked listings for one category filtered by any mix of: facet tags ('water:resistant', 'claim:tinted', 'target:acne', "
        "'inci:full', 'scope:face', 'store:amazon', 'free:fragrance' — look ids up with get_category_filters), INGREDIENTS that must be "
        "on the verified INCI list (any common or INCI name: 'iron oxide', 'zinc oxide', 'vitamin C', 'ceramide', 'CI 77491' — aliases and "
        "CI numbers are expanded automatically), ingredients that must be absent, words that must appear in the title, a price cap or a "
        "brand. Ingredient filters only count listings with a verified INCI list; listings whose seller line merely claims the ingredient "
        "are returned separately as unverified. Returns the top N by rank with score breakdown, INCI state and which name matched."
    )

    def parameters(self, manifest: dict) -> dict:
        return {
            "type": "object",
            "properties": {
                "category": category_param(manifest, "Category id"),
                "tags": {"type": "array", "items": {"type": "string"}, "description": "Facet tag ids. Same group = any of them (['water:80','water:40','water:resistant'] = any stated water resistance); different groups all apply"},
                "ingredients": {"type": "array", "items": {"type": "string"}, "description": "Ingredients that must ALL be on the verified INCI list, e.g. ['iron oxide', 'zinc oxide']"},
                "without_ingredients": {"type": "array", "items": {"type": "string"}, "description": "Ingredients that must be ABSENT from the verified INCI list, e.g. ['fragrance', 'alcohol denat']"},
                "title_words": {"type": "array", "items": {"type": "string"}, "description": "Words that must appear in the brand/title, e.g. ['tinted'] (prefix match)"},
                "max_price_inr": {"type": "integer", "description": "Only listings at or below this price"},
                "brand": {"type": "string", "description": "Only this brand (case-insensitive)"},
                "limit": {"type": "integer", "description": "How many (default 10, max 30)"},
                "offset": {"type": "integer", "description": "Skip the first N ranked results (paging)"},
            },
            "required": ["category"],
        }

    async def run(self, args: dict, ctx: ToolContext) -> dict:
        cat = await _category(ctx, args)
        wanted_tags = _str_list(args.get("tags"))
        wanted = _resolve_tags(cat, wanted_tags, (ctx.store.manifest or {}).get("groups", {}))
        ingredient_terms = _str_list(args.get("ingredients"))
        excluded_terms = _str_list(args.get("without_ingredients"))
        title_words = _str_list(args.get("title_words"))
        max_price = args.get("max_price_inr")
        brand = str(args.get("brand") or "").strip().lower()
        limit = clamp(args.get("limit"), 10, 1, 30)
        offset = clamp(args.get("offset"), 0, 0, 100_000)
        uses_inci = bool(ingredient_terms or excluded_terms)
        aliases = await ctx.store.ingredient_aliases() if uses_inci else []
        wanted_inci = [expand_ingredient(t, aliases) for t in ingredient_terms]
        excluded_inci = [expand_ingredient(t, aliases) for t in excluded_terms]
        cols = await _inci_columns(ctx, cat.id) if uses_inci else None
        matched = unverified = uncheckable = 0
        rows: list[dict] = []
        unverified_rows: list[dict] = []
        for pos in cat.by_rank:
            item = cat.items[pos]
            if wanted and not cat.matches_tag_groups(item, wanted):
                continue
            if isinstance(max_price, (int, float)) and item["p"] > max_price:
                continue
            if brand and item["b"].lower() != brand:
                continue
            if title_words and not title_has_words(title_tokens(f"{item['b']} {item['m']}"), title_words):
                continue
            found: dict[str, str] = {}
            if cols is not None:
                inci_text = cols["inci"][pos]
                ok, claimed, found = _ingredient_pass(inci_text, cols["claimed"][pos], wanted_inci, excluded_inci)
                if not ok:
                    if claimed:
                        unverified += 1
                        if len(unverified_rows) < 3:
                            unverified_rows.append({**row_summary(cat, pos, ctx), "note": "seller's key-ingredients line names it but no full declared list is published — unverified, not counted"})
                    elif not inci_text:
                        uncheckable += 1
                    continue
            matched += 1
            if matched > offset and len(rows) < limit:
                row = row_summary(cat, pos, ctx)
                if found:
                    row["ingredientsFound"] = found
                rows.append(row)
        params = "".join(f"&f={t}" for t in wanted_tags) + "".join(f"&all={g.group}" for g in wanted if g.all and len(g.tags) > 1)
        if isinstance(max_price, (int, float)):
            params += f"&pmax={int(max_price)}"
        out = {
            "category": cat.id,
            "totalInCategory": len(cat.items),
            "matching": matched,
            "results": rows,
            "url": ctx.category_url(cat.id, "?" + params[1:] if params else ""),
        }
        if cols is not None:
            out["ingredientFilter"] = {
                "require": [{"term": q.term, "recognisedAs": q.label, "lookingFor": q.looking_for()} for q in wanted_inci],
                "exclude": [{"term": q.term, "recognisedAs": q.label, "lookingFor": q.looking_for()} for q in excluded_inci],
                "verifiedListsInCategory": cols["verified"],
                "skippedNoVerifiedInci": uncheckable,
                "sellerClaimedOnly": unverified,
                "sellerClaimedExamples": unverified_rows,
                "note": "Only verified INCI lists (marketplace listing, official brand site or third-party database) count. Listings with no list could not be checked either way — say so rather than treating them as absent.",
            }
        return out


class GetCategoryFilters(Tool):
    name = "get_category_filters"
    description = (
        "Valid filter tags for a category with human labels and listing counts (evidence state, concern, format, actives, free-from, "
        "skin/hair type, water resistance, size, rating, store). Pass `query` with the user's own words (e.g. 'water repellent tinted') "
        "to get only the tags that match them, best first."
    )

    def parameters(self, manifest: dict) -> dict:
        return {
            "type": "object",
            "properties": {
                "category": category_param(manifest, "Category id"),
                "query": {"type": "string", "description": "Optional plain-English words to map onto tags; omit for the full list"},
            },
            "required": ["category"],
        }

    async def run(self, args: dict, ctx: ToolContext) -> dict:
        cat = await _category(ctx, args)
        groups = (ctx.store.manifest or {}).get("groups", {})
        query = str(args.get("query") or "").strip()
        if query:
            matches = [h.public() for h in match_facets(query, cat.facets, groups, 12)]
            note = (
                "Pass every returned id of the same group together in get_top_products `tags` (they mean any-of); ingredient words that are not tags go in `ingredients` instead."
                if matches
                else "No tag matches these words. Ingredients go in get_top_products `ingredients`; product words can go in `title_words`."
            )
            return {"category": cat.id, "query": query, "matches": matches, "note": note}
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
        return {
            "type": "object",
            "properties": {
                "product_id": {"type": "string", "description": "Listing id from search_products / get_top_products"},
                "category": {**category_param(manifest, "Which category's placement to read when the listing is ranked in several (defaults to the page's category)"), "nullable": True},
            },
            "required": ["product_id"],
        }

    async def run(self, args: dict, ctx: ToolContext) -> dict:
        return await product_record(str(args.get("product_id", "")), ctx, _category_arg(args))


class CompareProducts(Tool):
    name = "compare_products"
    description = "Side-by-side evidence for 2–5 listings (any categories): rank, score breakdown, INCI status + source, actives, flags, maker, price."

    def parameters(self, manifest: dict) -> dict:
        return {
            "type": "object",
            "properties": {
                "product_ids": {"type": "array", "items": {"type": "string"}, "minItems": 2, "maxItems": 5},
                "category": {**category_param(manifest, "Category whose ranks to compare when listings sit in several (defaults to the page's category)"), "nullable": True},
            },
            "required": ["product_ids"],
        }

    async def run(self, args: dict, ctx: ToolContext) -> dict:
        ids = [str(i) for i in (args.get("product_ids") or [])][:5]
        if len(ids) < 2:
            raise ToolError("Give at least two product ids.")
        prefer = _category_arg(args)
        rows: list[dict] = []
        for pid in ids:
            try:
                rows.append(await product_record(pid, ctx, prefer))
            except ToolError as exc:
                rows.append({"id": pid, "error": str(exc)})
        return {"count": len(rows), "products": rows, "note": "Scores are only comparable within one category; a reference ceiling (100) is never a listing."}


async def product_record(product_id: str, ctx: ToolContext, prefer_category: str | None = None) -> dict:
    await ctx.store.ensure_fresh()
    page_cat = ctx.page.get("category") or {}
    hit = ctx.store.index.get(product_id, prefer_category or page_cat.get("id"))
    if not hit:
        raise ToolError(f"No listing with id '{product_id}' in the current dataset.")
    cat = await ctx.store.category(hit.category)
    row = row_summary(cat, cat.pos_of[product_id], ctx)
    others = [h for h in ctx.store.index.placements(product_id) if h.category != hit.category]
    if others:
        row["alsoRankedIn"] = [
            {"category": h.category, "rank": h.rank, "of": (ctx.store.category_meta(h.category) or {}).get("count"), "score": h.score, "url": ctx.product_url(h.category, product_id)}
            for h in others
        ]
    try:
        detail = await ctx.store.detail(hit.category, product_id)
    except DataError as exc:
        return {**row, "detail": None, "detailError": str(exc)}
    if detail is None:
        return {**row, "detail": None, "detailError": "Listing detail not found in its data shard."}
    return {**row, "detail": detail_summary(detail)}


def _category_arg(args: dict) -> str | None:
    cid = args.get("category")
    return str(cid).strip() or None if isinstance(cid, str) else None


async def _category(ctx: ToolContext, args: dict) -> CategoryView:
    cid = str(args.get("category", "")).strip()
    try:
        return await ctx.store.category(cid)
    except DataError as exc:
        raise ToolError(str(exc)) from exc


async def _inci_columns(ctx: ToolContext, category_id: str) -> dict:
    try:
        return await ctx.store.inci(category_id)
    except DataError as exc:
        raise ToolError(str(exc)) from exc
