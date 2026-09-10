"""Deployment entrypoint: the hosting platform imports `app` from `app/main.py`; the real package is chat_api."""
from __future__ import annotations

import sys
from pathlib import Path

from fastapi import FastAPI

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from chat_api.main import create_app  # noqa: E402

app: FastAPI = create_app()

__all__ = ["app"]
