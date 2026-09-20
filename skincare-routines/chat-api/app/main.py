"""Deployment entrypoint: the hosting platform imports `app` from `app/main.py`; the real package is chat_api.
Kept to the most literal FastAPI shape (a module-level `app = FastAPI(...)` with plain kwargs) so the platform's
app detection finds it; docs stay off in deployment."""
from __future__ import annotations

import sys
from pathlib import Path

from fastapi import FastAPI

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from chat_api.config import Settings  # noqa: E402
from chat_api.main import wire_app  # noqa: E402

app = FastAPI(title="Skin Ledger assistant", version="0.1.0", docs_url=None, redoc_url=None, openapi_url=None)
wire_app(app, Settings.from_env())

__all__ = ["app"]
