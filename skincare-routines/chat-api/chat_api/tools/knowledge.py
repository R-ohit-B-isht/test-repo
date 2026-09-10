"""Ingredient knowledge tool: resolves what the user said ("retinol", "BHA", "vit C") to ingredient families and returns
the site's sourced guidance — graded actives, safety flags, pairing verdicts, usage notes — plus the ranked categories
where those actives are core. Twin of src/chat/local/tools/knowledge.ts."""
from __future__ import annotations

import re
import unicodedata

from ..data.source import DataError
from .base import Tool, ToolContext, ToolError

VERDICT_MEANING = {
    "avoid": "do not apply together in the same routine step",
    "caution": "can be combined, but stagger them (AM/PM or alternate nights) and build up slowly",
    "fine": "no evidence of a problem using both",
    "synergy": "evidence they work better or gentler together",
    "essential": "the second is a required companion of the first",
}
VERDICT_ORDER = ["avoid", "caution", "essential", "synergy", "fine"]
EVIDENCE_MEANING = {
    "direct": "a cited study examined this combination",
    "inference": "follows from each ingredient's own cited profile; no study on the pair itself",
    "regulatory": "a regulator's instruction",
}
GRADE = {"A": "multiple RCTs / regulatory monograph", "B": "clinical studies", "C": "in-vitro, animal or manufacturer data"}
NOTE = (
    "General, sourced guidance about ingredients — not a statement about any listing. A product's actual formula must "
    "come from get_product. For prescription drugs, pregnancy, or a skin condition, advise a dermatologist."
)


def norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s.lower())
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9%.\- ]+", " ", s)).strip()


def word_match(text: str, alias: str) -> bool:
    return text == alias or re.search(rf"(^|[^a-z0-9]){re.escape(alias)}([^a-z0-9]|$)", text) is not None


def resolve_family(query: str, families: list[dict]) -> dict | None:
    q = norm(query)
    if not q:
        return None
    best: tuple[dict, int] | None = None
    for fam in families:
        for alias in [*fam["aliases"], *fam["inci"], fam["id"]]:
            a = norm(alias)
            if len(a) > (best[1] if best else 0) and word_match(q, a):
                best = (fam, len(a))
    return best[0] if best else None


def cite(keys: list[str], sources: dict) -> list[dict]:
    return [sources[k] for k in keys if k in sources]


def pairing_summary(p: dict, by_id: dict[str, dict], sources: dict) -> dict:
    return {
        "between": [by_id.get(i, {}).get("label", i) for i in p["pair"]],
        "verdict": p["verdict"], "verdictMeaning": VERDICT_MEANING[p["verdict"]],
        "evidence": p["evidence"], "evidenceMeaning": EVIDENCE_MEANING[p["evidence"]],
        "headline": p["headline"], "detail": p["detail"], "how": p["how"], "sources": cite(p["src"], sources),
    }


def family_summary(fam: dict, kb: dict, manifest: dict, ctx: ToolContext) -> dict:
    sources = manifest.get("sources", {})
    actives = [a for a in kb["actives"] if a["name"] in fam["inci"]]
    counts: dict[str, int] = {}
    for a in actives:
        for r in a["roles"]:
            counts[r] = counts.get(r, 0) + 1
    ranked_in = []
    for cat_id, _ in sorted(counts.items(), key=lambda kv: -kv[1])[:6]:
        meta = ctx.store.category_meta(cat_id) or {}
        ranked_in.append({"category": cat_id, "label": meta.get("label", cat_id), "listings": meta.get("count"), "url": ctx.category_url(cat_id)})
    return {
        "family": fam["id"], "label": fam["label"],
        "actives": [{"inci": a["name"], "grade": a["grade"], "gradeMeaning": GRADE.get(a["grade"]), "source": sources.get(a["src"])} for a in actives],
        "usage": [{"note": n, "sources": cite(u["src"], sources)} for u in kb["usage"] if u["family"] == fam["id"] for n in u["notes"]],
        "rankedIn": ranked_in,
    }


class GetIngredientKnowledge(Tool):
    name = "get_ingredient_knowledge"
    description = (
        "The site's sourced ingredient knowledge for general skincare / hair-care questions: what an ingredient is (evidence grade + cited paper), "
        "whether two ingredients can be layered (verdict avoid / caution / fine / synergy / essential, with the why and how), usage notes "
        "(timing, sun, who should ask a doctor), safety flags, and which ranked categories carry each active. Pass every ingredient, acid or "
        'step the user named (e.g. ["retinol","BHA"]). This is general guidance about ingredients, never about one product\'s formula.'
    )

    def parameters(self, manifest: dict) -> dict:
        return {
            "type": "object",
            "properties": {
                "ingredients": {
                    "type": "array", "items": {"type": "string"}, "minItems": 1, "maxItems": 8,
                    "description": "Ingredient names or families as the user said them, e.g. 'retinol', 'BHA', 'vitamin c', 'glycolic acid', 'heat protectant'",
                },
            },
            "required": ["ingredients"],
        }

    async def run(self, args: dict, ctx: ToolContext) -> dict:
        raw = args.get("ingredients")
        queries = [str(q).strip() for q in raw if str(q).strip()] if isinstance(raw, list) else []
        if not queries:
            raise ToolError("ingredients is required (one or more ingredient names)")
        try:
            kb = await ctx.store.get_knowledge()
        except DataError as exc:
            raise ToolError(str(exc)) from exc
        manifest = await ctx.store.ensure_fresh()
        sources = manifest.get("sources", {})
        by_id = {f["id"]: f for f in kb["families"]}
        resolved: dict[str, dict] = {}
        unresolved: list[str] = []
        for q in queries:
            fam = resolve_family(q, kb["families"])
            if fam:
                resolved[fam["id"]] = fam
            else:
                unresolved.append(q)
        normed = [norm(q) for q in queries]
        flags = [
            {"id": f["id"], "label": f["label"], "examples": f["names"][:6], "source": sources.get(f["src"])}
            for f in kb["flags"]
            if any(word_match(q, norm(f["id"])) or any(word_match(q, norm(n)) for n in f["names"]) for q in normed)
        ]
        among = [p for p in kb["pairings"] if all(i in resolved for i in p["pair"])]
        involving = (
            [p for p in kb["pairings"] if any(i in resolved for i in p["pair"]) and p not in among]
            if len(resolved) == 1 or not among else []
        )
        rank = lambda p: VERDICT_ORDER.index(p["verdict"])  # noqa: E731
        return {
            "asked": queries,
            "ingredients": [family_summary(resolved[i], kb, manifest, ctx) for i in resolved],
            "notInKnowledgeBase": unresolved,
            "pairingsBetweenAsked": [pairing_summary(p, by_id, sources) for p in sorted(among, key=rank)],
            "otherPairings": [pairing_summary(p, by_id, sources) for p in sorted(involving, key=rank)],
            "safetyFlags": flags,
            "note": NOTE,
        }
