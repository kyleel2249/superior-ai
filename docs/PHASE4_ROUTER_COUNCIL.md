# PHASE 4 — Model Router & Multi-Model Council

**Status:** VERIFIED — **LOCKED**  
**Depends on:** Phase 3

## Delivered

| Component | Location |
|-----------|----------|
| Task classifier | `router/task-classifier.ts` |
| Superior router | primary / secondary / critic / factCheck / executor / fallback |
| Ensemble planner | `router/ensemble.ts` — single → autonomous modes |
| Conflict detection | `detectConflict` |
| Synthesis (single final) | `synthesizeFinal` |
| Critic / Verifier / Synthesis prompts | `agents/council-roles.ts` |
| Council agent roster | existing `council.ts` + departments |
| API | `POST /api/route` |
| Orchestrator | existing `POST /api/orchestrate` |

## Modes

| Intelligence | Ensemble mode | Parallel | Critic | Verifier |
|--------------|---------------|----------|--------|----------|
| FAST / BALANCED | single | no | — | — |
| DEEP | multi | yes | optional | — |
| EXPERT | council | yes | yes | — |
| MAXIMUM | maximum | yes | yes | yes |
| SUPREME | supreme | yes | yes | yes |
| AUTONOMOUS | autonomous | yes | yes | yes (+ tool approval) |

## Guarantees

- Exactly one final answer after synthesis  
- Unavailable models never faked (registry + fallback)  
- Conflicts labeled when detected  
- Autonomous external tools require approval gates  

## API

```http
POST /api/route
{ "message": "Research competitor pricing for CRM in Ghana", "intelligenceLevel": "SUPREME", "action": "plan" }

POST /api/route
{ "action": "classify", "message": "debug TypeScript API" }

POST /api/route
{ "action": "route", "message": "...", "intelligenceLevel": "AUTONOMOUS" }

POST /api/route
{ "action": "synthesize", "primary": "...", "critic": "..." }
```

## Acceptance

```text
node scripts/phase4-router-council.test.mjs → 38 passed
node scripts/phase3-gateway.test.mjs       → 45 passed
```

## Next

**Phase 5 — Memory & Knowledge System** (durable layers, RAG, remember/forget)
