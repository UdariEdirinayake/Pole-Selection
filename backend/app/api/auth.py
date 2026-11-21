from fastapi import APIRouter, Depends, HTTPException, Response, status
import os
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.auth import (
    verify_password,
    create_access_token,
    get_current_user,
    require_role,
    COOKIE_NAME,
    COOKIE_SECURE,
    JWT_EXPIRATION_HOURS,
)

router = APIRouter(prefix="/api/auth", tags=["Auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    role: str
    active: bool


@router.post("/login", response_model=UserResponse)
def login(credentials: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """Authenticate user with email and password, setting an httpOnly JWT cookie."""
    req_email = credentials.email.lower().strip()
    if req_email.endswith("@linedesign.local"):
        alt_email = req_email.replace("@linedesign.local", "@pole-select.local")
    elif req_email.endswith("@pole-select.local"):
        alt_email = req_email.replace("@pole-select.local", "@linedesign.local")
    else:
        alt_email = req_email

    user = db.query(User).filter(
        (User.email == req_email) | (User.email == alt_email),
        User.active == True,
    ).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role})

    # Set httpOnly cookie
    max_age = JWT_EXPIRATION_HOURS * 3600
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=max_age,
        expires=max_age,
        httponly=True,
        samesite="lax",
        secure=COOKIE_SECURE,  # Set COOKIE_SECURE=true in production (HTTPS)
    )

    return UserResponse(
        id=user.id,
        email=user.email,
        role=user.role,
        active=user.active,
    )


@router.post("/logout")
def logout(response: Response):
    """Log out by clearing the httpOnly JWT cookie."""
    response.delete_cookie(
        key=COOKIE_NAME,
        httponly=True,
        samesite="lax",
    )
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return currently authenticated user profile."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        active=current_user.active,
    )


# ---------------------------------------------------------------------------
# TEST-ONLY endpoints — registered only when TESTING=1 is set in environment.
# These are never present in production deployments.
# ---------------------------------------------------------------------------
if os.getenv("TESTING", "0") == "1":
    @router.get("/admin-only")
    def admin_only_check(current_user: User = Depends(require_role(["admin"]))):
        """Test-only: verify admin role enforcement."""
        return {"message": "Admin access granted", "role": current_user.role}

    @router.get("/reviewer-check")
    def reviewer_role_check(current_user: User = Depends(require_role(["reviewer", "admin"]))):
        """Test-only: verify reviewer/admin role enforcement."""
        return {"message": "Reviewer access granted", "role": current_user.role}

