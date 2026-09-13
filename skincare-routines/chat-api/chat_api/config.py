"""Environment-driven settings. The Gemini key lives here and nowhere else — it is never serialised or logged."""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

DEFAULT_DATA_DIR = Path(__file__).resolve().parents[2] / "public" / "data"
DOTENV = Path(__file__).resolve().parents[1] / ".env"


def _csv(value: str) -> list[str]:
    return [v.strip() for v in value.split(",") if v.strip()]


def _load_dotenv(path: Path, env: dict[str, str]) -> None:
    """KEY=value lines from a git-ignored .env next to pyproject; real environment variables always win."""
    if not path.is_file():
        return
    for raw in path.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env.setdefault(key.strip(), value.strip().strip('"').strip("'"))


@dataclass(frozen=True)
class Settings:
    gemini_api_key: str
    model: str = "gemini-2.5-flash"
    followup_model: str = "gemini-2.5-flash-lite"
    data_source: str = str(DEFAULT_DATA_DIR)
    site_url: str = ""
    allowed_origins: list[str] = field(default_factory=lambda: ["*"])
    refresh_seconds: int = 300
    category_cache: int = 8
    shard_cache: int = 24
    is_dev: bool = False
    max_tool_rounds: int = 8
    max_answer_tokens: int = 1800

    @property
    def has_key(self) -> bool:
        return bool(self.gemini_api_key)

    @staticmethod
    def from_env() -> "Settings":
        env = dict(os.environ)
        _load_dotenv(DOTENV, env)
        return Settings(
            gemini_api_key=env.get("GEMINI_API_KEY", ""),
            model=env.get("GEMINI_MODEL", "gemini-2.5-flash"),
            followup_model=env.get("GEMINI_FOLLOWUP_MODEL", "gemini-2.5-flash-lite"),
            data_source=env.get("LEDGER_DATA", str(DEFAULT_DATA_DIR)),
            site_url=env.get("LEDGER_SITE_URL", "").rstrip("/"),
            allowed_origins=_csv(env.get("ALLOWED_ORIGINS", "*")),
            refresh_seconds=int(env.get("DATA_REFRESH_SECONDS", "300")),
            category_cache=int(env.get("CATEGORY_CACHE", "8")),
            shard_cache=int(env.get("SHARD_CACHE", "24")),
            is_dev=env.get("IS_DEV", "").lower() in {"1", "true", "yes"},
            max_tool_rounds=int(env.get("MAX_TOOL_ROUNDS", "8")),
            max_answer_tokens=int(env.get("MAX_ANSWER_TOKENS", "1800")),
        )

    def public(self) -> dict:
        """Safe-to-expose subset for /api/health and the dev panel."""
        return {
            "model": self.model,
            "dataSource": "http" if self.data_source.startswith("http") else "file",
            "isDev": self.is_dev,
            "hasKey": self.has_key,
        }
