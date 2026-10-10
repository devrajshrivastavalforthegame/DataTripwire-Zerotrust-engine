# Security Hardening Release Notes

## Changes implemented in this archive

- Replaced wildcard AI CORS with an exact-origin allowlist controlled by `AI_ALLOWED_ORIGINS`; production defaults to no browser origins.
- Restricted AI CORS methods and headers.
- Changed AI activity telemetry defaults from fabricated zeros to `null` (unknown), made task/responsibility/deception signals explicitly tri-state, and prevented ML scoring when the complete feature vector is unavailable.
- Deduplicated AI advisory score contributions when a signal is present in both backend reasons and derived context.
- Aligned persisted and returned resource-access risk fields during exposure-risk fusion, including factors, reasons, ATS, STS, decision, and explanation.
- Stopped sending unmeasured activity counters as zero from resource-access analysis.
- Added production frontend guards against HTTP and localhost API endpoints; documented same-origin API routing and why direct browser-to-AI calls should be disabled in production.
- Added defense-in-depth headers to the frontend Nginx configuration.
- Switched backend container dependency installation to lockfile-driven `npm ci --omit=dev`.
- Normalized frontend environment examples and added `SECURITY_HARDENING.md`.

## Validation performed in this build environment

- AI service tests: 25 passed.
- JavaScript syntax checks: resource-access controller and frontend API module passed.
- ZIP integrity: verified before edits; release archive is re-created after edits.

## Not verified here

- Full backend Jest suite and frontend production build (dependency installation/build environment not present in the extracted archive).
- Live persistent database schema, migration 008 against production data, real Docker Compose behavior, production TLS ingress, deployed CORS, or cloud deployment.
- Full authorization matrix and end-to-end frontend/backend/AI/database behavior.

Do not deploy this archive over a running database without a backup, an isolated migration rehearsal, and deployment-specific configuration review.
