from datetime import UTC, datetime, timedelta

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from jose import jwt
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.models.user import User

settings = get_settings()
router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    pw_match = bcrypt.checkpw(
        data.password.encode("utf-8"), user.hashed_password.encode("utf-8")
    )
    if user is None or not pw_match:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is inactive",
        )

    expire = datetime.now(UTC) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    token = jwt.encode(
        {"sub": str(user.id), "exp": expire, "role": user.role},
        settings.secret_key,
        algorithm=settings.jwt_algorithm,
    )
    return TokenResponse(access_token=token)
