"""Manual verification against the real Gemini API: streams one or more questions through GeminiService and prints
every event. Usage: GEMINI_API_KEY=… .venv/bin/python scripts/ask.py "question" [--page '{"category":{"id":"facewash"}}']
or scripts/ask.py --suite to run the standard grounding questions."""
from __future__ import annotations

import argparse
import asyncio
import json
import sys
import time

sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parents[1]))

from chat_api.config import Settings  # noqa: E402
from chat_api.data.source import make_source  # noqa: E402
from chat_api.data.store import LedgerStore  # noqa: E402
from chat_api.gemini.service import GeminiService  # noqa: E402
from chat_api.tools.registry import ToolRegistry  # noqa: E402

SUITE: list[tuple[str, dict]] = [
    ("Where does Cetaphil Gentle Skin Cleanser rank, and where does its INCI come from?", {}),
    ("Why is L'Oréal Revitalift Water Cream scored the way it is?", {}),
    ("Where does Some By Mi AHA BHA PHA 30 Days Miracle Serum rank?", {}),
    ("Best shampoo for acne?", {}),
    ("What's the top calming serum with a full INCI, and how does it compare to the reference ceiling?", {}),
    ("Which categories exist for beard care and how many listings do they have?", {}),
    ("Is the reference ceiling for sunscreen the same as the #1 listing?", {}),
    ("Compare the top two anti-dandruff shampoos under ₹500.", {}),
    ("Why does this one have no formula score?", {"route": "/c/moisturizer", "category": {"id": "moisturizer", "label": "Moisturizer", "zone": "face", "count": 3399}, "product": {"id": "l-oreal-itm155984e002a4d", "brand": "L'Oréal", "title": "Paris Revitalift Hyaluronic Acid Line Filling Water Cream", "rank": 239}}),
    ("What's the weather in Delhi?", {}),
]


async def ask(svc: GeminiService, question: str, page: dict) -> dict:
    print(f"\n=== {question}\n    page={json.dumps(page, ensure_ascii=False)[:160]}")
    started = time.time()
    summary = {"tools": [], "done": None, "error": None, "text": ""}
    async for ev in svc.chat(question, [], page):
        if ev.type == "text":
            summary["text"] += ev.data["delta"]
            print(ev.data["delta"], end="", flush=True)
        elif ev.type == "tool_call":
            summary["tools"].append(ev.data["name"])
            print(f"\n  ▸ {ev.data['name']} {json.dumps(ev.data['args'], ensure_ascii=False)}")
        elif ev.type == "tool_result":
            print(f"    ↳ {ev.data['ms']} ms · {ev.data['bytes']} B · count={ev.data['count']} · error={ev.data['error']}")
        elif ev.type == "done":
            summary["done"] = ev.data
            print(f"\n  ✓ followups={ev.data['followups']} unverified={ev.data['unverifiedCitations']} cited={[p['id'] for p in ev.data['citations']['products']]}")
        elif ev.type == "error":
            summary["error"] = ev.data
            print(f"\n  ✗ {ev.data}")
    print(f"  ({time.time() - started:.1f}s, tools={summary['tools']})")
    return summary


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("question", nargs="?")
    parser.add_argument("--page", default="{}")
    parser.add_argument("--suite", action="store_true")
    args = parser.parse_args()
    settings = Settings.from_env()
    store = LedgerStore(make_source(settings.data_source), refresh_seconds=settings.refresh_seconds, category_cache=settings.category_cache, shard_cache=settings.shard_cache)
    svc = GeminiService(settings, store, ToolRegistry())
    runs = SUITE if args.suite else [(args.question or "What can you do?", json.loads(args.page))]
    failures = 0
    for q, page in runs:
        s = await ask(svc, q, page)
        if s["error"] or not s["tools"] or (s["done"] and s["done"]["unverifiedCitations"]):
            failures += 1
    print(f"\n{len(runs) - failures}/{len(runs)} answers grounded (≥1 tool call, no error, no unverified citation)")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    asyncio.run(main())
