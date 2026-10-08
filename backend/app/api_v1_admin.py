from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.security import Role, User, require_roles
from app.api_v1_auth import summary

router = APIRouter(prefix="/admin", tags=["administration"])

@router.get("/users")
async def list_users(_admin: User = Depends(require_roles("Security Manager", "Security Analyst")), db: AsyncSession = Depends(get_db)):
    users = list((await db.scalars(select(User).order_by(User.id))).all())
    return [summary(user) for user in users]

@router.get("/roles")
async def list_roles(_admin: User = Depends(require_roles("Security Manager", "Security Analyst")), db: AsyncSession = Depends(get_db)):
    roles = list((await db.scalars(select(Role).order_by(Role.name))).all())
    return [{"id": r.id, "name": r.name, "description": r.description, "user_count": len(r.users)} for r in roles]
