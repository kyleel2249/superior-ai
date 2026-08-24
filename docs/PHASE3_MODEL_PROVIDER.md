# PHASE 3 — Model & Provider Infrastructure

**Status:** VERIFIED — **LOCKED**  
**Depends on:** Phase 1

## Components

| Component | Location |
|-----------|----------|
| Model registry | `packages/ai-gateway/src/registry/model-registry.ts` |
| Provider adapters | openai, anthropic, xai, google, openrouter, local, azure-openai (compat) |
| Base adapter contract | healthCheck, listModels, chat, chatStream |
| Credential manager | `credentials.ts` — env load, fingerprint only in logs |
| Health monitor | `health/monitor.ts` |
| Discovery | `discovery.ts` — listModels → register without inventing |
| Benchmark scaffold | `benchmark.ts` — observed latency only |
| Router | `router/superior-router.ts` |
| OpenAI-compatible gateway | `gateway/openai-compat.ts` |
| Admin UI | `/admin/providers` |
| API | `GET/POST /api/models`, `GET /api/health` |

## Model status rules

- **CONFIGURATION_REQUIRED** — no validated key yet  
- **AVAILABLE** — health check passed  
- **UNAVAILABLE** — future/unknown (gpt-6, gpt-7, …) → resolve to fallback  
- **HEALTH_CHECK_FAILED** — key present but endpoint failed  

Never mark ACTIVE/AVAILABLE without validation. Never fake an unavailable model.

## API examples

```http
GET  /api/models
GET  /api/models?resolve=gpt-6
GET  /api/models?available=1
POST /api/models { "action": "discover", "provider": "openrouter" }
POST /api/models { "action": "health" }
POST /api/models { "action": "benchmark", "provider": "openai", "modelId": "gpt-4o-mini" }
```

## Acceptance

```text
node scripts/phase3-gateway.test.mjs → 45 passed, 0 failed
```

## Next

**Phase 4 — Model Router & Multi-Model Council** (classifier, ensemble, critic, synthesis, Supreme/Autonomous depth)
