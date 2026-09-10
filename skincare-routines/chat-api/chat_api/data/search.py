"""Slim cross-category search index: one small record per listing plus a token → postings map, so 100k+ rows
fit in well under 100 MB and a query is a few set intersections rather than a scan."""
from __future__ import annotations

import bisect
import re
import sys
import unicodedata
from dataclasses import dataclass

_TOKEN = re.compile(r"[a-z0-9]+")
_APOSTROPHES = str.maketrans("", "", "'’`")


def fold(text: str) -> str:
    """Lower-case, strip accents and apostrophes (L'Oréal → loreal) so brand names match however they were typed."""
    return unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode().lower().translate(_APOSTROPHES)


def tokens(text: str) -> list[str]:
    return _TOKEN.findall(fold(text))


@dataclass(slots=True)
class Hit:
    category: str
    id: str
    brand: str
    title: str
    score: float
    rank: int
    price: int
    store: str
    inci: str
    inci_source: str | None


class SearchIndex:
    def __init__(self) -> None:
        self._hits: list[Hit] = []
        self._by_id: dict[str, list[Hit]] = {}
        self._postings: dict[str, set[int]] = {}
        self._vocab: list[str] = []

    def __len__(self) -> int:
        return len(self._hits)

    def add_category(self, category: str, items: list[dict], ranks: list[int]) -> None:
        for item, rank in zip(items, ranks):
            pos = len(self._hits)
            hit = Hit(
                category=category, id=item["id"], brand=item["b"], title=item["m"], score=float(item["s"]), rank=rank,
                price=int(item["p"]), store=item["st"], inci=item["ev"], inci_source=item.get("es"),
            )
            self._hits.append(hit)
            self._by_id.setdefault(hit.id, []).append(hit)
            for tok in set(tokens(f"{item['b']} {item['m']}")):
                self._postings.setdefault(sys.intern(tok), set()).add(pos)
        self._vocab = sorted(self._postings)

    def get(self, product_id: str, prefer_category: str | None = None) -> Hit | None:
        """One marketplace listing can be ranked in several categories (a scrub in body scrub + de-tan): the same id, different rank/of.
        Prefer the placement the caller is looking at, else the placement where it ranks best."""
        hits = self._by_id.get(product_id)
        if not hits:
            return None
        for hit in hits:
            if hit.category == prefer_category:
                return hit
        return min(hits, key=lambda h: h.rank)

    def placements(self, product_id: str) -> list[Hit]:
        return list(self._by_id.get(product_id, []))

    def _candidates(self, tok: str) -> tuple[set[int], set[int]]:
        """(exact postings, prefix postings) for one query token."""
        exact = self._postings.get(tok, set())
        prefix: set[int] = set()
        if len(tok) >= 3:
            start = bisect.bisect_left(self._vocab, tok)
            for i in range(start, min(start + 400, len(self._vocab))):
                word = self._vocab[i]
                if not word.startswith(tok):
                    break
                if word != tok:
                    prefix |= self._postings[word]
        return exact, prefix

    def search(self, query: str, *, category: str | None = None, limit: int = 10) -> list[tuple[float, Hit]]:
        """Every query token must match (whole = 1.0, prefix = 0.5); ordered by match strength, then site rank."""
        q = list(dict.fromkeys(tokens(query)))
        if not q:
            return []
        strength: dict[int, float] | None = None
        for tok in q:
            exact, prefix = self._candidates(tok)
            step = {p: 1.0 for p in exact}
            for p in prefix:
                step.setdefault(p, 0.5)
            if strength is None:
                strength = step
            else:
                strength = {p: s + step[p] for p, s in strength.items() if p in step}
            if not strength:
                return []
        assert strength is not None
        scored = [(s, self._hits[p]) for p, s in strength.items() if not category or self._hits[p].category == category]
        scored.sort(key=lambda pair: (-pair[0], pair[1].rank, -pair[1].score))
        return scored[:limit]
