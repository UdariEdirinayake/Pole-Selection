from fastapi import APIRouter, Depends, HTTPException, Response, status
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
    user = db.query(User).filter(User.email == credentials.email.lower().strip(), User.active == True).first()
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
        secure=False,  # dev mode over HTTP
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


@router.get("/admin-only")
def admin_only_check(current_user: User = Depends(require_role(["admin"]))):
    """Endpoint protected by admin role dependency."""
    return {"message": "Admin access granted", "role": current_user.role}


@router.get("/reviewer-check")
def reviewer_role_check(current_user: User = Depends(require_role(["reviewer", "admin"]))):
    """Endpoint protected by reviewer/admin role dependency."""
    return {"message": "Reviewer access granted", "role": current_user.role}

