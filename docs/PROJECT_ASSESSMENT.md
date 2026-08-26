# SUPERIOR AI — Project Assessment

_Date: 2026-08-25_

## Architecture snapshot

Monorepo (`apps/web` + `packages/*`) implementing a **model-agnostic AI operating system**:

| Layer | Packages / surfaces |
|--------|---------------------|
| Core / registry | `@superior-ai/core`, `ai-gateway` (registry, router, cascade, council, quality, canary) |
| Memory | `memory` (typed + optional Postgres/pgvector) |
| Agents | `agents` (orchestrator, packs, skills, templates, red-team, checkpoints) |
| Research | `research` + `tools` multi-engine search |
| Business | sales, crm, marketing, seo, competitor, intelligence |
| Creative | creative, brand, design, media adapters |
| Security | RBAC-ish autonomy, instruction trust, remediation |
| Ops | observability, queue, performance, self-heal |
| UI | Next.js app: chat, command, advanced, daily, studio, admin |

## Strengths

- Honest adapter statuses (`AVAILABLE` / `CONFIGURATION_REQUIRED` / `UNAVAILABLE`)
- OpenRouter-first gateway with multi-provider registry
- Wide feature surface (twin, scenarios, marketplace, KPIs, etc.)
- Multi-engine search with no fabricated SERP results
- Phase/test scripts for regression checks

## Gaps / risks

1. **Search file size** — `web-search.ts` still holds all engine HTTP clients (~800 lines); merge/summarize extracted, further split of engines optional.
2. **Live search depends on keys** — without Serper/Bing/Brave/etc., only limited keyless paths work.
3. **Deep research** — URL fetch + evidence are solid; model synthesis optional and key-gated.
4. **In-memory state** — many intelligence modules use process Maps (fine for local-first; need Redis/Postgres for multi-instance).
5. **UI coverage** — advanced APIs exceed polished product UX in places.
6. **Test depth** — structural/script tests dominate over full integration E2E against real providers.

## Search logic (clarified)

```
listSearchEngines()     → catalog + configured flags
searchWithEngine(id)    → single adapter
liveSearch()            → sequential cascade until hits
multiEngineSearch()     → parallel configured engines → mergeSearchHits
searchAllEngines()      → parallel all engines → merge + summary string
summarizeSearchResults()→ extractive always; abstractive if LLM key
```

Merge is URL-normalized dedupe (`search/merge.ts`).

## AI-driven result summarization

| Mode | When | Behavior |
|------|------|----------|
| **Extractive** | Always | Rank snippets by query overlap; bullets + top sources |
| **Abstractive** | `preferAbstractive` + API key | OpenRouter/OpenAI chat with grounded prompt; else fallback |

APIs:

- `GET /api/search?q=…&mode=all&summarize=1`
- `POST /api/advanced` `{ action: "research_gather", query, abstractive: true }`

## Recommendation

1. Keep honesty rules (no invented sources).
2. Prefer `multiEngineSearch` for agents; `searchAllEngines` for exhaustive admin research.
3. Default UI summaries to extractive; enable abstractive when keys present.
4. Persist high-value state (twins, incidents, queue) to Postgres for production.
