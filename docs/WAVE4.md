# Wave 4

## BullMQ
- Connects when REDIS_URL + bullmq/ioredis installed
- Shared job handlers: orchestrate_async, url_audit_async, embed_index, echo
- Dockerfile.worker + compose profile `workers`

## Multi-tenant
- Organizations, members, invites
- POST/GET `/api/orgs` (create | invite | accept)

## Indexer
- indexDocuments + vectorSearch (embeddings or lexical)
- Async embed_index job

## Social
- LinkedIn + X official publish when tokens set
- Requires approved:true
- Never bypasses platform ToS
- GET/POST `/api/social`

## CI
- 29 smoke checks
