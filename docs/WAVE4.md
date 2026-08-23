# Wave 4

## BullMQ
- `bullmq-backend.ts` connects when REDIS_URL + packages installed
- Shared `job-handlers.ts` for memory + Redis workers
- `Dockerfile.worker` + compose profile `workers`
- Jobs: orchestrate_async, url_audit_async, embed_index, echo

## Multi-tenant
- Organizations, members, invites (create / invite / accept)
- POST/GET `/api/orgs`

## Indexer
- `indexDocuments` + `vectorSearch` (embeddings or lexical fallback)
- Async via queue `embed_index`
- Knowledge API: index, index_async, retrieve (vector flag)

## Social
- Official LinkedIn + X publish paths when tokens set
- Other platforms: CONFIGURATION_REQUIRED until wired
- Requires `approved: true` to publish
- GET/POST `/api/social`

## Ops
- Expanded smoke tests
- docker-compose worker profile
