from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
import bcrypt as _bcrypt
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from ..models.base import get_db
from ..models.admin_user import AdminUser
from ..utils.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 60 * 8  # 8 hours


# ---------- password helpers ----------

def hash_password(plain: str) -> str:
    return _bcrypt.hashpw(plain.encode(), _bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(plain.encode(), hashed.encode())


# ---------- token helpers ----------

def create_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    return jwt.encode(payload, settings.effective_jwt_secret, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.effective_jwt_secret, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ---------- dependencies ----------

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> AdminUser:
    payload = decode_token(token)
    user_id: str = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.query(AdminUser).filter(AdminUser.id == user_id, AdminUser.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user


async def require_owner(user: AdminUser = Depends(get_current_user)) -> AdminUser:
    if user.role != "owner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Owner access required")
    return user


# ---------- schemas ----------

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    first_name: str
    tenant_id: Optional[str] = None


class UserOut(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    tenant_id: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CreateUserRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str = ""
    role: str = "operator"


# ---------- routes ----------

@router.post("/token", response_model=TokenResponse)
async def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(AdminUser).filter(
        AdminUser.email == form.username,
        AdminUser.is_active == True,
    ).first()

    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_token({"sub": user.id, "role": user.role, "email": user.email})
    return TokenResponse(
        access_token=token,
        role=user.role,
        first_name=user.first_name,
        tenant_id=user.tenant_id,
    )


@router.get("/me", response_model=UserOut)
async def me(user: AdminUser = Depends(get_current_user)):
    return user


@router.post("/users", response_model=UserOut, status_code=201)
async def create_user(
    body: CreateUserRequest,
    _: AdminUser = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """Create a new admin user. Owner only."""
    if db.query(AdminUser).filter(AdminUser.email == body.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    if body.role not in ("owner", "operator"):
        raise HTTPException(status_code=422, detail="role must be owner or operator")
    user = AdminUser(
        email=body.email,
        hashed_password=hash_password(body.password),
        first_name=body.first_name,
        last_name=body.last_name,
        role=body.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/users", response_model=list[UserOut])
async def list_users(
    _: AdminUser = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """List all admin users. Owner only."""
    return db.query(AdminUser).all()


# ---------- seed helper (called from main.py on startup) ----------

def seed_admin_if_empty(db: Session) -> None:
    if db.query(AdminUser).first():
        return
    user = AdminUser(
        email=settings.admin_email,
        hashed_password=hash_password(settings.admin_password),
        first_name=settings.admin_first_name,
        role="owner",
    )
    db.add(user)
    db.commit()
    print(f"[auth] Seeded owner account: {settings.admin_email}")
