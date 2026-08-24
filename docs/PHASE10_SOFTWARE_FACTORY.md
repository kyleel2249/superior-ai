# PHASE 10 — Software Factory

**Status:** VERIFIED — **LOCKED**

## Pipeline stages

intake → plan → inspect → implement → validate → test → review → pr → done | blocked

## Capabilities

| Step | Implementation |
|------|----------------|
| Requirements / Architecture / DB / API / UI specs | `generateSoftwareSpecs` |
| Repo inspect | `factoryInspectRepo` + `repoListFiles` |
| Code-exec validate | `factoryValidateCode` + sandbox |
| Tests | Only recorded when tool evidence provided |
| GitHub/GitLab/Bitbucket | ADAPTER — needs official tokens |
| Deploy / rollback | Plan artifact; no fake deploys |
| Human approval | `approveMutations` gate |

## Honesty rules

- Never invent test pass results  
- Never claim deploy succeeded without tool output  
- Mutations require approval  

## API

```http
POST /api/factory { "action": "full", "objective": "Build a todo API", "snippet": {...}, "approveMutations": false }
POST /api/factory { "action": "pipeline" | "inspect" | "validate" | "advance" | "specs" | "deploy_plan" }
GET  /api/factory?id=...
```

## Acceptance path

Small app objective → requirements artifacts → optional inspect → optional code-exec → review/approval → PR/deploy adapters

## Acceptance

```text
node scripts/phase10-factory.test.mjs → passed
```

## Next

**Phase 11 — Code Review, Gap Detection & Optimization**
