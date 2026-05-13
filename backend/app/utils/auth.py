from typing import Optional
from fastapi import Header, HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .config import settings

_bearer = HTTPBearer(auto_error=False)


async def require_api_key(x_api_key: str = Header(...)):
    if x_api_key != settings.api_secret_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
        )
    return x_api_key


async def require_any_auth(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(_bearer),
    x_api_key: Optional[str] = Header(default=None),
):
    """Accepts either a JWT Bearer token (dashboard) or x-api-key header (n8n/machine)."""
    if credentials:
        from ..api.auth import decode_token
        decode_token(credentials.credentials)
        return

    if x_api_key and x_api_key == settings.api_secret_key:
        return

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required — provide Bearer token or x-api-key",
    )
