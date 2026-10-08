from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.security import User, create_access_token, get_current_user, verify_password

router = APIRouter(prefix="/auth", tags=["authentication"])
class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

def summary(user: User):
    return {"id": user.id, "email": user.email, "full_name": user.full_name, "is_active": user.is_active, "roles": [r.name for r in user.roles]}

@router.post("/login")
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.email == str(payload.email).lower()))
    if not user or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password.", headers={"WWW-Authenticate": "Bearer"})
    user.last_login_at = datetime.now(timezone.utc); await db.commit()
    token, expires_in = create_access_token(user.id, [r.name for r in user.roles])
    return {"access_token": token, "token_type": "bearer", "expires_in": expires_in, "user": summary(user)}

@router.get("/me")
async def me(user: User = Depends(get_current_user)): return summary(user)
