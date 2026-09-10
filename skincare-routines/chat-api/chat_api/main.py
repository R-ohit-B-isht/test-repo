"""Composition root: builds settings → data source → store → tool registry → Gemini service, then mounts the routes."""
from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import router
from .config import Settings
from .data.source import DataError, make_source
from .data.store import LedgerStore
from .gemini.service import GeminiService
from .tools.registry import ToolRegistry

log = logging.getLogger("chat_api")


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings.from_env()
    store = LedgerStore(
        make_source(settings.data_source),
        refresh_seconds=settings.refresh_seconds,
        category_cache=settings.category_cache,
        shard_cache=settings.shard_cache,
    )
    registry = ToolRegistry()
    gemini = GeminiService(settings, store, registry)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        store.on_version(lambda version: log.info("dataset version %s — caches cleared, index rebuilt", version))
        if not settings.has_key:
            log.error("GEMINI_API_KEY is not set — /api/chat will answer with a configuration error")
        task = asyncio.create_task(_refresh_loop(store, settings.refresh_seconds))
        try:
            yield
        finally:
            task.cancel()

    app = FastAPI(title="Skin Ledger assistant", version="0.1.0", lifespan=lifespan, docs_url="/api/docs" if settings.is_dev else None, redoc_url=None, openapi_url="/api/openapi.json" if settings.is_dev else None)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_methods=["GET", "POST"],
        allow_headers=["content-type"],
    )
    app.state.settings = settings
    app.state.store = store
    app.state.registry = registry
    app.state.gemini = gemini
    app.include_router(router)
    return app


async def _refresh_loop(store: LedgerStore, seconds: int) -> None:
    """Load the dataset right after the port opens (so the host's health probe is answered while ~100k rows are still being
    indexed), then re-check the manifest periodically so a regenerated dataset is picked up even with no traffic."""
    while True:
        try:
            await store.ensure_fresh()
        except DataError as exc:
            log.warning("dataset not readable (%s); will retry", exc)
        await asyncio.sleep(30 if store.manifest is None else max(30, seconds))


app = create_app()
