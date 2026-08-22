# Wave 2 — Persistence, Media, CRM, Queue, RAG

## Durable tasks
- `@superior-ai/db` — Prisma client singleton (null-safe without DATABASE_URL)
- `saveTask` / `updateTaskStage` / `getTask` / `listTasks` with Postgres or memory fallback
- Orchestrator writes a durable task at start and updates stage on completion
- `GET/POST /api/tasks` reports `storage: postgres | memory`

## Image generation
- `generateImage()` in ai-gateway media module
- **Native Resolution / Upscaled Resolution / Final Resolution** labels
- Never claims native 8K unless provider output is 8K
- `POST /api/images` + Studio UI trigger
- Realism prompt helpers for photorealistic defaults

## CRM
- HubSpot connector (test, upsert contact, create deal) when token set
- Salesforce / Zoho / Pipedrive stubs → CONFIGURATION_REQUIRED
- Never invents email addresses
- `GET/POST /api/crm`

## Queue
- Lanes: realtime, priority, background, batch, long_running, research, coding
- In-memory processor with retry; Redis/BullMQ next
- `GET/POST /api/queue`

## RAG
- `ingestDocument` chunking into knowledge memory
- `retrieve` / `buildRagContext`
- `POST /api/knowledge` (ingest or retrieve)

## Campaigns API
- `POST /api/campaigns` → full campaign package from one liner

Full TypeScript sources (~73 modules) in local monorepo under packages/ and apps/web/.
