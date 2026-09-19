"""HTTP layer only: validation, SSE framing, dependency wiring. All logic lives in the store / tools / Gemini service."""
from __future__ import annotations

import json
from collections.abc import AsyncIterator

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse

from ..config import Settings
from ..data.source import DataError
from ..data.store import LedgerStore
from ..gemini.service import Event, GeminiService, Turn
from ..tools.base import ToolContext
from ..tools.registry import ToolRegistry
from .schemas import ChatRequest, ToolRunRequest

router = APIRouter(prefix="/api")


def get_settings(request: Request) -> Settings:
    return request.app.state.settings


def get_store(request: Request) -> LedgerStore:
    return request.app.state.store


def get_registry(request: Request) -> ToolRegistry:
    return request.app.state.registry


def get_gemini(request: Request) -> GeminiService:
    return request.app.state.gemini


@router.get("/health")
async def health(settings: Settings = Depends(get_settings), store: LedgerStore = Depends(get_store), gemini: GeminiService = Depends(get_gemini)) -> dict:
    data_ok = True
    try:
        await store.ensure_fresh()
    except DataError:
        data_ok = False
    return {"ok": data_ok and gemini.ready, "assistant": gemini.ready, "data": store.stats(), **settings.public()}


@router.post("/chat")
async def chat(body: ChatRequest, gemini: GeminiService = Depends(get_gemini)) -> StreamingResponse:
    history = [Turn(role=t.role, text=t.text) for t in body.history]
    return StreamingResponse(
        _sse(gemini.chat(body.message, history, body.page)),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no", "Connection": "keep-alive"},
    )


@router.get("/tools")
async def list_tools(settings: Settings = Depends(get_settings), store: LedgerStore = Depends(get_store), registry: ToolRegistry = Depends(get_registry)) -> dict:
    _dev_only(settings)
    manifest = await store.ensure_fresh()
    return {"dataVersion": manifest.get("generatedAt"), "tools": registry.declarations(manifest)}


@router.post("/tools/{name}")
async def run_tool(name: str, body: ToolRunRequest, settings: Settings = Depends(get_settings), store: LedgerStore = Depends(get_store), registry: ToolRegistry = Depends(get_registry)) -> dict:
    _dev_only(settings)
    if name not in registry.names():
        raise HTTPException(404, f"Unknown tool {name}")
    await store.ensure_fresh()
    result, ms = await registry.execute(name, body.args, ToolContext(store=store, site_url=settings.site_url, page=body.page))
    return {"ms": round(ms, 1), "result": result}


def _dev_only(settings: Settings) -> None:
    if not settings.is_dev:
        raise HTTPException(404, "Not found")


async def _sse(events: AsyncIterator[Event]) -> AsyncIterator[str]:
    async for ev in events:
        yield f"event: {ev.type}\ndata: {json.dumps(ev.data, ensure_ascii=False)}\n\n"
