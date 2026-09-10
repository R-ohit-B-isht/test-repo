"""Deployment entrypoint: the hosting platform imports `app` from `app/main.py`; the real package is chat_api."""
from __future__ import annotations

import sys
from pathlib import Path

from fastapi import FastAPI

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from chat_api.config import Settings  # noqa: E402
from chat_api.main import fastapi_options, wire_app  # noqa: E402

settings = Settings.from_env()
app = FastAPI(**fastapi_options(settings))
wire_app(app, settings)

__all__ = ["app"]
