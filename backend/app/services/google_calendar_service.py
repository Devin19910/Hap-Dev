"""Google Calendar integration — creates/updates/deletes calendar events via API v3."""
from __future__ import annotations
from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING
import httpx
from ..utils.config import settings

if TYPE_CHECKING:
    from ..utils.tenant_config import TenantConfig

_TOKEN_URL = "https://oauth2.googleapis.com/token"
_CAL_BASE  = "https://www.googleapis.com/calendar/v3"

_TZ_OFFSETS = {
    "Asia/Kolkata":        5.5,
    "America/New_York":   -5.0,
    "America/Chicago":    -6.0,
    "America/Denver":     -7.0,
    "America/Los_Angeles": -8.0,
    "UTC": 0.0,
}


async def _get_access_token(client_id: str, client_secret: str, refresh_token: str) -> str | None:
    if not (client_id and client_secret and refresh_token):
        return None
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(_TOKEN_URL, data={
                "client_id":     client_id,
                "client_secret": client_secret,
                "refresh_token": refresh_token,
                "grant_type":    "refresh_token",
            })
            if r.status_code == 200:
                return r.json().get("access_token")
    except Exception as exc:
        print(f"[gcal] token refresh failed: {exc}")
    return None


def _rfc3339(dt: datetime, tz_hours: float) -> str:
    tz = timezone(timedelta(hours=tz_hours))
    return dt.replace(tzinfo=timezone.utc).astimezone(tz).isoformat()


def _resolve(cfg: "TenantConfig | None") -> tuple[str, str, str, str, str]:
    """Returns (client_id, client_secret, refresh_token, calendar_id, timezone) resolved from cfg + globals."""
    if cfg:
        return (
            cfg.google_client_id     or settings.google_client_id,
            cfg.google_client_secret or settings.google_client_secret,
            cfg.google_refresh_token or settings.google_refresh_token,
            cfg.google_calendar_id   or settings.google_calendar_id,
            cfg.google_timezone      or settings.google_timezone,
        )
    return (
        settings.google_client_id,
        settings.google_client_secret,
        settings.google_refresh_token,
        settings.google_calendar_id,
        settings.google_timezone,
    )


async def create_event(
    summary: str,
    description: str,
    start_dt: datetime,
    duration_minutes: int = 60,
    cfg: "TenantConfig | None" = None,
) -> str | None:
    cid, csec, rtok, cal_id, tz = _resolve(cfg)
    token = await _get_access_token(cid, csec, rtok)
    if not token:
        return None
    tz_offset = _TZ_OFFSETS.get(tz, 5.5)
    end_dt    = start_dt + timedelta(minutes=duration_minutes)
    body = {
        "summary":     summary,
        "description": description,
        "start": {"dateTime": _rfc3339(start_dt, tz_offset), "timeZone": tz},
        "end":   {"dateTime": _rfc3339(end_dt,   tz_offset), "timeZone": tz},
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(
                f"{_CAL_BASE}/calendars/{cal_id}/events",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json=body,
            )
            if r.status_code in (200, 201):
                return r.json().get("id")
    except Exception as exc:
        print(f"[gcal] create_event failed: {exc}")
    return None


async def update_event(
    event_id: str,
    summary: str,
    description: str,
    start_dt: datetime,
    duration_minutes: int = 60,
    cfg: "TenantConfig | None" = None,
) -> bool:
    cid, csec, rtok, cal_id, tz = _resolve(cfg)
    token = await _get_access_token(cid, csec, rtok)
    if not token or not event_id:
        return False
    tz_offset = _TZ_OFFSETS.get(tz, 5.5)
    end_dt    = start_dt + timedelta(minutes=duration_minutes)
    body = {
        "summary":     summary,
        "description": description,
        "start": {"dateTime": _rfc3339(start_dt, tz_offset), "timeZone": tz},
        "end":   {"dateTime": _rfc3339(end_dt,   tz_offset), "timeZone": tz},
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.put(
                f"{_CAL_BASE}/calendars/{cal_id}/events/{event_id}",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json=body,
            )
            return r.status_code in (200, 201)
    except Exception as exc:
        print(f"[gcal] update_event failed: {exc}")
    return False


async def delete_event(event_id: str, cfg: "TenantConfig | None" = None) -> bool:
    cid, csec, rtok, cal_id, _ = _resolve(cfg)
    token = await _get_access_token(cid, csec, rtok)
    if not token or not event_id:
        return False
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.delete(
                f"{_CAL_BASE}/calendars/{cal_id}/events/{event_id}",
                headers={"Authorization": f"Bearer {token}"},
            )
            return r.status_code in (200, 204)
    except Exception as exc:
        print(f"[gcal] delete_event failed: {exc}")
    return False
