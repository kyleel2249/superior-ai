# Build continuation log (2026-08-22)

## This increment

### Tools (`@superior-ai/tools`)
- Permission-gated registry (`runTool`)
- `web_search` — Serper/Bing when configured; never invents sources
- `url_fetch` / `url_audit` — live public HTML extraction

### Memory (`@superior-ai/memory`)
- Layers: short_term, project, user, organization, knowledge
- Scoring: relevance + importance + trust + recency

### Marketing (`@superior-ai/marketing`)
- Content calendar, ideas, growth experiments

### Orchestrator
- Multi-department growth run with stage statuses
- Live competitor URL fetch into knowledge memory
- POST `/api/orchestrate`

### Gateway & ops
- Provider health monitor — GET `/api/health`
- OpenAI-compatible — POST `/api/v1/chat/completions` (`model: auto` routes via Superior Router)
- Task checkpoints — GET/POST `/api/tasks`
- URL audit — POST `/api/audit`

### UI
- `/marketing`, `/seo`, admin health cards

### Local monorepo
Full TypeScript (~59 modules) under `/packages` and `/apps/web`.
Sync remaining files from working tree if any path is missing on remote.

## Run
```bash
cp .env.example .env
docker compose up -d
npm install
npm run dev
```

OpenAI-compat example:
```bash
curl -s localhost:3000/api/v1/chat/completions -H 'Content-Type: application/json' \
  -d '{"model":"auto","messages":[{"role":"user","content":"Hello"}]}'
```
