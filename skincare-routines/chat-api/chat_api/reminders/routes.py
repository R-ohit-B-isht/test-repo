"""`/api/reminders/*` — the browser registers, refreshes, tests and removes its own reminder record."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

from .schemas import EndpointBody, ReminderRecord, TestBody
from .service import ReminderService
from .store import now_iso

router = APIRouter(prefix="/api/reminders")


def _service(request: Request) -> ReminderService:
    svc = getattr(request.app.state, "reminders", None)
    if svc is None:
        raise HTTPException(503, "reminders are not enabled on this server")
    return svc


def _public_row(row: dict) -> dict:
    return {
        "id": row["id"],
        "updatedAt": row["updatedAt"],
        "sent": row.get("sent", {}),
        "lastSentAt": row.get("lastSentAt"),
        "lastError": row.get("lastError"),
        "failures": row.get("failures", 0),
    }


@router.get("/config")
async def config(request: Request) -> dict:
    svc = _service(request)
    return {"enabled": True, "publicKey": svc.pusher.public_key, "serverTime": now_iso(), **svc.stats()}


@router.put("/subscription")
async def upsert(record: ReminderRecord, request: Request) -> dict:
    svc = _service(request)
    try:
        row = svc.store.upsert(record)
    except OverflowError as exc:
        raise HTTPException(507, str(exc)) from exc
    return {"ok": True, "subscription": _public_row(row), "publicKey": svc.pusher.public_key}


@router.post("/status")
async def status(body: EndpointBody, request: Request) -> dict:
    svc = _service(request)
    row = svc.store.get(body.endpoint)
    return {"registered": row is not None, "subscription": _public_row(row) if row else None, "publicKey": svc.pusher.public_key}


@router.post("/unsubscribe")
async def unsubscribe(body: EndpointBody, request: Request) -> dict:
    svc = _service(request)
    return {"ok": True, "removed": svc.store.delete(body.endpoint)}


@router.post("/test")
async def test(body: TestBody, request: Request) -> dict:
    svc = _service(request)
    row = svc.store.get(body.endpoint)
    if row is None:
        raise HTTPException(404, "this device has no reminder record — save the reminder settings first")
    ok, error = await svc.send_test(ReminderRecord.model_validate(row["record"]), body.slot)
    if not ok:
        raise HTTPException(502, error or "push service rejected the message")
    return {"ok": True}
