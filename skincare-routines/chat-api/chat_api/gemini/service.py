"""Gemini tool-calling loop. Yields typed events the API layer serialises as SSE:
meta → (tool_call → tool_result)* → text* → done | error."""
from __future__ import annotations

from collections.abc import AsyncIterator
from dataclasses import dataclass, field
from typing import Literal

from google import genai
from google.genai import errors as genai_errors
from google.genai import types

from ..config import Settings
from ..data.store import LedgerStore
from ..tools.base import ToolContext
from ..tools.registry import ToolRegistry, size_of
from .prompt import page_context_block, system_instruction
from .stream import CitationBook, TailSplitter

Role = Literal["user", "model"]


@dataclass(frozen=True)
class Turn:
    role: Role
    text: str


@dataclass
class Event:
    type: str
    data: dict = field(default_factory=dict)


class GeminiService:
    def __init__(self, settings: Settings, store: LedgerStore, registry: ToolRegistry):
        self.settings = settings
        self.store = store
        self.registry = registry
        self._client = genai.Client(api_key=settings.gemini_api_key) if settings.has_key else None

    @property
    def ready(self) -> bool:
        return self._client is not None

    async def chat(self, message: str, history: list[Turn], page: dict) -> AsyncIterator[Event]:
        if self._client is None:
            yield Event("error", {"message": "The assistant is not configured on the server (no Gemini key).", "code": "no-key"})
            return
        try:
            manifest = await self.store.ensure_fresh()
        except Exception as exc:  # DataError or network — the dataset itself is unavailable
            yield Event("error", {"message": f"Site data is unavailable right now: {exc}", "code": "no-data"})
            return

        ctx = ToolContext(store=self.store, site_url=self.settings.site_url, page=page)
        tools = [types.Tool(function_declarations=[types.FunctionDeclaration(**d) for d in self.registry.declarations(manifest)])]

        def make_config(force_tool: bool) -> types.GenerateContentConfig:
            # The first round MUST call a tool: without it the model happily answers product questions from memory.
            mode = types.FunctionCallingConfigMode.ANY if force_tool else types.FunctionCallingConfigMode.AUTO
            return types.GenerateContentConfig(
                system_instruction=system_instruction(manifest, self.settings.site_url),
                tools=tools,
                tool_config=types.ToolConfig(function_calling_config=types.FunctionCallingConfig(mode=mode)),
                automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
                temperature=0.2,
                max_output_tokens=self.settings.max_answer_tokens,
            )
        contents = _contents(message, history, page)
        yield Event("meta", {"model": self.settings.model, "dataVersion": manifest.get("generatedAt"), "listings": manifest.get("total")})

        splitter = TailSplitter()
        book = CitationBook(self.store.category_meta, (page.get("category") or {}).get("id") if isinstance(page.get("category"), dict) else None)
        tool_calls = 0
        try:
            for round_no in range(self.settings.max_tool_rounds + 1):
                model_parts: list[types.Part] = []
                calls: list[types.FunctionCall] = []
                config = make_config(force_tool=round_no == 0)
                async for chunk in await self._client.aio.models.generate_content_stream(model=self.settings.model, contents=contents, config=config):
                    for part in _parts(chunk):
                        model_parts.append(part)
                        if part.function_call:
                            calls.append(part.function_call)
                        elif part.text and not part.thought:
                            out = splitter.push(part.text)
                            if out:
                                yield Event("text", {"delta": out})
                            if splitter.runaway():
                                yield Event("error", {"message": "The answer stopped: Gemini began repeating itself. Try asking for fewer products at once.", "code": "runaway", "partial": True})
                                return
                if not calls:
                    break
                if tool_calls + len(calls) > self.settings.max_tool_rounds * 3:
                    yield Event("error", {"message": "Stopped: too many tool calls for one question.", "code": "tool-limit"})
                    return
                contents.append(types.Content(role="model", parts=model_parts))
                responses: list[types.Part] = []
                for call in calls:
                    name = call.name or ""
                    args = dict(call.args or {})
                    tool_calls += 1
                    yield Event("tool_call", {"name": name, "args": args})
                    result, ms = await self.registry.execute(name, args, ctx)
                    book.absorb(name, result)
                    yield Event("tool_result", {"name": name, "ms": round(ms, 1), "bytes": size_of(result), "error": result.get("error"), "count": _count(result)})
                    responses.append(types.Part.from_function_response(name=name, response={"result": result}))
                contents.append(types.Content(role="user", parts=responses))
            tail = splitter.flush()
            if tail:
                yield Event("text", {"delta": tail})
            answer = splitter.emitted.strip()
            if not answer:
                yield Event("error", {"message": "Gemini returned no answer text for this question.", "code": "empty"})
                return
            yield Event("done", {"followups": splitter.followups(), "citations": book.payload(answer), "unverifiedCitations": book.unverified(answer), "toolCalls": tool_calls})
        except genai_errors.APIError as exc:
            yield Event("error", {"message": f"Gemini API error {exc.code}: {exc.message}", "code": "gemini"})
        except Exception as exc:  # noqa: BLE001 — surfaced honestly to the client, never swallowed into a fake answer
            yield Event("error", {"message": f"Assistant failed: {type(exc).__name__}: {exc}", "code": "internal"})


def _contents(message: str, history: list[Turn], page: dict) -> list[types.Content]:
    contents = [types.Content(role=t.role, parts=[types.Part.from_text(text=t.text)]) for t in history[-12:] if t.text.strip()]
    block = page_context_block(page)
    text = f"{message.strip()}\n\n{block}" if block else message.strip()
    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=text)]))
    return contents


def _parts(chunk: types.GenerateContentResponse) -> list[types.Part]:
    if not chunk.candidates:
        return []
    content = chunk.candidates[0].content
    return list(content.parts) if content and content.parts else []


def _count(result: dict) -> int | None:
    for key in ("count", "matching"):
        if isinstance(result.get(key), int):
            return result[key]
    return None
