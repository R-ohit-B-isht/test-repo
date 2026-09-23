"""Root entrypoint alias: `uvicorn main:app` and `uvicorn app.main:app` are the same FastAPI app."""
from app.main import app

__all__ = ["app"]
