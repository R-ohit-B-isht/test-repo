"""Text-stream helpers: hold back the trailing FOLLOWUPS line while streaming, and collect citations."""
from __future__ import annotations

import re
from collections.abc import Callable

from .prompt import FOLLOWUP_MARKER

_CITE = re.compile(r"\[\[([^\]]+)\]\]")
_RUN = re.compile(r"(.)\1{119}")  # 120× the same character: a table separator or whitespace loop, never prose


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
        return len(self.emitted) > 16_000 or (len(tail) == 400 and len(tail.strip()) == 0) or bool(_RUN.search(tail))

    def flush(self) -> str:
        out, self._pending = self._pending, ""
        self.emitted += out
        return out.rstrip()

    def followups(self) -> list[str]:
        raw = self._tail.strip().lstrip(":").strip()
        # Chips are plain buttons, not markdown — a stray [[id]] would show up literally.
        parts = [
            re.sub(r"\s+([?.!])$", r"\1", re.sub(r"\s{2,}", " ", _CITE.sub("", p)).strip().strip("-•").strip())
            for p in raw.split("|")
        ]
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

    def __init__(self, category_meta: Callable[[str], dict | None] = lambda _cid: None, page_category: str | None = None) -> None:
        self.products: dict[str, dict] = {}
        self.categories: dict[str, dict] = {}
        self.external: dict[str, dict] = {}
        self._category_meta = category_meta
        self._page_category = page_category

    def _touch_category(self, cid: str | None, url: str | None = None) -> None:
        if not cid or cid in self.categories:
            return
        meta = self._category_meta(cid) or {}
        self.categories[cid] = {"id": cid, "label": meta.get("label"), "zone": meta.get("zone"), "listings": meta.get("count"), "url": url}

    def _keep_placement(self, pid: str, category: str) -> bool:
        """One listing can be ranked in several categories. The card must show ONE placement: the page's category if a tool
        returned it, otherwise the placement the answer was first grounded on."""
        seen = self.products.get(pid)
        return seen is None or seen["category"] == category or category == self._page_category

    def absorb(self, tool: str, result: dict) -> None:
        for row in _rows(result):
            pid = row.get("id")
            if pid and row.get("category") and row.get("title"):
                self._touch_category(row["category"])
                if self._keep_placement(pid, row["category"]):
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
        if tool == "get_ingredient_knowledge":
            self._absorb_knowledge(result)
        if isinstance(result.get("category"), str):
            self._touch_category(result["category"], result.get("url"))

    def _absorb_knowledge(self, result: dict) -> None:
        """Categories where an asked ingredient is a core active become citable; the studies behind the pairing verdicts
        become external sources so general guidance carries its provenance like a listing does."""
        for ing in result.get("ingredients", []):
            for ranked in ing.get("rankedIn", []):
                self._touch_category(ranked.get("category"), ranked.get("url"))
        for pairing in result.get("pairingsBetweenAsked", []):
            for src in pairing.get("sources", []):
                if src.get("url"):
                    self.external.setdefault(src["url"], {"label": src.get("label") or "study", "url": src["url"], "kind": "study"})

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
