# Build continuation log

## Latest increment

### Tools (`@superior-ai/tools`)
- Permission-gated tool registry
- `web_search` — Serper or Bing when keys present; otherwise CONFIGURATION_REQUIRED (no invented sources)
- `url_fetch` — public HTML fetch + title/meta/h1/text excerpt
- `url_audit` — basic on-page SEO signals from live HTML

### Memory (`@superior-ai/memory`)
- Layers: short_term, project, user, organization, knowledge
- Relevance + importance + trust + recency scoring
- Conflict detection hook
- Context compression helper

### Marketing (`@superior-ai/marketing`)
- 7-day content calendar generator
- Content ideas
- Growth experiment proposals
- Growth opportunity list

### Orchestrator (`packages/agents/src/orchestrator`)
- Multi-stage growth execution
- Optional live competitor URL fetch into knowledge memory
- Campaign + SEO + calendar + sales draft in one run
- Statuses: completed | needs_approval | needs_live_data

### APIs
- POST `/api/orchestrate`
- POST `/api/audit`

### UI
- `/marketing` — run growth orchestrator
- `/seo` — live URL audit + keyword plan

Local monorepo is source of truth for full TypeScript sources.
