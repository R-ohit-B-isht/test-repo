from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class HistoryTurn(BaseModel):
    role: Literal["user", "model"]
    text: str = Field(max_length=8000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    history: list[HistoryTurn] = Field(default_factory=list, max_length=24)
    page: dict = Field(default_factory=dict)


class ToolRunRequest(BaseModel):
    args: dict = Field(default_factory=dict)
    page: dict = Field(default_factory=dict)
