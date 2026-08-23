# SUPERIOR AI

**One AI. An Entire Team Behind It.**

Production-oriented multi-model autonomous AI operating system — not a thin chatbot wrapper.

It routes work across frontier models, specialist agents, tools, memory, and human approval gates to research, create, market, sell, build software, and operate a business from one interface.

## What it includes (Waves 1–10)

| Area | Capabilities |
|------|----------------|
| **AI core** | Dynamic model registry, superior router, multi-provider adapters, health, OpenAI-compatible gateway |
| **Council** | Executive + departmental agents (CEO/CFO/CTO/CMO/Sales/…) with growth loop |
| **GTM** | Creative studio, SEO, competitor intel, sales engine, marketing calendar |
| **Media** | Image gen (Native/Upscaled/Final labels), video continuity plans |
| **Build** | Software factory (plan → test → approval), agent **packs marketplace** |
| **Data** | Multi-layer memory, RAG, vector indexer, pgvector SQL |
| **Ops** | Durable tasks, BullMQ/Redis workers, rate limits, OTLP, audit log |
| **Trust** | JWT/OIDC/JWKS, org invites, encryption, SOC2 templates, status page |
| **Commercial** | Usage meters, budgets, Stripe Checkout/Portal, cost attribution |

## Quick start

```bash
cp .env.example .env
# set AUTH_SECRET, optional provider keys, DATABASE_URL, REDIS_URL

docker compose up -d postgres redis
npm install
psql "$DATABASE_URL" -f packages/db/prisma/migrations/001_pgvector.sql
npm run dev --workspace=@superior-ai/web
```

Open http://localhost:3000

```bash
npm run smoke
# optional: npx playwright test
```

## Key routes

| Path | Purpose |
|------|---------|
| `/chat` | Command center |
| `/studio` | Creative campaigns |
| `/status` | Public system status |
| `/login` | Dev / OIDC login |
| `/settings/billing` | Stripe Checkout |
| `/settings/costs` | Cost attribution |
| `/admin/overview` | Health, metrics, audit |
| `/admin/packs` | Agent pack marketplace |
| `/admin/providers` | Provider configuration |

## Key APIs

`/api/health` · `/api/models` · `/api/chat` · `/api/orchestrate` · `/api/v1/chat/completions`  
`/api/campaigns` · `/api/images` · `/api/video` · `/api/crm` · `/api/social`  
`/api/tasks` · `/api/queue` · `/api/knowledge` · `/api/packs` · `/api/factory`  
`/api/billing` · `/api/audit` · `/api/metrics` · `/api/status`

## Design rules

- **No invented** traffic numbers, contacts, test results, or media URLs  
- **Native vs upscaled** resolution labels on images  
- Social/CRM publish only via **official APIs** + explicit approval where required  
- Unavailable models route to best available — never silent fabrications  
- Future model generations register without redesigning the core

## Deploy

- Docker Compose: `postgres` (pgvector), `redis`, optional `worker` profile  
- Helm: `deploy/helm/superior-ai`  
- Terraform scaffold: `deploy/terraform` (`enable=false` by default)  
- Runbook: `docs/runbook/PRODUCTION.md` · Multi-region: `docs/runbook/MULTI_REGION.md`  
- SOC 2 templates: `docs/soc2/`

## Monorepo

```
apps/web          Next.js UI + API routes
packages/
  core, ai-gateway, agents, tools, memory, queue
  creative, seo, sales, marketing, competitor
  auth, billing, crm, social, audit, observability, db, shared
```

## License

Private / proprietary unless otherwise stated by the repository owner.

## Windows (npm)

```bat
copy .env.example .env
npm install
npm run dev:web
```

Open http://localhost:3000

Full guide: [docs/runbook/WINDOWS.md](docs/runbook/WINDOWS.md)

Requires **Node.js 20+**. PostgreSQL and Redis are optional for basic local use.
