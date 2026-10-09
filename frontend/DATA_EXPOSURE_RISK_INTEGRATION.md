# Data Exposure Risk frontend integration

## Contract used
- Endpoint: `GET /api/v1/security/data-exposure?window=7d&limit=50`
- Authentication: existing `api.js` request helper attaches the bearer token from `datatripwire.auth.v1`.
- Permission: the backend requires `users:read`; the UI surfaces authorization failures without fabricating report data.
- Window values: `24h`, `7d`, and `30d`; default is `7d`.
- Response is a report containing `count`, report metadata, and `users[]`. Each user contains `current`, `previous`, `trend`, and `last_event_at`.

## Rendering behavior
- One card per returned user, keyed by `user_id`.
- Current and preceding equal-length window scores/metrics are shown side by side.
- Backend `severity` and `current.factors[]` (`code`, `points`, `detail`) are rendered as returned.
- No browser-side exposure score, behavior score, overall score, or policy decision is inferred.
- `recorded_bytes: null` is displayed as “Not captured”; never rendered as zero.
- Handles loading, empty report, API/auth/permission errors, refresh, and response-shape mismatch.
- `telemetry_note` and `risk_note` are displayed when present.
- Optional demo fixture is only enabled in development when `VITE_DATA_EXPOSURE_DEMO=true`, and is visibly labelled illustrative.

## Contract mismatch corrected
The earlier component expected a single aggregate `metrics` object plus top-level `data_exposure_risk`, `behavior_risk`, `overall_risk`, `decision`, and `reason_codes`. Those fields are not provided by this endpoint. The component now consumes the documented per-user `users[]` response and uses `current.factors[]` instead of inventing reason codes or decisions.

## Out of scope
This report is read-only and does not itself return policy decisions. The separate behavior-event pipeline's fused risk is not represented as a top-level field here. Any future UI for policy decisions must consume the authoritative endpoint/contract for those decisions.
