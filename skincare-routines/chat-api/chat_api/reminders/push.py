"""VAPID identity and the actual Web Push send. The private key comes from VAPID_PRIVATE_KEY (PEM or base64 DER),
else from a PEM file in the reminders directory that is created on first run — a fresh key invalidates every existing
subscription, which the app notices (public key changed) and re-subscribes."""
from __future__ import annotations

import asyncio
import json
import logging
from dataclasses import dataclass
from pathlib import Path

from cryptography.hazmat.primitives import serialization
from py_vapid import Vapid, b64urlencode
from pywebpush import WebPushException, webpush

log = logging.getLogger("chat_api.reminders")

TTL_SECONDS = 15 * 60


@dataclass(frozen=True)
class SendResult:
    ok: bool
    status: int | None
    error: str | None
    # 404 / 410 from the push service: the browser dropped the subscription — forget it.
    gone: bool = False


class Pusher:
    def __init__(self, vapid: Vapid, subject: str):
        self._vapid = vapid
        self._subject = subject
        raw = vapid.public_key.public_bytes(serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)
        self.public_key = b64urlencode(raw)

    @classmethod
    def from_settings(cls, private_key: str, directory: Path, subject: str) -> "Pusher":
        return cls(load_or_create_vapid(private_key, directory / "vapid.pem"), subject)

    def send_sync(self, subscription: dict, payload: dict) -> SendResult:
        try:
            resp = webpush(
                subscription_info=subscription,
                data=json.dumps(payload, ensure_ascii=False),
                vapid_private_key=self._vapid,
                vapid_claims={"sub": self._subject},
                ttl=TTL_SECONDS,
                headers={"Urgency": "high"},
                timeout=15,
            )
            status = getattr(resp, "status_code", None)
            return SendResult(ok=True, status=status, error=None)
        except WebPushException as exc:
            status = exc.response.status_code if exc.response is not None else None
            return SendResult(ok=False, status=status, error=str(exc)[:300], gone=status in (404, 410))
        except Exception as exc:  # noqa: BLE001 — network / TLS / encoding failures must not kill the loop
            return SendResult(ok=False, status=None, error=f"{type(exc).__name__}: {exc}"[:300])

    async def send(self, subscription: dict, payload: dict) -> SendResult:
        return await asyncio.to_thread(self.send_sync, subscription, payload)


def load_or_create_vapid(private_key: str, pem_path: Path) -> Vapid:
    if private_key.strip():
        text = private_key.strip().replace("\\n", "\n")
        return Vapid.from_pem(text.encode("utf-8")) if "BEGIN" in text else Vapid.from_string(text)
    if pem_path.is_file():
        return Vapid.from_file(str(pem_path))
    vapid = Vapid()
    vapid.generate_keys()
    pem_path.parent.mkdir(parents=True, exist_ok=True)
    vapid.save_key(str(pem_path))
    log.warning("reminders: generated a new VAPID key at %s — set VAPID_PRIVATE_KEY to keep it across deploys", pem_path)
    return vapid
