# DataTripwire - Zero Trust Engine


## Security hardening release

See [`SECURITY_HARDENING.md`](./SECURITY_HARDENING.md) for production TLS/API security guidance, environment configuration, risk telemetry semantics, validation steps, and remaining deployment gates. This release does not embed secrets or claim that a deployment is production-secure without environment-level validation.


## Vercel frontend deployment

The repository root includes `vercel.json` for deploying the Vite frontend from `frontend/` while importing the repository root into Vercel. Set `VITE_API_BASE_URL` to the deployed backend HTTPS URL in Vercel project environment variables. See [`VERCEL_DEPLOYMENT.md`](./VERCEL_DEPLOYMENT.md) for complete setup and verification instructions. Vercel hosts the frontend only; deploy the backend, AI service, and database separately.
