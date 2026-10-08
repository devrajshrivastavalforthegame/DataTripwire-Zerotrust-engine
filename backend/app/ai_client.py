import httpx
from app.core.config import get_settings
class AIServiceError(RuntimeError): pass
async def analyze(payload:dict)->dict:
    settings=get_settings()
    try:
        async with httpx.AsyncClient(timeout=settings.ai_timeout_seconds) as client:
            r=await client.post(settings.ai_service_url.rstrip("/")+"/api/v1/analyze",json=payload)
            r.raise_for_status()
            return r.json()["analysis"]
    except (httpx.HTTPError,KeyError,ValueError) as exc:
        raise AIServiceError(str(exc)) from exc
