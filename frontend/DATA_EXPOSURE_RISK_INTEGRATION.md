# Data Exposure Risk frontend integration

## Current frontend behavior
- The Security Overview mounts `DataExposureRisk` using the existing security-console styles.
- Requests use the existing `api.js` request helper, which attaches the existing bearer token from `datatripwire.auth.v1`.
- The frontend requests `GET /api/v1/security/data-exposure?window=7d` or `window=24h` from `VITE_API_BASE_URL` (currently defaults to `http://localhost:8000`).
- This route is a **proposed frontend integration path**, not a verified backend contract. Confirm with Devraj and Rohith before treating it as integrated.
- No frontend risk scores are computed. Scores, decision and reason codes are rendered from the response.
- Missing bytes are omitted; missing metrics/scores render as unavailable rather than assumed zero.
- API 404 and other errors have separate explanatory UI states.
- Optional demo fixture is isolated in `src/fixtures/dataExposureDemo.js` and is only used when both `import.meta.env.DEV` and `VITE_DATA_EXPOSURE_DEMO=true`. Demo values are explicitly labelled.

## Proposed response contract to confirm
```json
{
  "user_id": "demo-user-01",
  "window": "7d",
  "metrics": {
    "sensitive_access_count": 24,
    "download_count": 8,
    "export_count": 2,
    "unique_resources": 12,
    "recorded_bytes": 18000000
  },
  "data_exposure_risk": 72,
  "behavior_risk": 18,
  "overall_risk": 72,
  "decision": "VERIFY",
  "reason_codes": ["ELEVATED_SENSITIVE_ACCESS", "CUMULATIVE_EXPOSURE"],
  "evidence": [
    {
      "id": "event-id",
      "action": "DOWNLOAD",
      "resource_name": "Sensitive report",
      "timestamp": "2026-10-10T01:00:00Z"
    }
  ]
}
```

Required fields for useful rendering: `metrics`, `data_exposure_risk`, `behavior_risk`, `overall_risk`, `decision`, and `reason_codes`. The `evidence` array is optional. The frontend displays values as supplied and does not infer policy outcomes.

## Backend coordination checklist
- Devraj: confirm endpoint path, time-window parameter values, aggregation semantics, bytes unit, nullability, and whether the endpoint returns aggregate or per-user data.
- Rohith: confirm which service owns the authoritative overall risk and policy decision, allowed decision enum values, reason-code definitions, and evidence schema.
- Confirm authorization requirements and ensure endpoint permissions match the security dashboard's existing admin/auth guard.
- Confirm the API is deployed to the configured `VITE_API_BASE_URL`; no production environment variables were changed here.

## Verification limitation
This change was committed to the existing feature branch via repository tools. A local dependency install, Vite build, browser check, and automated frontend tests were not run in this environment. Do not report those checks as passed until run from `frontend/`.
