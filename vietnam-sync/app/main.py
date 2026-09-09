"""HTTP edge of the sync service. Routes only: parse, call the service, map
outcomes to status codes. Run with `uvicorn app.main:app`."""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .config import CORS_ORIGINS, MAX_DOC_BYTES
from .models.rooms import Room, RoomRepo
from .services.rooms import RoomError, RoomService

app = FastAPI(title="Vietnam planner sync", version="1.0.0", docs_url="/docs", redoc_url=None)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "If-None-Match"],
    expose_headers=["ETag"],
    max_age=600,
)

service = RoomService(RoomRepo())

STATUS = {"bad_code": 400, "not_found": 404, "too_big": 413, "exhausted": 503}


class Push(BaseModel):
    f: dict[str, Any] = Field(default_factory=dict)


def room_json(room: Room, changed: int | None = None) -> dict:
    body = {"room": room.code, "version": room.version, "updated": room.updated, "f": room.fields}
    if changed is not None:
        body["changed"] = changed
    return body


def fail(err: RoomError) -> HTTPException:
    return HTTPException(status_code=STATUS.get(err.code, 400), detail={"code": err.code, "message": err.detail})


@app.get("/health")
def health() -> dict:
    return {"ok": True, "rooms": service.repo.count()}


@app.post("/rooms", status_code=201)
def open_room() -> dict:
    try:
        return room_json(service.open())
    except RoomError as err:
        raise fail(err) from err


@app.get("/rooms/{code}")
def read_room(code: str, request: Request, response: Response) -> Any:
    try:
        room = service.read(code)
    except RoomError as err:
        raise fail(err) from err
    etag = f'"{room.version}"'
    response.headers["ETag"] = etag
    response.headers["Cache-Control"] = "no-store"
    if request.headers.get("if-none-match") == etag:
        return Response(status_code=304, headers={"ETag": etag})
    return room_json(room)


@app.post("/rooms/{code}")
async def push_room(code: str, request: Request, response: Response) -> dict:
    raw = await request.body()
    if len(raw) > MAX_DOC_BYTES:
        raise HTTPException(status_code=413, detail={"code": "too_big", "message": "That push is too large."})
    try:
        push = Push.model_validate_json(raw)
    except ValueError as err:
        raise HTTPException(status_code=400, detail={"code": "bad_body", "message": "Body must be {\"f\": {key: [value, stamp]}}."}) from err
    try:
        room, changed = service.push(code, push.f)
    except RoomError as err:
        raise fail(err) from err
    response.headers["ETag"] = f'"{room.version}"'
    return room_json(room, changed)
