# SUPERIOR AI — Production Runbook

## 1. Prerequisites

- Postgres 16 + **pgvector** extension
- Redis 7+
- Node 22+
- Secrets via vault / sealed-secrets (never commit)

Required env:

```
DATABASE_URL=
REDIS_URL=
AUTH_SECRET=          # long random
ENCRYPTION_KEY=       # 64 hex or passphrase
OPENAI_API_KEY=       # and/or other providers
STRIPE_SECRET_KEY=    # if billing enabled
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=
```

## 2. Database

```bash
docker compose up -d postgres redis
psql "$DATABASE_URL" -f packages/db/prisma/migrations/001_pgvector.sql
cd packages/db && npx prisma db push   # or migrate deploy
```

## 3. Application

```bash
npm install
npm run build --workspace=@superior-ai/web
npm run start --workspace=@superior-ai/web
```

Worker (separate process/replica):

```bash
SUPERIOR_WORKER=1 npx tsx packages/queue/src/worker.ts
# or: docker compose --profile workers up -d worker
```

## 4. Kubernetes

```bash
helm upgrade --install superior ./deploy/helm/superior-ai \
  --set image.tag=YOUR_TAG
```

Configure secrets as env from ExternalSecrets / SealedSecrets.

## 5. Health checks

- `GET /api/health` — capacity + provider status
- `GET /api/metrics` — in-process counters/spans
- `GET /api/models` — registry

Alert if: all providers UNAVAILABLE, Redis down, Postgres down, error rate spike on `/api/orchestrate`.

## 6. Stripe webhooks

Dashboard → Webhooks → `https://YOUR_DOMAIN/api/billing/webhook`  
Events: `invoice.paid`, `invoice.payment_failed`, `customer.subscription.*`

## 7. Auth

- Dev: POST `/api/auth` issues JWT + httpOnly cookie
- Prod OIDC: set `AUTH_OIDC_ISSUER`, `CLIENT_ID`, `CLIENT_SECRET`
- Prefer Auth.js + `jose` JWKS verification for ID tokens

## 8. Rate limits

- Edge middleware: ~180 req/min/IP on `/api/*`
- Orchestrate: 30/min per IP (token bucket)
- Tighten via Redis-backed limiter for multi-replica

## 9. Incident basics

| Symptom | Check |
|---------|--------|
| 502/timeouts | Worker queue depth, provider latency |
| 429 storms | Rate limit maps; scale or raise limits |
| Empty model list | Provider keys + `/api/health` |
| Billing 402 | Org hard budget exceeded |
| Webhook failures | Stripe signature + logs |

## 10. Security

- Rotate `AUTH_SECRET` / `ENCRYPTION_KEY` with dual-read window
- BYOK provider keys encrypted at rest
- Social publish requires `approved: true`
- Never invent CRM contacts or traffic metrics

## Code execution

- Default: validation only (`POST /api/exec` without execute or without ALLOW_CODE_EXEC)
- Enable process sandbox only on trusted workers: `ALLOW_CODE_EXEC=1`
- For production isolation, run workers under gVisor/Firecracker and keep API validate-only

## Isolation

See [GVISOR_WORKERS.md](./GVISOR_WORKERS.md) for gVisor/Firecracker worker setup.
