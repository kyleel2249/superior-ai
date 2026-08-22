# Roadmap

## Delivered

### Platform core
- Model registry, providers, router, health monitor
- OpenAI-compatible gateway (`/api/v1/chat/completions`)
- Full Business Expert Council + growth orchestrator
- Tool framework (search, URL fetch/audit)
- Multi-layer memory + RAG ingest/retrieve
- Task queue (in-memory lanes; Redis-ready)
- Durable tasks (Prisma when DATABASE_URL set, memory fallback)

### Creative & growth
- Story Director, UGC, campaign engine, performance estimates
- Image generation pipeline with Native / Upscaled / Final labels
- SEO, competitor intel, sales engine, marketing calendar

### Integrations
- CRM connectors (HubSpot live-capable; Salesforce/Zoho/Pipedrive stubs)
- BYOK posture for providers and CRM

### APIs
`/api/chat` `/api/orchestrate` `/api/audit` `/api/health` `/api/models`
`/api/tasks` `/api/images` `/api/crm` `/api/queue` `/api/knowledge` `/api/campaigns`
`/api/v1/chat/completions`

## Next
1. BullMQ worker process against Redis
2. Video generation adapters + continuity engine
3. NextAuth / OIDC multi-tenant
4. pgvector embedding pipeline
5. Social publish (official APIs only)
6. Encryption service for secrets at rest
7. E2E test suite + CI
