# API Transport Encryption and Security Review

## Finding

The release frontend API client sends JSON using `fetch()`; the repository has no matching application-level request/response encryption middleware or key-exchange protocol. A configuration variable alone is not encryption.

## Decision

Do not add custom AES/shared-key payload encryption to the browser API at this stage. A secret shipped in a frontend bundle is public to every user. Client-side encryption without a sound authenticated key-exchange design does not create a trustworthy secret channel and can interfere with authorization, debugging, caching, and API compatibility.

For this web application, the default protection for data in transit should be TLS/HTTPS between the browser and the public API, plus TLS on any network hops that cross an untrusted boundary. HTTPS must be configured and verified at the hosting/reverse-proxy layer. TLS terminates at the proxy/provider, so confirm whether proxy-to-backend and backend-to-AI traffic also require TLS in the actual hosting topology.

## Changes in this branch

- Backend startup now fails in production if `CORS_ORIGINS` contains malformed or non-HTTPS origins.
- Existing Helmet security headers, JWT authentication, session checks, RBAC, and CORS allowlisting remain in place.
- This change does not redirect requests or trust arbitrary proxy headers.

## Deployment checklist

1. Set `NODE_ENV=production` in the deployed backend.
2. Set `CORS_ORIGINS` to the exact production frontend origin(s), each beginning with `https://`. Do not include localhost or plain HTTP origins in production.
3. Confirm the frontend's `VITE_API_BASE_URL` is the deployed HTTPS backend URL.
4. Verify TLS certificates, redirects/HSTS, and proxy-to-service encryption with the hosting provider. Do not assume the frontend URL check proves the server-side network is encrypted.
5. Keep the AI service private; route browser requests through the authenticated backend. Configure `AI_SERVICE_URL` using the private service address when services share a trusted private network, or HTTPS if that traffic crosses an untrusted network.
6. Never place private keys or shared encryption secrets in `VITE_*` variables or frontend code.
7. If a concrete requirement later demands payload encryption beyond TLS termination, design authenticated key exchange and replay protection first, then add matching client/server tests and key rotation. Do not improvise a static browser secret.

## Validation status

This is a repository-level hardening change. It has not yet been exercised by CI or against the deployed hosting configuration. Run backend tests and production-startup configuration tests before merging. This document does not claim that the deployed TLS configuration has been independently verified.
