"""Site-level tools: overview, categories, scoring method, reference ceilings, routines."""
from __future__ import annotations

from .base import Tool, ToolContext, ToolError, category_param
from .present import benchmark_summary, category_summary

METHOD_RULES = [
    "Formula and skin/scalp-safety points come ONLY from a full published INCI list; seller adjectives in titles/bullets score 0.",
    "A full INCI printed on the marketplace listing wins; if the listing prints none, the brand's official website is used only when the exact product/variant/region is matched (provenance URL + matched title kept). Ambiguous variants are rejected, never guessed.",
    "Partial, garbled or missing INCI → formula and safety stay unscored (0) and the listing says so; nothing is inferred from brand reputation.",
    "Trust = accountable manufacturer (pharma / global / Indian group, with source URL) plus full disclosure.",
    "Buyer ratings are capped: they can support a score, never carry it.",
    "Concern tags (acne, dark spots, aging, irritation) come from verified INCI actives or the category's own purpose — never from claims. Hair pages carry no skin concern tags.",
    "Reference ceilings are fixed at 100 for the best-in-class product of each category regardless of price or country; they sit outside the ranking and are not comparable to listing scores.",
    "Ranking within a category: score descending, then price ascending.",
]


class GetSiteOverview(Tool):
    name = "get_site_overview"
    description = "Dataset snapshot: when it was generated, totals, zones, concern filters, category count and what the site does. Call first if unsure what exists."

    def parameters(self, manifest: dict) -> dict:
        return {"type": "object", "properties": {}}

    async def run(self, args: dict, ctx: ToolContext) -> dict:
        m = await ctx.store.ensure_fresh()
        cats = m.get("categories", [])
        zones: dict[str, int] = {}
        for c in cats:
            zones[c["zone"]] = zones.get(c["zone"], 0) + 1
        return {
            "generatedAt": m.get("generatedAt"),
            "totalListings": m.get("total"),
            "categories": len(cats),
            "categoriesByZone": zones,
            "zoneLabels": m.get("zoneLabels"),
            "concernFilters": m.get("concerns"),
            "referenceCeilings": len(m.get("benchmarks", [])),
            "routines": m.get("routines"),
            "marketplaces": ["Flipkart", "Amazon.in"],
            "siteSections": {"routines": f"{ctx.site_url}/#/", "products": f"{ctx.site_url}/#/products"},
        }


class ListCategories(Tool):
    name = "list_categories"
    description = "All ranked category pages (id, label, zone face/body/hair, listing count, per-concern counts, reference ceiling). Use to map a user's product type to a category id."

    def parameters(self, manifest: dict) -> dict:
        return {"type": "object", "properties": {"zone": {"type": "string", "enum": ["face", "body", "hair", "both"], "description": "Optional zone filter"}}}

    async def run(self, args: dict, ctx: ToolContext) -> dict:
        m = await ctx.store.ensure_fresh()
        zone = args.get("zone")
        rows = [category_summary(c, ctx, ctx.store.benchmark_for(c["id"])) for c in m["categories"] if not zone or c["zone"] == zone]
        return {"count": len(rows), "categories": rows}


class GetScoringMethod(Tool):
    name = "get_scoring_method"
    description = "How listing scores are computed: weights, criteria, evidence rules, cited regulatory/scientific sources, routine scoring."

    def parameters(self, manifest: dict) -> dict:
        return {"type": "object", "properties": {}}

    async def run(self, args: dict, ctx: ToolContext) -> dict:
        m = await ctx.store.ensure_fresh()
        return {
            "weights": m.get("weights"),
            "criteria": m.get("criteria"),
            "rules": METHOD_RULES,
            "evidenceStates": {
                "full": "Full INCI list published/verified (scored)",
                "partial": "Key-ingredients line only (unscored)",
                "garbled": "Unusable ingredient text (unscored)",
                "none": "No ingredient list found (unscored)",
            },
            "inciSourceKinds": {"listing": "marketplace page", "brand-site": "official brand website", "secondary": "third-party database"},
            "filterGroups": m.get("groups"),
            "citedSources": m.get("sources"),
            "routineWeights": m.get("routineWeights"),
            "routineCriteria": m.get("routineCriteria"),
        }


class GetReferenceCeiling(Tool):
    name = "get_reference_ceiling"
    description = "The fixed-100 reference ceiling (best-in-class product) for a category, its cited evidence, and whether/where the exact product is found in the Indian marketplace ranking."

    def parameters(self, manifest: dict) -> dict:
        return {"type": "object", "properties": {"category": category_param(manifest, "Category id")}, "required": ["category"]}

    async def run(self, args: dict, ctx: ToolContext) -> dict:
        await ctx.store.ensure_fresh()
        bench = ctx.store.benchmark_for(str(args.get("category", "")))
        if not bench:
            raise ToolError(f"No reference ceiling is defined for '{args.get('category')}'.")
        return benchmark_summary(bench, ctx)


class GetRoutines(Tool):
    name = "get_routines"
    description = "The published skincare routines (dermatology bodies, named methods, regional traditions) with their sources, scores and step lists. Optional filter by routine category or a name search."

    def parameters(self, manifest: dict) -> dict:
        return {
            "type": "object",
            "properties": {
                "category": {"type": "string", "description": "core | global | method | occasion | concern"},
                "query": {"type": "string", "description": "Text to match in routine brand/name (e.g. 'Korean', 'AAD')"},
                "detail": {"type": "boolean", "description": "Include full morning/evening steps (default false)"},
            },
        }

    async def run(self, args: dict, ctx: ToolContext) -> dict:
        data = await ctx.store.get_routines()
        cat = args.get("category")
        q = str(args.get("query") or "").lower()
        detail = bool(args.get("detail"))
        rows = []
        for r in data.get("items", []):
            if cat and r.get("category") != cat:
                continue
            if q and q not in f"{r.get('brand', '')} {r.get('model', '')}".lower():
                continue
            row = {k: r.get(k) for k in ("id", "category", "brand", "model", "author", "source", "sourceUrl", "timePerDay", "stepsPerDay", "highlight", "score", "scores")}
            if detail:
                row["steps"] = r.get("steps")
            rows.append(row)
        return {"count": len(rows), "of": data.get("count"), "routines": rows[:40], "url": f"{ctx.site_url}/#/"}
