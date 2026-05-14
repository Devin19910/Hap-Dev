"""
Google Calendar integration — creates/updates/deletes calendar events via API v3.

Auth: OAuth2 refresh token flow (one-time browser auth, then stored in .env).
All functions are no-ops if GOOGLE_REFRESH_TOKEN is not set.
"""
from datetime import datetime, timedelta, timezone
import httpx
from ..utils.config import settings

_TOKEN_URL = "https://oauth2.googleapis.com/token"
_CAL_BASE  = "https://www.googleapis.com/calendar/v3"


async def _get_access_token() -> str | None:
    if not (settings.google_client_id and settings.google_client_secret and settings.google_refresh_token):
        return None
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(_TOKEN_URL, data={
                "client_id":     settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "refresh_token": settings.google_refresh_token,
                "grant_type":    "refresh_token",
            })
            if r.status_code == 200:
                return r.json().get("access_token")
    except Exception as exc:
        print(f"[gcal] token refresh failed: {exc}")
    return None


def _rfc3339(dt: datetime, tz_offset_hours: float = 5.5) -> str:
    """Formats a naive UTC datetime as RFC3339 with the configured timezone offset."""
    tz = timezone(timedelta(hours=tz_offset_hours))
    local_dt = dt.replace(tzinfo=timezone.utc).astimezone(tz)
    return local_dt.isoformat()


async def create_event(
    summary: str,
    description: str,
    start_dt: datetime,
    duration_minutes: int = 60,
) -> str | None:
    """Creates a calendar event. Returns the Google event ID, or None on failure."""
    token = await _get_access_token()
    if not token:
        return None

    tz_offset = _tz_offset()
    end_dt = start_dt + timedelta(minutes=duration_minutes)
    body = {
        "summary":     summary,
        "description": description,
        "start": {"dateTime": _rfc3339(start_dt, tz_offset), "timeZone": settings.google_timezone},
        "end":   {"dateTime": _rfc3339(end_dt,   tz_offset), "timeZone": settings.google_timezone},
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(
                f"{_CAL_BASE}/calendars/{settings.google_calendar_id}/events",
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
) -> bool:
    token = await _get_access_token()
    if not token or not event_id:
        return False

    tz_offset = _tz_offset()
    end_dt = start_dt + timedelta(minutes=duration_minutes)
    body = {
        "summary":     summary,
        "description": description,
        "start": {"dateTime": _rfc3339(start_dt, tz_offset), "timeZone": settings.google_timezone},
        "end":   {"dateTime": _rfc3339(end_dt,   tz_offset), "timeZone": settings.google_timezone},
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.put(
                f"{_CAL_BASE}/calendars/{settings.google_calendar_id}/events/{event_id}",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json=body,
            )
            return r.status_code in (200, 201)
    except Exception as exc:
        print(f"[gcal] update_event failed: {exc}")
    return False


async def delete_event(event_id: str) -> bool:
    token = await _get_access_token()
    if not token or not event_id:
        return False
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.delete(
                f"{_CAL_BASE}/calendars/{settings.google_calendar_id}/events/{event_id}",
                headers={"Authorization": f"Bearer {token}"},
            )
            return r.status_code in (200, 204)
    except Exception as exc:
        print(f"[gcal] delete_event failed: {exc}")
    return False


def _tz_offset() -> float:
    """Converts 'Asia/Kolkata' → 5.5, 'America/New_York' → -5.0 etc. (approximation)."""
    offsets = {
        "Asia/Kolkata":       5.5,
        "Asia/Kolkata":       5.5,
        "America/New_York":  -5.0,
        "America/Chicago":   -6.0,
        "America/Denver":    -7.0,
        "America/Los_Angeles": -8.0,
        "UTC":                0.0,
    }
    return offsets.get(settings.google_timezone, 5.5)
