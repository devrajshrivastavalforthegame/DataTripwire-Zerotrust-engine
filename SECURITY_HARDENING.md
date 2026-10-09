# DataTripwire Security Hardening Notes

This package includes targeted source-level hardening. It is a prototype release candidate, not a claim of production certification.

## Security model and API encryption

- Use HTTPS/TLS for every browser-to-API request in deployed environments. TLS should terminate at a trusted ingress/reverse proxy/load balancer; forward traffic to the backend only over a trusted private network. Do not expose the backend or AI service publicly unless required.
- Do not add ad-hoc JavaScript encryption around JSON requests as a substitute for TLS. A key shipped to a browser can be extracted by the user or an attacker controlling that browser. If application-layer encryption is required for a specific field, use a reviewed protocol, server-held keys, authenticated encryption, rotation, and explicit key lifecycle controls.
- Configure `VITE_API_BASE_URL` as an HTTPS URL in production, or leave it empty only when a same-origin `/api` reverse-proxy route is configured. The frontend now rejects insecure HTTP/localhost API URLs in production.
- Direct browser-to-AI calls should be disabled in production. Route AI requests through an authenticated backend endpoint that enforces authorization, rate limits, request provenance, and logging. `AI_ALLOWED_ORIGINS` is restricted to exact origins and defaults to no browser origins in production.
- CORS is not authentication. Never treat an allowed Origin as authorization.

## Required production configuration

1. Set `NODE_ENV=production` and `ENABLE_DEMO_SEED=false`.
2. Generate independent high-entropy secrets for `JWT_SECRET`, database credentials, SMTP credentials, and any service-to-service credentials. Never commit `.env`.
3. Set `CORS_ORIGINS` to exact deployed HTTPS frontend origins, comma-separated. No wildcard origins.
4. Set `VITE_API_BASE_URL` to the deployed HTTPS API origin or use a verified same-origin reverse proxy.
5. Do not expose PostgreSQL or the AI service directly to the public Internet. Restrict network access and firewall rules.
6. Configure TLS certificates and automatic renewal at the ingress. Add HSTS at the HTTPS edge only after HTTPS is guaranteed.
7. Configure backups and test a restore into an isolated database. Never use `docker compose down -v` on a persistent environment.
8. Run dependency, secret, container-image, and dynamic security scans before deployment.

## Risk telemetry and scoring

- Missing telemetry is represented as `null` (unknown), not `0` (measured none). The AI model is not run when its complete feature vector is unavailable.
- Duplicate signals from backend reason codes and derived context are scored once.
- AI results are advisory only; deterministic backend policy remains responsible for enforcement.
- The resource-access risk fusion updates score, decision, STS, ATS, factors, reasons, and explanation together so the response and persisted decision remain aligned.

## Validation checklist

- [ ] Backend and AI unit/integration tests pass.
- [ ] Frontend production build succeeds.
- [ ] All deployed API requests use HTTPS; browser developer tools show no mixed content.
- [ ] Production CORS rejects unapproved browser origins.
- [ ] API authentication, role/object authorization, rate limits, and session step-up are tested against each protected route.
- [ ] Migration 008 preflight is tested on a restored copy of the real database before applying to production.
- [ ] A backup restore has been successfully rehearsed.
- [ ] No real `.env`, access token, private key, database dump, or production data is included in the release archive.

## Remaining work before production

The following require environment-specific verification and are not guaranteed by these source changes: HTTPS ingress configuration, production secret provisioning, full API authorization matrix review, real-database migration rehearsal, end-to-end tests against the persistent database, deployment health checks, and security scanning. Do not describe these as complete until evidenced by test results.
