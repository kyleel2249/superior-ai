# Roadmap

## Delivered

### Core
- Dynamic model registry + provider adapters (OpenAI, Anthropic, xAI, Google, Local)
- Superior Router, AI Council, Full Business Expert Council
- Prisma domain model (tasks, campaigns, leads, competitors, brand, experiments)

### Business OS
- Creative Studio (Story Director, UGC, campaign engine, performance estimates)
- SEO engine + live URL audit tool
- Competitor intelligence (provenance-labeled)
- Sales engine (scoring, outreach drafts, approval-gated)
- Marketing calendar + growth experiments
- Multi-layer memory store with relevance scoring
- Universal tool framework (web_search, url_fetch, url_audit) with permissions
- Department orchestrator (`/api/orchestrate`) — multi-stage growth execution
- Command centers: Chat, Studio, Sales, Competitors, CEO, Marketing, SEO, Admin

## Next
1. Wire Prisma client + Redis/BullMQ durable checkpoints
2. Image/video generation adapters (Native vs Upscaled labels)
3. CRM connectors (HubSpot, Salesforce) encrypted BYOK
4. Official social publish APIs
5. pgvector RAG + embedding pipeline
6. Auth (NextAuth/OIDC) multi-tenant
7. OpenAI-compatible gateway endpoint
8. Provider health worker + multi-key pools
9. Sandboxed code execution
10. Benchmark lab UI
