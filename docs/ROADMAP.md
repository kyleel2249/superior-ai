# Roadmap toward full specification

The foundation delivered in this repository implements the non-negotiable architectural spine:

- Dynamic model registry & provider adapters (OpenAI, Anthropic, xAI, Google, Local)
- Superior Router with task classification and multi-role selection
- AI Council agent definitions and selection by intelligence level
- Durable domain model (Prisma) for tasks, checkpoints, artifacts, usage, health
- Command Center UI + Admin Model Registry
- Honest non-availability messaging and Continuous Capacity posture

## Next implementation waves

1. **Persistence wiring** — Prisma client, task checkpoint service, Redis/BullMQ workers
2. **Full agent orchestration loop** — plan → execute → critique → verify → finalize with debate modes
3. **Tool framework** — web search, code runner sandbox, file system, git, spreadsheet, PDF
4. **Memory / RAG** — pgvector, quality scoring, conflict detection
5. **Auth & multi-tenant** — NextAuth/OIDC, org isolation, RBAC
6. **BYOK encrypted key pool UI** + multi-key rotation
7. **Software Factory workspace** — live file tree, terminal, PR generation
8. **Workflow builder & automation engine**
9. **OpenAI-compatible gateway endpoint**
10. **Observability dashboards** — cost, latency, provider health
11. **Security Council automated gates** before deploy
12. **Benchmark lab** and continuous score engine for routing improvement

Each wave must preserve: no fake integrations, no invented execution results, durable state, and model-agnostic extension points.
