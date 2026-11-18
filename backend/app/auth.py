import os
import datetime
from typing import Optional
import jwt
import bcrypt
from fastapi import Request, HTTPException, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User

# ---------------------------------------------------------------------------
# Configuration — all secrets MUST be supplied via environment variables.
# In development (APP_ENV=development) a weak default is tolerated so that
# `pytest` and `uvicorn` start without a .env file.  Any other environment
# raises immediately so a misconfigured deployment cannot silently run with
# an insecure key.
# ---------------------------------------------------------------------------
APP_ENV = os.getenv("APP_ENV", "development").lower()
_jwt_secret_raw = os.getenv("JWT_SECRET", "")

if not _jwt_secret_raw:
    if APP_ENV == "development":
        _jwt_secret_raw = "dev-only-insecure-jwt-secret-do-not-use-in-production"
    else:
        raise RuntimeError(
            "JWT_SECRET environment variable is required when APP_ENV != 'development'. "
            "Set a strong random secret before starting the server."
        )

JWT_SECRET: str = _jwt_secret_raw
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24
COOKIE_NAME = "pole_select_token"
# Cookie secure flag: set COOKIE_SECURE=true in production (HTTPS).
COOKIE_SECURE: bool = os.getenv("COOKIE_SECURE", "false").lower() == "true"


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])  # PyJWT strictly requires 'sub' to be a string
    expire = datetime.datetime.now(datetime.timezone.utc) + (expires_delta or datetime.timedelta(hours=JWT_EXPIRATION_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except Exception:
        return None


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get(COOKIE_NAME)

    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = int(payload.get("sub"))
    user = db.query(User).filter(User.id == user_id, User.active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    return user


def require_role(allowed_roles: list[str]):
    """Role-based access dependency."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: requires role in {allowed_roles}, your role is '{current_user.role}'"
            )
        return current_user
    return role_checker
