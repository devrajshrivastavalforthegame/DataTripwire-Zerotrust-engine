# DataTripwire Backend

FastAPI application shell for the DataTripwire Zero Trust Engine.

## Phase A

This phase establishes the backend gateway foundation only:
- FastAPI application factory
- versioned API prefix
- CORS configuration
- environment-based settings
- request IDs
- consistent error responses
- health and readiness endpoints
- pytest smoke tests

Security enforcement, authentication, RBAC, database persistence, risk decisions, and AI integration are added in later phases.

## Run

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Test

```powershell
pytest
```

## Endpoints

- GET /health
- GET /ready
- GET /api/v1/health
- GET /api/v1/meta
