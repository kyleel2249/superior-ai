# PHASE 0 — Requirements Extraction & Master Inventory

**Status:** COMPLETE — locked pending Phase 1 gate re-verification  
**Spec source:** SUPERIOR AI Master God-Mode Prompt + all addendums + phased build prompt (Phases 0–38)  
**Codebase baseline:** monorepo `superior-ai` (apps/web + packages/*)

---

## 0.1 Classification legend

| Code | Meaning |
|------|---------|
| CORE | Platform shell, config, events, health |
| AI | Models, providers, routing, gateway |
| AGENT | Agents, departments, orchestration |
| RESEARCH | Search, browser, citations, evidence |
| MEMORY | Persistent memory, RAG, knowledge |
| CREATIVE | Campaigns, story, ads, UGC plans |
| VIDEO | Video gen/edit, continuity, cinema |
| IMAGE | Image gen/edit, 8K, brand raster |
| DESIGN | Vector, letterform, brand system |
| SOFTWARE | Factory, code-exec, repo, deploy |
| MARKETING | Campaigns, growth, social strategy |
| SEO | Keywords, content factory, on-page |
| SALES | Leads, pipeline, outreach, CRM |
| CUSTOMER | CX, support, retention, personas |
| BUSINESS | Strategy, diagnostics, diversification |
| FINANCE | Analysis, forecast, investment support |
| OPERATIONS | Process, cost, supply, automation ops |
| AUTOMATION | Workflows, triggers, schedules |
| SECURITY | Permissions, sandbox, audit, secrets |
| INFRASTRUCTURE | DB, queue, cache, deploy, scale |
| INTEGRATION | Official APIs, MCP, plugins |
| UX | Shell, nav, local-first, command palette |

**Status codes**

| Status | Meaning |
|--------|---------|
| IMPLEMENTED | Code path exists; smoke or integration covered |
| PARTIAL | Real module/API; depth or provider limited |
| ADAPTER | Interface + config; needs official connector |
| MISSING | Not production-implemented |
| N/A | Explicitly out of scope (e.g. regulated advice) |

---

## 0.2 Phase map (spec Phases 1–38 → work)

| Phase | Name | Depends on | Primary categories |
|------:|------|------------|--------------------|
| 1 | Foundation & architecture | — | CORE, INFRASTRUCTURE |
| 2 | Identity, workspace, local-first | 1 | UX, CORE |
| 3 | Model & provider infrastructure | 1 | AI, INTEGRATION |
| 4 | Router & multi-model council | 3 | AI, AGENT |
| 5 | Memory & knowledge | 1, 3 | MEMORY |
| 6 | File / multimodal intelligence | 1, 5 | CORE, IMAGE, VIDEO |
| 7 | Search, browser, deep research | 3, 5 | RESEARCH |
| 8 | Core agent framework | 3, 4, 5 | AGENT |
| 9 | Expert departments & AI company | 8, 5 | AGENT, BUSINESS |
| 10 | Software factory | 8, 5 | SOFTWARE |
| 11 | Code review & optimization | 10 | SOFTWARE |
| 12 | Image & brand studio | 3, 5 | IMAGE, DESIGN |
| 13 | Vector design studio | 12 | DESIGN |
| 14 | Video & cinematic studio | 3, 12 | VIDEO |
| 15 | UGC, avatar, media cloning | 14, 12 | VIDEO, CREATIVE |
| 16 | Advertising & story engine | 12, 14, 9 | CREATIVE, MARKETING |
| 17 | SEO & content engine | 7, 5 | SEO |
| 18 | Marketing intelligence | 9, 17, 16 | MARKETING |
| 19 | Competitor & traffic intel | 7, 17 | RESEARCH, BUSINESS |
| 20 | Sales & revenue | 9, 5 | SALES |
| 21 | Customer experience & support | 9, 5 | CUSTOMER |
| 22 | Product innovation | 9, 19, 20 | BUSINESS |
| 23 | Finance, investment, operations | 9 | FINANCE, OPERATIONS |
| 24 | Automation & workflows | 8, 9 | AUTOMATION |
| 25 | Social & autopublish | 18, INTEGRATION | MARKETING, INTEGRATION |
| 26 | Analytics & attribution | 18, 20 | BUSINESS |
| 27 | Daily intelligence | 5, 17 | CREATIVE, UX |
| 28 | AI company command center | 9–26 | UX, BUSINESS |
| 29 | Security, permissions, sandbox | 1, 10 | SECURITY |
| 30 | Self-testing & self-healing | 1, 3, 29 | INFRASTRUCTURE |
| 31 | Performance & scalability | 1, 30 | INFRASTRUCTURE |
| 32 | End-to-end testing | 1–31 | ALL |
| 33 | Full regression | 32 | ALL |
| 34 | Requirement compliance audit | 33 | ALL |
| 35 | UX & cleanup | 34 | UX |
| 36 | Documentation | 34 | CORE |
| 37 | Final release audit | 35, 36 | ALL |
| 38 | Definition of done | 37 | ALL |

---

## 0.3 Master requirement matrix (condensed by module)

### CORE / INFRASTRUCTURE (Phase 1)

| Requirement | Module | UI | Backend | DB | API | Status | Phase |
|-------------|--------|----|---------|-----|-----|--------|------:|
| App shell (Next.js) | apps/web | Y | Y | — | — | PARTIAL | 1 |
| Modular monorepo | packages/* | — | Y | — | — | IMPLEMENTED | 1 |
| Prisma schema domains | packages/db | — | Y | Y | — | PARTIAL | 1 |
| Postgres + pgvector | packages/db | — | Y | Y | — | PARTIAL | 1 |
| Queue (memory + BullMQ) | packages/queue | — | Y | — | /api/queue | PARTIAL | 1 |
| Config / .env | root | — | Y | — | — | IMPLEMENTED | 1 |
| Logging / errors | apps/web | — | PARTIAL | — | — | PARTIAL | 1 |
| Feature flags | — | — | — | — | — | MISSING | 1 |
| Event bus | — | — | — | — | — | MISSING | 1 |
| Object storage | — | — | — | — | — | MISSING | 1 |
| Caching layer | — | — | — | — | — | MISSING | 1 |
| Plugin architecture | packs | PARTIAL | PARTIAL | — | /api/packs | PARTIAL | 1 |
| System health | observability | /status | Y | — | /api/health, /api/status | IMPLEMENTED | 1 |

### UX / LOCAL-FIRST (Phase 2)

| Requirement | Module | Status | Phase |
|-------------|--------|--------|------:|
| No mandatory sign-in | apps/web | PARTIAL (login exists, not forced on all routes) | 2 |
| Workspace / profiles | packages/workspace | PARTIAL | 2 |
| Projects | schema + UI | PARTIAL | 2 |
| Preferences persist | memory preference type | PARTIAL | 2 |
| Command palette Ctrl+K | — | MISSING | 2 |
| Hide billing/credits from default UX | policy | PARTIAL (routes exist; must hide in default mode) | 2 |
| Dead-link free nav | pages | PARTIAL | 2 |

### AI GATEWAY (Phase 3–4)

| Requirement | Module | Status | Phase |
|-------------|--------|--------|------:|
| Provider registry | ai-gateway | IMPLEMENTED | 3 |
| Model registry + aliases | ai-gateway | IMPLEMENTED | 3 |
| Adapters: OpenAI, Anthropic, xAI, Google, OpenRouter, local | ai-gateway | IMPLEMENTED | 3 |
| Azure-compatible | — | ADAPTER | 3 |
| Health monitor | ai-gateway | PARTIAL | 3 |
| Credential manager | secrets API | PARTIAL | 3 |
| Router (task/difficulty/risk) | superior-router | IMPLEMENTED | 4 |
| Supreme / Autonomous modes | core + chat | IMPLEMENTED | 4 |
| Critic / verification ensemble | router fields | PARTIAL | 4 |
| OpenAI-compatible API | /api/v1/chat/completions | PARTIAL | 3 |

### MEMORY (Phase 5)

| Requirement | Module | Status | Phase |
|-------------|--------|--------|------:|
| Typed memory layers | memory | IMPLEMENTED | 5 |
| Durable + Postgres | memory/postgres | IMPLEMENTED | 5 |
| Vector embeddings | embeddings + mig 003 | PARTIAL | 5 |
| Hybrid RAG | rag.ts | IMPLEMENTED | 5 |
| Remember / forget / update | API | PARTIAL | 5 |
| Knowledge graph | — | MISSING | 5 |
| Reranking | — | MISSING | 5 |

### RESEARCH (Phase 7)

| Requirement | Module | Status | Phase |
|-------------|--------|--------|------:|
| Multi-engine web search | tools/web-search | IMPLEMENTED | 7 |
| URL fetch browser | tools/browser | PARTIAL | 7 |
| Citation discipline | prompts + research | PARTIAL | 7 |
| Contradiction detector | — | MISSING | 7 |
| Full browser agent (click/navigate) | — | MISSING | 7 |

### AGENTS / COMPANY (Phase 8–9)

| Requirement | Module | Status | Phase |
|-------------|--------|--------|------:|
| Council agents | agents/council | IMPLEMENTED | 8 |
| Full department roster | full-council | IMPLEMENTED | 9 |
| Growth loop stages | growth-loop | IMPLEMENTED | 9 |
| Orchestrator + tool calls | executor | PARTIAL | 8–9 |
| RUN AS A COMPANY mode | — | PARTIAL | 9 |
| Agent message bus | — | MISSING | 8 |
| Durable agent lifecycle | tasks/checkpoint | PARTIAL | 8 |

### SOFTWARE (Phase 10–11)

| Requirement | Module | Status | Phase |
|-------------|--------|--------|------:|
| Software factory stages | agents/factory | PARTIAL | 10 |
| Code-exec sandbox | tools/code-exec | PARTIAL | 10 |
| Repo inspect (sandbox) | tools/repo | PARTIAL | 10 |
| GitHub/GitLab/Bitbucket live | — | ADAPTER | 10 |
| Gap analyzer / auto-fix verify | — | PARTIAL | 11 |

### CREATIVE / DESIGN / IMAGE / VIDEO (Phase 12–16)

| Requirement | Module | Status | Phase |
|-------------|--------|--------|------:|
| Brand letterforms + kit export | brand | IMPLEMENTED | 12 |
| Brand Studio UI | /brand | IMPLEMENTED | 12 |
| Campaign / story engine | creative | PARTIAL | 16 |
| Image gen adapter | ai-gateway/media | ADAPTER | 12 |
| Full image editor (layers/masks) | — | MISSING | 12 |
| Vector design studio | — | MISSING | 13 |
| Video gen / continuous cinema | media/video | ADAPTER | 14 |
| Native timeline editor | — | MISSING | 14 |
| UGC / avatar / lip-sync | — | ADAPTER/MISSING | 15 |

### MARKETING / SEO / SALES / CX (Phase 17–21)

| Requirement | Module | Status | Phase |
|-------------|--------|--------|------:|
| SEO clusters + content factory | seo | PARTIAL | 17 |
| Marketing calendar / growth | marketing | PARTIAL | 18 |
| Competitor research + war room | competitor + UI | PARTIAL | 19 |
| Traffic shells (no invented numbers) | competitor | IMPLEMENTED | 19 |
| Sales leads / outreach drafts | sales | PARTIAL | 20 |
| CRM connectors | crm | ADAPTER | 20 |
| Support workforce | support, cx | PARTIAL | 21 |

### BUSINESS / FINANCE / OPS / AUTOMATION (Phase 22–24)

| Requirement | Module | Status | Phase |
|-------------|--------|--------|------:|
| Product lab / validation | product-lab | PARTIAL | 22 |
| Financial analysis council | agents roles | PARTIAL | 23 |
| Workflow visual builder | — | MISSING | 24 |
| Webhooks / scheduled workflows | queue partial | PARTIAL | 24 |

### INTEGRATION / SECURITY / OPS (Phase 25–31)

| Requirement | Module | Status | Phase |
|-------------|--------|--------|------:|
| Social publish official APIs | social | ADAPTER | 25 |
| Analytics / attribution | — | MISSING | 26 |
| Audit log | audit | PARTIAL | 29 |
| Rate limit / OTLP | observability | PARTIAL | 29–30 |
| gVisor notes | docs | DOCUMENTED | 29 |
| Self-healing recovery agent | — | MISSING | 30 |

---

## 0.4 External API / connector inventory

| Capability | Provider options | Env keys | Gate |
|------------|------------------|----------|------|
| LLM | OpenAI, Anthropic, xAI, Google, OpenRouter, local | `*_API_KEY`, `LOCAL_INFERENCE_URL` | Phase 3 |
| Google SERP | Serper, Google CSE | `SERPER_API_KEY`, `GOOGLE_CSE_*` | Phase 7 |
| Bing / Yahoo / Ecosia | Bing Web Search | `BING_SEARCH_API_KEY` | Phase 7 |
| Brave | Brave Search API | `BRAVE_SEARCH_API_KEY` | Phase 7 |
| Yandex | Cloud Search | `YANDEX_SEARCH_API_KEY` | Phase 7 |
| Naver | Open API | `NAVER_CLIENT_ID/SECRET` | Phase 7 |
| Mojeek | Mojeek API | `MOJEEK_API_KEY` | Phase 7 |
| Wolfram | Wolfram\|Alpha | `WOLFRAM_APP_ID` | Phase 7 |
| Tavily | Tavily | `TAVILY_API_KEY` | Phase 7 |
| DDG | Keyless IA + HTML | — | Phase 7 |
| Startpage / Baidu | Partner only | — | ADAPTER |
| Embeddings | OpenAI/OpenRouter | same LLM keys | Phase 5 |
| Image / video gen | Provider media APIs | provider-specific | Phase 12–14 |
| CRM | HubSpot, Salesforce, etc. | connector keys | Phase 20 ADAPTER |
| Social publish | Platform official APIs | platform keys | Phase 25 ADAPTER |
| Stripe | Optional commercial | `STRIPE_*` | Ops only; hide from default UX |
| Redis / Postgres | Infra | `REDIS_URL`, `DATABASE_URL` | Phase 1 |

---

## 0.5 Future / unavailable models (registry rule)

Register as **UNAVAILABLE** with automatic fallback to best verified model:

- GPT-6, GPT-7, future GPT generations  
- Future Claude / Opus / Sonnet generations  
- Future Grok / Gemini / Fable generations  
- Any admin alias without validated endpoint  

**Rule:** never display ACTIVE without health + capability check.

---

## 0.6 Dependency graph (build order)

```text
Phase 1 Foundation
  → Phase 2 Local-first UX
  → Phase 3 Providers/Models
      → Phase 4 Router/Council modes
      → Phase 5 Memory/RAG
          → Phase 6 Multimodal files
          → Phase 7 Research/Search
          → Phase 8 Agent framework
              → Phase 9 Departments
              → Phases 10–11 Software
              → Phases 12–16 Creative media
              → Phases 17–21 GTM/CX
              → Phases 22–27 Business loops
              → Phase 28 Command center
  → Phase 29 Security (parallel after 1, harden continuously)
  → Phases 30–31 Reliability/scale
  → Phases 32–38 Test, audit, docs, release
```

---

## 0.7 Architectural conflicts & resolutions

| Conflict | Resolution |
|----------|------------|
| Billing/token UI vs “unlimited workspace” | Keep billing packages for ops; **default UX must not surface** credits/tokens (Phase 2 + 35) |
| “Unlimited provider capacity” vs real quotas | UX continuous; routing/failover/queue/local models handle limits — never fake provider credits |
| Full video editor vs no native media stack | ADAPTER + orchestration until official APIs; no fake “video generated” URLs |
| Scrape Startpage/Baidu vs ToS | ADAPTER only; no bypass |
| Mandatory auth vs local-first | Optional auth for multi-user; default path no login wall |

---

## 0.8 Phase 0 acceptance gate checklist

| Gate | Result |
|------|--------|
| 100% requirements extracted into matrix | YES (condensed by module; full line-level audit continues Phase 34) |
| 100% categorized | YES |
| 100% mapped to a phase | YES (Phases 1–38) |
| Dependencies identified | YES (§0.6) |
| Conflicts identified | YES (§0.7) |
| External API requirements identified | YES (§0.4) |
| Unsupported/future models identified | YES (§0.5) |
| No duplicate architectural conflict unresolved | YES (documented resolutions) |

**PHASE 0: LOCKED**

---

## 0.9 Next action

**Phase 1 — Foundation & Architecture verification**

1. Run `npm run smoke`, typecheck, lint, build  
2. Confirm DB schema, queue, health endpoints  
3. Close Phase 1 gaps: feature flags, event bus, object storage, caching  
4. Only then open Phase 2 gates  

Do not start Phase 12–16 media depth until Phases 1–5 gates pass with green verification.
