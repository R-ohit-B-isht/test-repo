"""Shape store records into compact, evidence-preserving dicts for the model. Nothing is inferred here —
every field is copied from the generated data, and uncertainty states are spelled out in words."""
from __future__ import annotations

from ..data.search import Hit
from ..data.store import CategoryView
from .base import ToolContext

INCI_STATE = {
    "full": "full INCI list verified — formula and safety are scored",
    "partial": "only a key-ingredients line — formula and safety NOT scored (0)",
    "garbled": "ingredient text on the listing is garbled/unusable — NOT scored (0)",
    "none": "no ingredient list published anywhere we could verify — NOT scored (0)",
}
INCI_SOURCE = {
    "listing": "printed on the marketplace listing itself",
    "brand-site": "read from the brand's official website (exact product matched)",
    "secondary": "third-party ingredient database (labelled as lower-confidence)",
}


def inci_sentence(status: str, source: str | None) -> str:
    text = INCI_STATE.get(status, status)
    if status == "full" and source:
        text += f"; source: {INCI_SOURCE.get(source, source)}"
    return text


def row_summary(cat: CategoryView, pos: int, ctx: ToolContext) -> dict:
    item = cat.items[pos]
    return {
        "id": item["id"],
        "category": cat.id,
        "rank": cat.ranks[pos],
        "of": len(cat.items),
        "brand": item["b"],
        "title": item["m"],
        "score": item["s"],
        "breakdown": item["sc"],
        "priceInr": item["p"],
        "quantity": item.get("q"),
        "store": item["st"],
        "rating": item.get("r"),
        "ratingCount": item.get("rc"),
        "inci": inci_sentence(item["ev"], item.get("es")),
        "inciStatus": item["ev"],
        "inciSourceKind": item.get("es"),
        "tags": cat.tags_of(item),
        "url": ctx.product_url(cat.id, item["id"]),
    }


def hit_summary(hit: Hit, strength: float, ctx: ToolContext, total: int | None) -> dict:
    return {
        "id": hit.id,
        "category": hit.category,
        "rank": hit.rank,
        "of": total,
        "brand": hit.brand,
        "title": hit.title,
        "score": hit.score,
        "priceInr": hit.price,
        "store": hit.store,
        "inci": inci_sentence(hit.inci, hit.inci_source),
        "inciStatus": hit.inci,
        "inciSourceKind": hit.inci_source,
        "match": "exact tokens" if strength == int(strength) else "partial (prefix) match — confirm with the user",
        "url": ctx.product_url(hit.category, hit.id),
    }


def detail_summary(detail: dict) -> dict:
    ev = detail["evidence"]
    spec = detail.get("fullSpec", {})
    return {
        "fullTitle": detail["title"],
        "summary": detail.get("highlight"),
        "pros": detail.get("pros", []),
        "cons": detail.get("cons", []),
        "buyUrl": detail.get("buyUrl"),
        "buyStore": detail.get("buyStore"),
        "evidence": {
            "inciStatus": ev["inci"],
            "inciStatusMeaning": inci_sentence(ev["inci"], ev.get("inciSourceKind")),
            "inciSource": ev.get("inciSource"),
            "inciSourceKind": ev.get("inciSourceKind"),
            "inciSourceUrl": ev.get("inciSourceUrl"),
            "inciSourceRegion": ev.get("inciSourceRegion"),
            "inciMatchedOfficialTitle": ev.get("inciMatchedTitle"),
            "inciMatchScore": ev.get("inciMatchScore"),
            "inciNote": ev.get("inciNote"),
            "inciList": ev.get("inciText"),
            "unverifiedIngredientLine": ev.get("inciUnverified"),
            "recognisedIngredients": ev.get("recognised"),
            "evidenceActives": ev.get("actives", []),
            "safetyFlags": ev.get("flags", []),
            "formulaNotes": ev.get("formulaNotes", []),
            "maker": ev.get("maker"),
            "buyerEvidence": ev.get("buyers"),
            "supportingIngredientsOnInci": ev.get("support", []),
        },
        "listingFacts": {k: spec[k] for k in ("quantity", "pricePer100", "format", "skinType", "hairType", "madeIn", "rating") if k in spec},
        "sellerClaimsShownNotScored": {k: spec[k] for k in ("keyIngredients", "freeFrom", "dermTested", "nonComedogenic", "benefit", "naturalClaim", "waterResistance") if k in spec},
    }


def benchmark_summary(bench: dict, ctx: ToolContext) -> dict:
    market = bench.get("market", {})
    out = {
        "category": bench["category"],
        "brand": bench["brand"],
        "name": bench["name"],
        "variant": bench.get("variant"),
        "role": "fixed reference ceiling = 100; this is NOT a marketplace listing score and sits outside the ranking",
        "why": bench.get("why"),
        "facts": bench.get("facts", []),
        "evidence": bench.get("evidence", []),
        "makerPage": bench.get("maker"),
        "caution": bench.get("caution"),
        "marketplaceStatus": market.get("status"),
        "marketplaceNote": market.get("note"),
    }
    if market.get("status") in {"found", "related"}:
        out["marketplaceListing"] = {
            "id": market.get("id"),
            "rank": market.get("rank"),
            "of": market.get("of"),
            "listingScore": market.get("score"),
            "priceInr": market.get("price"),
            "store": market.get("store"),
            "title": market.get("title"),
            "inci": market.get("ev"),
            "url": ctx.product_url(bench["category"], market["id"]) if market.get("id") else None,
            "identity": "exact same product" if market["status"] == "found" else "RELATED listing only — not verified identical",
        }
    return out


def category_summary(meta: dict, ctx: ToolContext, bench: dict | None) -> dict:
    return {
        "id": meta["id"],
        "label": meta["label"],
        "zone": meta["zone"],
        "step": meta.get("kicker"),
        "blurb": meta.get("blurb"),
        "listings": meta["count"],
        "byConcern": meta.get("byConcern", {}),
        "stores": meta.get("stores", {}),
        "referenceCeiling": f"{bench['brand']} {bench['name']}" if bench else None,
        "url": ctx.category_url(meta["id"]),
    }
