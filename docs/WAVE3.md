# Wave 3 — Workers, Video Continuity, Auth, Encryption, Embeddings, CI

## Queue / Workers
- `startWorker()` registers `orchestrate_async`, `url_audit_async`, `echo`
- `enqueueOrchestration()` for long-running growth jobs
- Redis URL detected; BullMQ optional dependency
- Dev: POST `/api/queue` auto-starts in-process handlers

## Video
- Continuity locks: character, product, environment, wardrobe, brand
- Scene plan from Story Director
- `mediaProduced: false` until real provider returns media (never fake URLs)
- POST `/api/video`

## Auth
- Session tokens + RBAC (owner/admin/member/viewer)
- Dev login when OIDC not configured
- OIDC-ready via AUTH_OIDC_* env
- GET/POST `/api/auth`

## Secrets
- AES-256-GCM when ENCRYPTION_KEY set
- Dev `plain:` prefix if key missing
- POST `/api/secrets`

## Embeddings
- OpenAI embeddings when key present
- Cosine similarity + pgvector SQL hints

## CI
- `.github/workflows/ci.yml`
- `npm run smoke` → 24 checks
