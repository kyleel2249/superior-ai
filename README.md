# SUPERIOR AI

**One AI. An Entire Team Behind It.**

Production-grade, enterprise-level multi-model autonomous expert agent platform.

SUPERIOR AI acts as a unified autonomous AI operating system that intelligently combines multiple frontier AI systems, specialized coding agents, reasoning models, multimodal models, search systems, autonomous workers, specialist agents, memory systems, tools, APIs, databases, browsers, code execution environments and human-approved actions.

It behaves like a Chief AI Officer + AI engineering department + research team + strategy team + software development company + analyst team + executive assistant + autonomous digital workforce operating through one interface.

## Architecture Principles

- **Model-agnostic**: Dynamic Model Registry + Provider Registry + Capability Registry
- **Never hard-code models**: Future models (GPT-6/7, future Claude/Grok/Gemini generations) are registered without redesign
- **Continuous capacity**: Provider failover, multi-key pools, local fallback, queues — no artificial internal limits
- **AI Council**: Executive + Strategist + Researcher + Coding Team + Business/Finance/Creative specialists + Security Council
- **Durable tasks**: Checkpointed state, resume after disconnect/restart
- **Truthfulness first**: No invented sources, test results, or execution status
- **BYOK + platform keys**: Encrypted credential management with validation before activation

## Recommended Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS |
| Backend | Node.js / TypeScript (Fastify or Nest-style modules) |
| Database | PostgreSQL + Prisma |
| Cache / Queue | Redis + BullMQ |
| Vector | pgvector |
| Object Storage | S3-compatible |
| Auth | NextAuth / OIDC-ready |
| Deployment | Docker, CI/CD |

## Monorepo Structure

```
superior-ai/
├── apps/
│   ├── web/          # Next.js frontend + API routes
│   └── api/          # Standalone API / workers (optional scale-out)
├── packages/
│   ├── core/         # Shared types, config, utils
│   ├── db/           # Prisma schema & client
│   ├── ai-gateway/   # Provider adapters, model registry, router
│   ├── agents/       # AI Council, orchestration, debate engine
│   ├── tools/        # Universal tool framework
│   ├── memory/       # Short-term, project, org, knowledge, RAG
│   └── shared/       # Cross-cutting utilities
├── docs/
├── scripts/
├── docker-compose.yml
├── .env.example
└── turbo.json
```

## Quick Start

```bash
# 1. Clone
git clone https://github.com/kyleel2249/superior-ai.git
cd superior-ai

# 2. Environment
cp .env.example .env
# Edit .env with your keys (optional for local UI exploration)

# 3. Infrastructure
docker compose up -d   # PostgreSQL + Redis

# 4. Install & migrate
npm install
npm run db:generate
npm run db:migrate

# 5. Develop
npm run dev
```

Open http://localhost:3000

## Business OS Addendum (Integrated)

- **Creative / Media Studio** — Story Director, UGC Factory, campaign engine, performance estimates
- **SEO Intelligence** — clusters, content factory, audit shells
- **Competitor War Room** — public research posture, provenance-labeled traffic shells
- **Sales Autopilot** — leads, scoring, outreach drafts, funnel (approval-gated)
- **Full Expert Council** — interconnected departments sharing orchestration
- **Master Growth Loop** — research → creative → leads → revenue → optimize
- **Command Centers** — `/studio` `/sales` `/competitors` `/ceo`

## Core Modules (Implemented Foundation)

1. **Model Registry** — Dynamic registration, capability scoring, status (REGISTERED / AVAILABLE / UNAVAILABLE / DEPRECATED / CONFIGURATION_REQUIRED)
2. **Provider Adapters** — OpenAI, Anthropic, xAI/Grok, Google Gemini, OpenRouter, Local OpenAI-compatible
3. **Superior Router** — Task classification → primary / secondary / critic / fallback selection with cost & latency awareness
4. **AI Council Orchestrator** — Executive agent coordination, specialist teams, debate modes
5. **Task Queue & Checkpoints** — Durable state, resume, priority queues
6. **Memory Layers** — Conversation, project, user, organization + RAG quality controls
7. **Tool Framework** — Pluggable tools with permission gates
8. **Admin Console** — Providers, models, health, usage, feature flags
9. **Security** — Input isolation, secret redaction, approval gates, sandbox readiness
10. **Observability** — Structured logs, cost tracking, provider health

## Model Integration Rule

Never fake an integration. A model only becomes AVAILABLE after credential + endpoint + capability validation succeeds. Future model names are registered as UNAVAILABLE aliases and automatically fall back to the best verified model.

## License

Proprietary / Enterprise — contact for licensing.
