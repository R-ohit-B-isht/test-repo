"""Text-stream helpers: hold back the trailing FOLLOWUPS line while streaming, and collect citations."""
from __future__ import annotations

import re

from .prompt import FOLLOWUP_MARKER

_CITE = re.compile(r"\[\[([^\]]+)\]\]")


class TailSplitter:
    """Streams text through, but withholds anything that could be the start of the FOLLOWUPS marker until we know.
    Once the marker is seen, everything after it is captured as the follow-up line instead of being emitted."""

    def __init__(self) -> None:
        self._pending = ""
        self._tail = ""
        self._in_tail = False
        self.emitted = ""

    def push(self, delta: str) -> str:
        if self._in_tail:
            self._tail += delta
            return ""
        self._pending += delta
        idx = self._pending.find(FOLLOWUP_MARKER)
        if idx != -1:
            out, self._tail = self._pending[:idx], self._pending[idx + len(FOLLOWUP_MARKER):]
            self._pending = ""
            self._in_tail = True
            self.emitted += out
            return out
        hold = _longest_prefix_suffix(self._pending, FOLLOWUP_MARKER)
        out = self._pending[: len(self._pending) - hold] if hold else self._pending
        self._pending = self._pending[len(out):]
        self.emitted += out
        return out

    def runaway(self) -> bool:
        """Degenerate generation: a long run of whitespace/padding, or an answer far beyond anything a user asked for."""
        tail = self.emitted[-400:]
        return len(self.emitted) > 16_000 or (len(tail) == 400 and len(tail.strip()) == 0) or "    " * 40 in tail

    def flush(self) -> str:
        out, self._pending = self._pending, ""
        self.emitted += out
        return out.rstrip()

    def followups(self) -> list[str]:
        raw = self._tail.strip().lstrip(":").strip()
        parts = [p.strip().strip("-•").strip() for p in raw.split("|")]
        return [p for p in parts if p][:3]


def _longest_prefix_suffix(text: str, marker: str) -> int:
    """Length of the longest suffix of `text` that is a proper prefix of `marker`."""
    for n in range(min(len(text), len(marker) - 1), 0, -1):
        if text.endswith(marker[:n]):
            return n
    return 0


def cited_ids(text: str) -> list[str]:
    return list(dict.fromkeys(_CITE.findall(text)))


class CitationBook:
    """Collects every listing/category a tool returned so the frontend can resolve [[id]] markers to real links."""

    def __init__(self) -> None:
        self.products: dict[str, dict] = {}
        self.categories: dict[str, dict] = {}
        self.external: dict[str, dict] = {}

    def absorb(self, tool: str, result: dict) -> None:
        for row in _rows(result):
            pid = row.get("id")
            if pid and row.get("category") and row.get("title"):
                self.products[pid] = {k: row.get(k) for k in ("id", "category", "brand", "title", "rank", "of", "score", "priceInr", "store", "url")}
            detail = row.get("detail") or {}
            ev = detail.get("evidence") or {}
            if ev.get("inciSourceUrl"):
                self.external[ev["inciSourceUrl"]] = {"label": ev.get("inciSource") or "INCI source", "url": ev["inciSourceUrl"], "kind": ev.get("inciSourceKind")}
        for cat in result.get("categories", []) if tool == "list_categories" else []:
            self.categories[cat["id"]] = {k: cat.get(k) for k in ("id", "label", "zone", "listings", "url")}
        if tool == "get_reference_ceiling":
            maker = result.get("makerPage") or {}
            if maker.get("url"):
                self.external[maker["url"]] = {"label": f"{result['brand']} {result['name']} — {maker.get('label', 'maker page')}", "url": maker["url"], "kind": "maker"}
            listing = result.get("marketplaceListing") or {}
            if listing.get("id"):
                self.products[listing["id"]] = {
                    "id": listing["id"], "category": result["category"], "brand": result["brand"], "title": listing.get("title") or result["name"],
                    "rank": listing.get("rank"), "of": listing.get("of"), "score": listing.get("listingScore"), "priceInr": listing.get("priceInr"),
                    "store": listing.get("store"), "url": listing.get("url"),
                }
        if tool in {"get_top_products", "get_category_filters"} and result.get("category"):
            self.categories.setdefault(result["category"], {"id": result["category"], "url": result.get("url")})

    def unverified(self, answer: str) -> list[str]:
        """Ids the model cited that no tool returned in this turn — the frontend must not link them."""
        known = set(self.products) | {f"cat:{c}" for c in self.categories}
        return [i for i in cited_ids(answer) if i not in known]

    def payload(self, answer: str) -> dict:
        used = cited_ids(answer)
        return {
            "products": [self.products[i] for i in used if i in self.products] or list(self.products.values())[:8],
            "categories": [self.categories[i[4:]] for i in used if i.startswith("cat:") and i[4:] in self.categories],
            "external": list(self.external.values())[:6],
        }


def _rows(result: dict) -> list[dict]:
    if "results" in result and isinstance(result["results"], list):
        return result["results"]
    if "products" in result and isinstance(result["products"], list):
        return result["products"]
    if result.get("id") and result.get("category"):
        return [result]
    return []
