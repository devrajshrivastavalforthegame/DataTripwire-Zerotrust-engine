import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.health import router as health_router
from app.api_v1_access import router as access_router
from app.api_v1_security import router as security_router
from app.api_v1_workspace import router as workspace_router
from app.bootstrap import seed_demo_data
from app.core.config import get_settings
from app.core.errors import (
    error_payload,
    unhandled_exception_handler,
    validation_exception_handler,
)

settings = get_settings()

@asynccontextmanager
async def lifespan(_app):
    from app.db import Base, engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_demo_data()
    yield
    await engine.dispose()

app = FastAPI(
    title=settings.app_name,
    description="Policy-driven continuous trust backend for the DataTripwire Zero Trust Engine.",
    version=settings.app_version,
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_context_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    request.state.request_id = request_id
    started = time.perf_counter()

    try:
        response = await call_next(request)
    except Exception:
        raise

    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time-Ms"] = str(
        round((time.perf_counter() - started) * 1000, 2)
    )
    return response


@app.exception_handler(RequestValidationError)
async def handle_validation_error(request: Request, exc: RequestValidationError):
    return await validation_exception_handler(request, exc)


@app.exception_handler(Exception)
async def handle_unhandled_error(request: Request, exc: Exception):
    return await unhandled_exception_handler(request, exc)


@app.get("/health", tags=["system"])
def root_health():
    return health_router.routes[0].endpoint()


@app.get("/ready", tags=["system"])
def root_ready():
    return {
        "service": "datatripwire-backend",
        "status": "ready",
        "dependencies": {},
    }


@app.get("/", tags=["system"])
def root():
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/health",
        "api": settings.api_v1_prefix,
    }


app.include_router(health_router, prefix=settings.api_v1_prefix)
app.include_router(access_router, prefix=settings.api_v1_prefix)
app.include_router(security_router, prefix=settings.api_v1_prefix)
app.include_router(workspace_router, prefix=settings.api_v1_prefix)


@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content=error_payload(
            code="NOT_FOUND",
            message="The requested endpoint was not found.",
            request_id=getattr(request.state, "request_id", None),
        ),
    )
