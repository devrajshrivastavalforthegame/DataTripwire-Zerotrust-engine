# DataTripwire repair backlog

Status date: 2026-10-10  
Repair branch: `repair/system-hardening-20261010`  
Target branch: `feature/prototype-security-integration`  
This document is an engineering backlog, not a claim that the listed work is already implemented.

## Completed in this repair pass

- [x] Add admin-only data exposure endpoint protected by the existing `audit:read` permission.
- [x] Validate the optional `userId` filter before PostgreSQL UUID casts.
- [x] Keep unmeasured byte totals as `null`, report measured/unmeasured event counts, and avoid calling event counts “file counts”.
- [x] Add exposure-risk regression tests.
- [x] Display cumulative exposure metrics in Security Overview and slow dashboard polling from 1.5 seconds to 5 seconds.
- [x] Make creation of the telemetry table/indexes repeatable and document migration application.
- [x] Add cumulative risk-factor regression tests.
- [x] Stop accepting per-request `requestCount`, device fingerprint, and location as authoritative risk signals. The resource-access controller now counts server-observed events for the active session and uses device/location values captured in the session.
- [x] Stop inventing a 1 MB download and one accessed record for every high-impact action when those values are not measured.

## P0 — must complete before merge

1. **Re-run CI on the exact current PR head.** The last confirmed successful GitHub Actions run was for an earlier commit, before the latest server-observed activity changes. Confirm backend tests, frontend build, and AI-service tests on the current head. Investigate the separate failing Vercel status.
2. **Add controller-level tests for resource access.** Cover request-count spoofing, body-supplied device/location values, allowed vs blocked telemetry, audit persistence, and DB failure paths. Unit tests of pure score functions do not prove middleware/controller wiring.
3. **Make risk/policy/audit writes consistent.** Resource access currently performs multiple database writes without a single transaction. A failure between risk decision, policy state, telemetry, and audit writes can leave partial state. Use a transaction or an explicit durable event/outbox design.
4. **Review migration 008 against actual existing database schemas.** The migration drops and recreates a named sensitivity constraint and can fail if existing rows contain values outside the new set. Add a preflight/repair strategy, preserve data, and verify against a copy of the real schema before applying to any persistent database.
5. **Fix the score-fusion contract.** Define one documented policy for combining session risk and cumulative exposure risk, ensure saved and returned values match, ensure factor explanations reflect the actual score, and test every decision threshold (30/50/70/85) including step-up already satisfied.
6. **Verify session state enforcement end-to-end.** Confirm a restricted/quarantined session cannot continue through any employee or workspace route, step-up only clears a pending challenge for that same active session, and release/recovery is audited.
7. **Resolve deployment failure.** Diagnose the current Vercel check and verify the frontend build root, API base URL, and production CORS/API configuration. Do not put service secrets into Vite variables.

## P1 — needed for a credible security prototype

- Add an explicit migration runner/history table; Docker init scripts do not rerun on an already-initialized PostgreSQL volume.
- Add data-retention limits and indexes for behavior events, risk decisions, audit logs, and exposure telemetry.
- Capture actual response byte counts and record counts at the API boundary if the application serves those records. Until then, keep these metrics marked unknown.
- Capture denied/failed attempts in a separate attempt/security-event stream. Do not count blocked access as successful exfiltration, but do use it for abuse detection and audit.
- Make AI explicitly advisory: never let AI overwrite deterministic policy decisions. Show fallback/unavailable status and provenance in the UI.
- Restrict AI-service CORS to intended origins and avoid exposing a separate unauthenticated AI endpoint publicly unless it has deliberate authentication/rate limiting.
- Replace client-controlled login device/location claims with trustworthy signals where feasible. Browser fingerprints and IP geolocation are signals, not identity proof; document spoofability and confidence.
- Verify role-to-portal mappings against all seeded roles, including auditor, manager, analyst, security manager, and system administrator.
- Add authorization tests for every route group and resource/action permission combination, including manager vs employee and portal mismatch.
- Add rate limits for login, step-up, sensitive resource actions, invitations, and expensive dashboard queries; ensure dashboard polling cannot starve security actions.
- Add secret scanning, dependency audit, and a production-safe configuration check to CI.

## P2 — product completeness / hackathon demo quality

- Add a clear employee-facing explanation for VERIFY, RESTRICT, and QUARANTINE, including a safe recovery path.
- Add data-exposure filters by user, department, classification, action, and time window, with pagination.
- Add an incident timeline linking request, behavior event, risk decision, policy action, session change, and alert.
- Add tests for empty telemetry, partial measurements, duplicate factors, decoy quarantine, concurrent access, and database outage.
- Add a reproducible deployment guide with health checks, environment-variable inventory, backup/restore instructions, and separate demo vs production settings.
- Add a seeded demo scenario that demonstrates a normal employee, suspicious enumeration, a step-up challenge, denied protected access, and an audited administrator response without touching production data.

## Known limitations to state honestly

- DER/ER/DBR are deterministic prototype indicators, not a calibrated breach-probability model.
- Transfer volume and record counts are not currently measured by the resource-access handler.
- A browser-provided fingerprint/location is spoofable and must not be described as strong identity proof.
- A successful CI build does not by itself prove database migration safety, production deployment, or complete end-to-end authorization.
