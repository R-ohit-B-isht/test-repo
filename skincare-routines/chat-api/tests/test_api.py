"""HTTP surface: health never leaks the key, /api/chat streams honest SSE errors without a key, dev-only tool routes."""
from __future__ import annotations

import json
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from dataclasses import replace

import pytest
from httpx import ASGITransport, AsyncClient

from chat_api.config import Settings
from chat_api.gemini.stream import CitationBook, TailSplitter, cited_ids
from chat_api.main import create_app

def parse_sse(body: str) -> list[tuple[str, dict]]:
    events = []
    for block in body.strip().split("\n\n"):
        lines = dict(line.split(": ", 1) for line in block.splitlines())
        events.append((lines["event"], json.loads(lines["data"])))
    return events


@asynccontextmanager
async def client_for(settings: Settings) -> AsyncIterator[AsyncClient]:
    app = create_app(settings)
    async with app.router.lifespan_context(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            yield client


async def test_health_reports_dataset_without_secrets(settings: Settings):
    async with client_for(replace(settings, gemini_api_key="sk-test-not-a-real-key")) as client:
        res = await client.get("/api/health")
    body = res.json()
    assert res.status_code == 200 and body["ok"] and body["assistant"] is True
    assert body["data"]["version"] == "2026-01-01T00:00:00.000Z" and body["data"]["indexed"] > 0
    assert "sk-test" not in res.text and "gemini_api_key" not in res.text and "GEMINI" not in res.text


async def test_chat_without_key_streams_honest_error(settings: Settings):
    async with client_for(settings) as client:
        res = await client.post("/api/chat", json={"message": "Where does Cetaphil rank?"})
    assert res.status_code == 200 and res.headers["content-type"].startswith("text/event-stream")
    events = parse_sse(res.text)
    assert events == [("error", {"message": "The assistant is not configured on the server (no Gemini key).", "code": "no-key"})]


async def test_chat_validates_input(settings: Settings):
    async with client_for(settings) as client:
        assert (await client.post("/api/chat", json={"message": ""})).status_code == 422
        assert (await client.post("/api/chat", json={"message": "x" * 4001})).status_code == 422
        assert (await client.post("/api/chat", json={"message": "hi", "history": [{"role": "system", "text": "x"}]})).status_code == 422


async def test_tool_routes_are_dev_only(settings: Settings):
    async with client_for(settings) as client:
        listed = await client.get("/api/tools")
        ran = await client.post("/api/tools/get_top_products", json={"args": {"category": "kp", "limit": 2}})
    assert listed.status_code == 200 and "get_top_products" in [t["name"] for t in listed.json()["tools"]]
    assert ran.status_code == 200 and [p["rank"] for p in ran.json()["result"]["results"]] == [1, 2]

    async with client_for(replace(settings, is_dev=False)) as client:
        assert (await client.get("/api/tools")).status_code == 404
        assert (await client.post("/api/tools/get_top_products", json={"args": {}})).status_code == 404
        assert (await client.get("/api/docs")).status_code == 404


def test_tail_splitter_holds_back_followups_and_detects_runaway():
    s = TailSplitter()
    out = s.push("Cetaphil ranks #1.\nFOLLOW")
    out += s.push("UPS: a | b | c")
    assert out.strip() == "Cetaphil ranks #1."
    assert s.flush() == "" and s.followups() == ["a", "b", "c"]
    assert not s.runaway()
    r = TailSplitter()
    r.push("| a |" + " " * 500)
    assert r.runaway()


def test_citation_book_only_links_ids_a_tool_returned():
    book = CitationBook()
    book.absorb("get_top_products", {"category": "kp", "url": "u", "products": [{"id": "p1", "category": "kp", "brand": "B", "title": "T", "rank": 1, "of": 2, "score": 9.0, "priceInr": 1, "store": "flipkart", "url": "x"}]})
    book.absorb("get_reference_ceiling", {"category": "kp", "brand": "AmLactin", "name": "12%", "makerPage": {"url": "https://maker.example", "label": "maker"}, "marketplaceListing": {"id": "p2", "title": "AmLactin listing", "rank": 5, "of": 9, "url": "y"}})
    answer = "Top is T [[p1]] in [[cat:kp]]; ceiling listing [[p2]]; ghost [[p3]]."
    assert cited_ids(answer) == ["p1", "cat:kp", "p2", "p3"]
    assert book.unverified(answer) == ["p3"]
    payload = book.payload(answer)
    assert {c["id"] for c in payload["products"]} == {"p1", "p2"}
    assert "https://maker.example" in {e["url"] for e in payload["external"]}


def test_citation_book_labels_categories_from_manifest_meta():
    meta = {"kp": {"id": "kp", "label": "Keratosis pilaris", "zone": "body", "count": 913}}
    book = CitationBook(meta.get)
    book.absorb("search_products", {"products": [{"id": "p1", "category": "kp", "brand": "B", "title": "T"}]})
    book.absorb("get_top_products", {"category": "ghost", "url": "u", "products": []})
    payload = book.payload("See [[p1]] in [[cat:kp]] and [[cat:ghost]].")
    labels = {c["id"]: c for c in payload["categories"]}
    assert labels["kp"]["label"] == "Keratosis pilaris" and labels["kp"]["listings"] == 913
    assert labels["ghost"]["label"] is None and labels["ghost"]["url"] == "u"


def test_citation_book_prefers_page_category_placement_for_multi_ranked_listing():
    row = {"id": "p1", "brand": "B", "title": "T"}
    book = CitationBook(page_category="detan")
    book.absorb("search_products", {"products": [{**row, "category": "bodyscrub", "rank": 5, "of": 100}]})
    book.absorb("search_products", {"products": [{**row, "category": "kp", "rank": 1, "of": 50}]})
    assert book.payload("[[p1]]")["products"][0]["category"] == "bodyscrub"  # first grounding wins over an unrelated category
    book.absorb("get_product", {"products": [{**row, "category": "detan", "rank": 9, "of": 800}]})
    payload = book.payload("[[p1]] in [[cat:kp]]")
    assert payload["products"][0]["category"] == "detan" and payload["products"][0]["rank"] == 9
    assert [c["id"] for c in payload["categories"]] == ["kp"]  # every category a row came from stays citable
