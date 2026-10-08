from datetime import datetime, timezone

from fastapi import APIRouter

from app.core.config import get_settings

router = APIRouter(tags=["system"])


@router.get("/health")
def health():
    settings = get_settings()
    return {
        "service": "datatripwire-backend",
        "status": "ok",
        "version": settings.app_version,
        "environment": settings.app_env,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/meta")
def meta():
    settings = get_settings()
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "environment": settings.app_env,
        "api_version": "v1",
    }


@router.get("/ready")
def ready():
    return {
        "service": "datatripwire-backend",
        "status": "ready",
        "dependencies": {},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
