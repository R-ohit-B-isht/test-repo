"""Gemini tool-calling loop. Yields typed events the API layer serialises as SSE:
meta → (tool_call → tool_result)* → text* → done | error."""
from __future__ import annotations

import asyncio
import re
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

# Gemini 2.5 "thinking" tokens are billed against max_output_tokens; a fixed budget keeps them from eating the answer.
THINKING_BUDGET = 1024
# A cut-off answer (token cap, dropped connection) is resumed this many times before it is reported as incomplete.
MAX_CONTINUATIONS = 2
RETRY_DELAYS_S = (0.8, 2.0)
TRANSIENT_STATUS = {408, 425, 429, 500, 502, 503, 504}
CONTINUE_PROMPT = (
    "Your previous message stopped before it was finished (it has no FOLLOWUPS line yet). Continue exactly from where it "
    "stopped — mid-sentence or mid-table if needed — without repeating anything already written. Call tools if you still "
    "need facts, then finish the answer and end with the FOLLOWUPS line."
)
BUDGET_PROMPT = (
    "(Tool budget for this question is used up — answer now from the results you already have. Do not call any more "
    "tools; if something is still unknown, say so.)"
)
_TRANSIENT_MESSAGE = re.compile(r"network|connect|socket|stream|ECONN|reset|closed|timed? ?out|incomplete", re.IGNORECASE)


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

        def make_config(mode: types.FunctionCallingConfigMode) -> types.GenerateContentConfig:
            return types.GenerateContentConfig(
                system_instruction=system_instruction(manifest, self.settings.site_url),
                tools=tools,
                tool_config=types.ToolConfig(function_calling_config=types.FunctionCallingConfig(mode=mode)),
                automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
                temperature=0.2,
                max_output_tokens=self.settings.max_answer_tokens + THINKING_BUDGET,
                thinking_config=types.ThinkingConfig(thinking_budget=THINKING_BUDGET),
            )
        contents = _contents(message, history, page)
        yield Event("meta", {"model": self.settings.model, "dataVersion": manifest.get("generatedAt"), "listings": manifest.get("total")})

        splitter = TailSplitter()
        book = CitationBook(self.store.category_meta, (page.get("category") or {}).get("id") if isinstance(page.get("category"), dict) else None)
        tool_calls = 0
        requests = 0
        retries = 0
        continuations = 0
        stopped_by: types.FinishReason | Exception | str | None = None
        max_rounds = self.settings.max_tool_rounds
        try:
            round_no = 0
            while round_no <= max_rounds:
                # The first request MUST call a tool: without it the model answers product questions from memory.
                mode = types.FunctionCallingConfigMode.ANY if requests == 0 else types.FunctionCallingConfigMode.AUTO
                model_parts: list[types.Part] = []
                calls: list[types.FunctionCall] = []
                finish: types.FinishReason | None = None
                round_text = ""
                failure: Exception | None = None
                try:
                    stream = await self._client.aio.models.generate_content_stream(model=self.settings.model, contents=contents, config=make_config(mode))
                    async for chunk in stream:
                        finish = _finish_reason(chunk) or finish
                        for part in _parts(chunk):
                            model_parts.append(part)
                            if part.function_call:
                                calls.append(part.function_call)
                            elif part.text and not part.thought:
                                round_text += part.text
                                out = splitter.push(part.text)
                                if out:
                                    yield Event("text", {"delta": out})
                                if splitter.runaway():
                                    yield Event("error", {"message": "The answer stopped: Gemini began repeating itself. Try asking for fewer products at once.", "code": "runaway", "partial": True})
                                    return
                except Exception as exc:  # noqa: BLE001 — only transient upstream failures are retried, everything else surfaces below
                    if not is_transient(exc):
                        raise
                    failure = exc
                if failure is not None and not round_text and not calls:
                    # Nothing of this request reached the user: repeat it after a short pause.
                    if retries >= len(RETRY_DELAYS_S):
                        raise failure
                    await asyncio.sleep(RETRY_DELAYS_S[retries])
                    retries += 1
                    continue
                requests += 1
                if calls:
                    if round_no == max_rounds or tool_calls + len(calls) > max_rounds * 3:
                        # The model was told the budget is spent and still asked for more: end here rather than run forever.
                        stopped_by = "tool-limit"
                        break
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
                        if not result.get("error") and self.registry.surfaces(name):
                            yield Event("tool_payload", {"name": name, "result": result})
                        responses.append(types.Part.from_function_response(name=name, response={"result": result}))
                    contents.append(types.Content(role="user", parts=responses))
                    round_no += 1
                    if round_no == max_rounds:
                        contents.append(types.Content(role="user", parts=[types.Part.from_text(text=BUDGET_PROMPT)]))
                    continue
                # This request carried (part of) the answer. The FOLLOWUPS line is the completeness signal: a body that ends
                # without it — token cap, dropped connection, or Gemini simply stopping mid-answer (a known 2.5 Flash habit
                # between text and a tool call) — is resumed in place instead of being shown as if it were finished.
                cut_off = failure is not None or finish == types.FinishReason.MAX_TOKENS or not splitter.in_followups
                if cut_off and round_text and not splitter.in_followups and continuations < MAX_CONTINUATIONS:
                    continuations += 1
                    contents.append(types.Content(role="model", parts=[types.Part.from_text(text=round_text)]))
                    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=CONTINUE_PROMPT)]))
                    continue
                if failure is not None:
                    stopped_by = failure
                elif finish and finish != types.FinishReason.STOP and not splitter.in_followups:
                    stopped_by = finish
                break
            tail = splitter.flush()
            if tail:
                yield Event("text", {"delta": tail})
            answer = splitter.emitted.strip()
            if not answer:
                if isinstance(stopped_by, Exception):
                    yield Event("error", {"message": f"Gemini API error: {stopped_by}", "code": "gemini"})
                elif stopped_by == "tool-limit":
                    yield Event("error", {"message": "Stopped: this question needed more lookups than one answer allows. Try asking about fewer products or categories at once.", "code": "tool-limit"})
                elif stopped_by is not None:
                    yield Event("error", {"message": f"Gemini returned no answer: {describe_finish(stopped_by)}.", "code": "finish"})
                else:
                    yield Event("error", {"message": "Gemini returned no answer text for this question.", "code": "empty"})
                return
            yield Event("done", {"followups": splitter.followups(), "citations": book.payload(answer), "unverifiedCitations": book.unverified(answer), "toolCalls": tool_calls})
            if isinstance(stopped_by, Exception):
                yield Event("error", {"message": f"This answer is incomplete — the connection to Gemini dropped ({stopped_by}).", "code": "truncated", "partial": True})
            elif stopped_by == "tool-limit":
                yield Event("error", {"message": "This answer is incomplete — it needed more lookups than one answer allows. Ask about fewer products at once.", "code": "truncated", "partial": True})
            elif stopped_by is not None:
                yield Event("error", {"message": f"This answer is incomplete — Gemini {describe_finish(stopped_by)}. Try asking for fewer products at once.", "code": "truncated", "partial": True})
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


def is_transient(exc: Exception) -> bool:
    """Rate limits, upstream 5xx and dropped connections are worth one more try; anything else is not."""
    if isinstance(exc, genai_errors.APIError):
        return exc.code in TRANSIENT_STATUS
    if isinstance(exc, (ConnectionError, TimeoutError, asyncio.TimeoutError)):
        return True
    return bool(_TRANSIENT_MESSAGE.search(str(exc)))


def describe_finish(reason: types.FinishReason) -> str:
    if reason == types.FinishReason.MAX_TOKENS:
        return "it hit the answer length limit"
    if reason == types.FinishReason.SAFETY:
        return "its safety filter stopped the answer"
    if reason == types.FinishReason.RECITATION:
        return "it stopped to avoid reciting a source verbatim"
    return f"it stopped early ({reason.name})"


def _finish_reason(chunk: types.GenerateContentResponse) -> types.FinishReason | None:
    return chunk.candidates[0].finish_reason if chunk.candidates else None


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
