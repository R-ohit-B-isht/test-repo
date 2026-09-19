"""Maps plain words ("water repellent", "tinted", "fragrance free") onto a category's real facet tags — twin of
src/chat/local/tools/facetHints.ts. Only options that exist in the category (with a live count) are ever returned."""
from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass

SYNONYMS: dict[str, list[str]] = {
    "repellent": ["resistant", "water"], "repellant": ["resistant", "water"], "waterproof": ["water", "resistant"], "proof": ["resistant"],
    "hydrophobic": ["water", "resistant"], "sweatproof": ["sweat"], "swim": ["sport"], "swimming": ["sport"], "sports": ["sport"], "gym": ["sport"],
    "tint": ["tinted"], "colour": ["tinted"], "color": ["tinted"], "no-fragrance": ["fragrance"], "unscented": ["fragrance"], "perfume": ["fragrance"],
    "scent": ["fragrance"], "physical": ["mineral"], "organic": ["chemical"], "filter": ["mineral", "chemical", "hybrid"],
    "cheap": ["budget"], "verified": ["full", "brand-site"], "official": ["brand-site"], "ingredients": ["inci", "full"], "inci": ["inci", "full"],
    "men": ["men"], "man": ["men"], "male": ["men"], "women": ["women"], "woman": ["women"], "female": ["women"], "baby": ["kids"], "child": ["kids"],
    "pimple": ["acne"], "pimples": ["acne"], "breakouts": ["acne"], "marks": ["dark-spots"], "pigmentation": ["dark-spots"], "wrinkles": ["aging"],
    "antiaging": ["aging"], "anti-aging": ["aging"], "redness": ["irritation"], "sensitive": ["sensitive", "irritation"], "calming": ["irritation"],
    "big": ["large", "xl"], "small": ["travel"], "mini": ["travel"], "flipkart": ["flipkart"], "amazon": ["amazon"],
}

STOP = {"and", "or", "with", "for", "the", "a", "an", "of", "in", "on", "to", "that", "is", "are", "any", "some", "skin", "hair",
        "product", "products", "listing", "listings", "stated", "not", "no"}

_SPLIT = re.compile(r"[^a-z0-9+-]+")


def words_of(text: str) -> list[str]:
    folded = unicodedata.normalize("NFKD", text.lower())
    folded = "".join(ch for ch in folded if not unicodedata.combining(ch))
    return [w for w in _SPLIT.split(folded) if w and w not in STOP]


def _expand(words: list[str]) -> list[str]:
    out: dict[str, None] = {}
    for w in words:
        out[w] = None
        for s in SYNONYMS.get(w, []):
            out[s] = None
        if w.endswith("s") and len(w) > 4:
            out[w[:-1]] = None
    return list(out)


def _stem(w: str) -> str:
    return w[:5] if len(w) > 5 else w


@dataclass
class FacetHit:
    tag: str
    label: str
    count: int
    group: str
    groupLabel: str
    score: int

    def public(self) -> dict:
        return {"tag": self.tag, "label": self.label, "count": self.count, "group": self.group, "groupLabel": self.groupLabel}


def match_facets(query: str, facets: dict[str, list[dict]], groups: dict, limit: int = 8) -> list[FacetHit]:
    """Facet options whose id/label/group share words with `query`, best first (empty when nothing plausible)."""
    wanted = _expand(words_of(query.replace(":", " ")))
    if not wanted:
        return []
    hits: list[FacetHit] = []
    for group, rows in facets.items():
        group_label = str(groups.get(group, {}).get("label", group))
        group_words = {group, *words_of(group_label)}
        for row in rows:
            value = row["tag"][len(group) + 1:]
            option_words = {value, *value.split("-"), *words_of(row["label"])}
            score = 0
            for w in wanted:
                if w in option_words:
                    score += 3
                elif any(o.startswith(_stem(w)) or w.startswith(_stem(o)) for o in option_words):
                    score += 2
                elif w in group_words:
                    score += 1
            if score > 0 and row["count"] > 0:
                hits.append(FacetHit(row["tag"], row["label"], row["count"], group, group_label, score))
    hits.sort(key=lambda h: (-h.score, -h.count))
    return hits[:limit]
