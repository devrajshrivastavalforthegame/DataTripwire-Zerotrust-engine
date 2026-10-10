# DataTripwire Hackathon Demo Guide

## Suggested 3–4 minute demo
1. Sign in using the prepared demo account and open the Security console.
2. Explain the overview metrics, recent activity, trust state, and data-exposure indicators.
3. Open incidents or sessions and show the investigation context available in the running environment.
4. If available in the deployed environment, demonstrate a controlled session restriction/quarantine workflow and the audit trail.
5. Run one AI Copilot analysis only if the configured backend and AI service return a live result.

## Architecture
- The Vite/React frontend is deployed separately from the Express backend, AI service, and PostgreSQL database.
- In Vercel, configure `VITE_API_BASE_URL` to the deployed HTTPS backend.
- Keep Copilot routed through the authenticated backend proxy. Do not expose AI-service URLs or secrets in the browser bundle.
- Configure the backend with exact-origin `CORS_ORIGINS`, environment secrets, a database connection, and required migrations.
- Never commit production credentials or real employee data.

## Honest demo claims
- Describe the application as a prototype, not a production-certified security product.
- Distinguish observed data from seeded/demo data.
- Describe AI output as advisory; deterministic backend policy should remain responsible for enforcement.
- Do not claim real-time autonomous threat prevention unless the end-to-end behavior is demonstrated live.

## Submission checklist
- [ ] Login works from a fresh/incognito browser session.
- [ ] Security dashboard loads data without persistent API errors.
- [ ] One suspicious-activity/incident workflow can be explained and shown.
- [ ] Copilot is demonstrated only if a real response is returned.
- [ ] Screenshots and a short fallback recording are ready.
- [ ] No credentials, tokens, private keys, or production data are included.
