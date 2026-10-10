# Vercel deployment (frontend)

This repository is configured to deploy the React/Vite frontend from the repository root. The root `vercel.json` installs dependencies with the committed frontend lockfile, builds `frontend/`, publishes `frontend/dist/`, and rewrites client-side routes to `index.html`.

## 1. Import into GitHub and Vercel

1. Extract this ZIP into a clean folder.
2. Review the changes and run the local checks below.
3. Create or select your GitHub repository and push the source. Do not upload `.env` files, credentials, database dumps, `node_modules`, or build output.
4. In Vercel, import the GitHub repository. Keep **Root Directory** set to `./` (repository root); the root `vercel.json` is designed for this. If you instead set Root Directory to `frontend`, use the frontend's own Vercel configuration and Vite defaults. Do not mix the two deployment layouts.
5. In Vercel Project Settings → Environment Variables, set `VITE_API_BASE_URL` for Production and Preview to the **public HTTPS URL** of the deployed backend, for example `https://api.your-domain.example`. Replace the example with your real URL. Do not put credentials in this value.
6. Leave `VITE_AI_SERVICE_URL` unset unless the AI service is intentionally public, has strict CORS, and is designed for browser access. Prefer routing AI requests through the authenticated backend. The current frontend reports the AI service as not exposed when this variable is empty.
7. Set the backend `CORS_ORIGINS` to the exact deployed Vercel origin(s), such as `https://your-project.vercel.app`; include a preview origin only if you intend to allow it. Do not use `*` for credentialed or sensitive production traffic.
8. Deploy and verify login, workspace API calls, resource access, security dashboard calls, and the risk/step-up response flow. A successful static build alone does not prove backend connectivity.

## 2. Required deployment architecture

Vercel hosts the frontend only. It does **not** host the Express backend, PostgreSQL database, or FastAPI AI service through this configuration. Deploy those services separately, use a managed/private PostgreSQL service, configure database migrations and backups, and make sure the backend's HTTPS URL is reachable from the browser. Never expose PostgreSQL publicly.

## 3. Build locally

```bash
cd frontend
npm ci
npm run build
```

From the repository root, the same Vercel commands are:

```bash
npm --prefix frontend ci
npm --prefix frontend run build
```

## 4. Git upload checklist

- Commit source, lockfiles, migrations, docs, Dockerfiles, and `.env.example` only.
- Never commit `.env`, private keys, JWT secrets, SMTP credentials, database backups, or production data.
- Confirm `.gitignore` is in effect before `git add`.
- Review `git diff --check` and `git status --short`.
- Push a feature branch and open a pull request; do not overwrite `main` without review.

## 5. Important limits

The security headers in `vercel.json` are baseline browser protections, not a substitute for a full Content Security Policy, backend security controls, TLS configuration on backend hosting, or a security review. Production API URL validation is performed in the frontend bundle, but Vercel environment variables prefixed with `VITE_` are public and must never contain secrets.
