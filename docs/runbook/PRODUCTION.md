# SUPERIOR AI — Production Runbook

## Prerequisites
Postgres 16 + pgvector, Redis 7+, Node 22+.

Required env: DATABASE_URL, REDIS_URL, AUTH_SECRET, ENCRYPTION_KEY, provider keys, optional STRIPE_*.

## Database
```bash
docker compose up -d postgres redis
psql "$DATABASE_URL" -f packages/db/prisma/migrations/001_pgvector.sql
cd packages/db && npx prisma db push
```

## App + worker
```bash
npm run build --workspace=@superior-ai/web && npm run start --workspace=@superior-ai/web
SUPERIOR_WORKER=1 npx tsx packages/queue/src/worker.ts
```

## Helm
```bash
helm upgrade --install superior ./deploy/helm/superior-ai
```

## Health
GET /api/health, /api/metrics, /api/models

## Stripe webhooks
POST /api/billing/webhook — invoice.paid, payment_failed, subscription.*

## Rate limits
Edge ~180/min/IP; orchestrate 30/min.

## Security
Rotate secrets; BYOK encrypted; social requires approved:true; never invent CRM data.
