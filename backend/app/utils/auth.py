from typing import Optional
from fastapi import Depends, Header, HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .config import settings
from ..models.base import get_db
from ..models.admin_user import AdminUser

_bearer = HTTPBearer(auto_error=False)


async def require_api_key(x_api_key: str = Header(...)):
    if x_api_key != settings.api_secret_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")
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


async def get_tenant_scope(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(_bearer),
    db: Session = Depends(get_db),
) -> Optional[str]:
    """
    Returns the tenant_id when a tenant admin is logged in, None for platform admins
    and x-api-key auth. Used to auto-scope DB queries to the authenticated tenant.
    """
    if not credentials:
        return None
    try:
        from ..api.auth import decode_token
        payload = decode_token(credentials.credentials)
        user_id = payload.get("sub")
        if not user_id:
            return None
        user = db.query(AdminUser).filter(AdminUser.id == user_id, AdminUser.is_active == True).first()
        return user.tenant_id if user else None
    except Exception:
        return None


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(_bearer),
    db: Session = Depends(get_db),
) -> AdminUser:
    """Returns the authenticated user — works for both platform admins and tenant admins."""
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    from ..api.auth import decode_token
    payload = decode_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.query(AdminUser).filter(AdminUser.id == user_id, AdminUser.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


async def require_platform_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(_bearer),
    db: Session = Depends(get_db),
) -> AdminUser:
    """Requires a platform-level admin (tenant_id is null). Rejects tenant admins."""
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    from ..api.auth import decode_token
    payload = decode_token(credentials.credentials)
    user_id = payload.get("sub")
    user = db.query(AdminUser).filter(AdminUser.id == user_id, AdminUser.is_active == True).first()
    if not user or user.tenant_id is not None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Platform admin access required")
    if user.role not in ("owner", "operator"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user
