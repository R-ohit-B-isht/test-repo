"""Ingredient matching for the product tools — twin of scripts/lib/inci-aliases.cjs and src/chat/local/tools/inciMatch.ts.

Query terms get the same normalisation as the indexed INCI columns, widen through the alias table
("iron oxide" → CI 77491/77492/77499) and are matched as whole ingredient names."""
from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, field

_CI = re.compile(r"\bc\.?\s?i\.?\s*(?:no\.?)?\s*[-:.]?\s*(\d{5})\b")
_SEP = re.compile(r"\(\s*and\s*\)|[,;/|\u2022\u00b7]|\s\band\b\s")
_JUNK = re.compile(r"[^a-z0-9,]+")


def normalize_inci(text: str) -> str:
    t = unicodedata.normalize("NFKD", text or "")
    t = "".join(ch for ch in t if not unicodedata.combining(ch)).lower()
    t = _CI.sub(r"ci \1", t)
    t = _SEP.sub(",", t)
    t = _JUNK.sub(" ", t)
    t = re.sub(r"\s*,\s*", ",", t)
    t = re.sub(r",+", ",", t)
    return t.strip(",").strip()


@dataclass
class IngredientQuery:
    term: str
    label: str | None
    inci: list[str]
    whole: list[str]
    patterns: list[re.Pattern[str]] = field(default_factory=list)
    whole_patterns: list[re.Pattern[str]] = field(default_factory=list)

    def looking_for(self) -> list[str]:
        return [*self.inci, *self.whole]


# Entries with this many INCI names or fewer are one substance under a few spellings; larger ones are groups
# (mineral filters, retinoids) that a single INCI name must never widen into. Same constant as inci-aliases.cjs.
SYNONYM_ENTRY_MAX = 3


def resolve_alias_entries(t: str, aliases: list[dict]) -> list[dict]:
    own = [e for e in aliases if t in e.get("aliases", []) or t in e.get("whole", []) or str(e.get("id", "")).lower() == t]
    if own:
        return own
    return [e for e in aliases if t in e.get("inci", []) and len(e.get("inci", [])) <= SYNONYM_ENTRY_MAX]


def expand_ingredient(term: str, aliases: list[dict]) -> IngredientQuery:
    t = normalize_inci(term)
    inci: dict[str, None] = {}
    whole: dict[str, None] = {}
    labels: list[str] = []
    for entry in resolve_alias_entries(t, aliases):
        for n in entry.get("inci", []):
            inci[n] = None
        for n in entry.get("whole", []):
            whole[n] = None
        labels.append(str(entry.get("label", "")))
    if t and t not in whole and not labels:
        inci[t] = None
    names = list(inci)
    whole_names = list(whole)
    return IngredientQuery(
        term=term,
        label=labels[0] if labels else None,
        inci=names,
        whole=whole_names,
        patterns=[re.compile(rf"(?:^|[ ,]){re.escape(n)}(?:s|es)?(?:[ ,]|$)") for n in names],
        whole_patterns=[re.compile(rf"(?:^|,){re.escape(n)}(?:,|$)") for n in whole_names],
    )


def find_ingredient(text: str, q: IngredientQuery) -> str | None:
    """The first name of `q` found in normalised INCI text, or None."""
    for name, pat in zip(q.inci, q.patterns, strict=True):
        if pat.search(text):
            return name
    for name, pat in zip(q.whole, q.whole_patterns, strict=True):
        if pat.search(text):
            return name
    return None


def title_tokens(text: str) -> list[str]:
    return [tok for tok in normalize_inci(text).replace(",", " ").split(" ") if tok]


def title_has_words(tokens: list[str], words: list[str]) -> bool:
    """Every word (prefix match per token) appears in the folded brand + title."""
    return all(all(any(tok == p or tok.startswith(p) for tok in tokens) for p in title_tokens(w)) for w in words)
