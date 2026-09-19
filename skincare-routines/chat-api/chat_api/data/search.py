"""Slim cross-category search index: one small record per listing plus a token → postings map, so 100k+ rows
fit in well under 100 MB and a query is a few set intersections rather than a scan.

Postings are sorted `array('I')` (4 bytes per entry) rather than Python sets: the service runs on small hosts, and
1.2M set entries alone cost ~75 MB."""
from __future__ import annotations

import bisect
import re
import sys
import unicodedata
from array import array
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
        self._postings: dict[str, array] = {}
        self._vocab: list[str] = []
        self._vocab_dirty = False

    def __len__(self) -> int:
        return len(self._hits)

    def add_category(self, category: str, items: list[dict], ranks: list[int]) -> None:
        for item, rank in zip(items, ranks):
            pos = len(self._hits)
            source = item.get("es")
            hit = Hit(
                category=sys.intern(category), id=item["id"], brand=sys.intern(item["b"]), title=item["m"],
                score=float(item["s"]), rank=rank, price=int(item["p"]), store=sys.intern(item["st"]),
                inci=sys.intern(item["ev"]), inci_source=sys.intern(source) if isinstance(source, str) else None,
            )
            self._hits.append(hit)
            self._by_id.setdefault(hit.id, []).append(hit)
            for tok in set(tokens(f"{item['b']} {item['m']}")):
                self._postings.setdefault(sys.intern(tok), array("I")).append(pos)
        self._vocab_dirty = True

    def _sorted_vocab(self) -> list[str]:
        if self._vocab_dirty:
            self._vocab = sorted(self._postings)
            self._vocab_dirty = False
        return self._vocab

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
        exact = set(self._postings.get(tok, ()))
        prefix: set[int] = set()
        if len(tok) >= 3:
            vocab = self._sorted_vocab()
            start = bisect.bisect_left(vocab, tok)
            for i in range(start, min(start + 400, len(vocab))):
                word = vocab[i]
                if not word.startswith(tok):
                    break
                if word != tok:
                    prefix.update(self._postings[word])
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
        scored = [(s, p) for p, s in strength.items() if not category or self._hits[p].category == category]
        scored.sort(key=lambda pair: (-pair[0], self._hits[pair[1]].rank, -self._hits[pair[1]].score, pair[1]))
        return [(s, self._hits[p]) for s, p in scored[:limit]]
