# SUPERIOR AI / CINTEXA NEXUS — Integration Map

## Phase 0 inspection summary

| Area | Status |
|------|--------|
| Model registry | **EXTEND** — `packages/ai-gateway/src/registry` + `cintexa-models.ts` |
| OpenRouter adapter | **EXISTING** — primary cloud gateway |
| Superior router | **EXISTING** — task classify + ensemble |
| Memory / RAG | **EXISTING** |
| Agents / company mode | **EXISTING** |
| Credits | **EXTEND** — unlimited internal ledger (`unlimited-credits.ts`) |
| Reasoning control | **NEW** — `reasoning/engine.ts` (not a model) |
| Direct provider keys | **OPTIONAL** — not required when OpenRouter exposes model |

## Rules enforced

- `SUPERIOR_INTERNAL_CREDITS = UNLIMITED`
- `CINTEXA_INTERNAL_TOKEN_ACCOUNTING = UNLIMITED`
- No artificial internal lockout
- External limits → route / fallback / queue / continue
- SuperGrok / Grok Build = product tier / environment, not foundation models
- Claude Fable 5 / Nemotron when no public ID = `UNAVAILABLE` + resolve fallback

## API

```http
GET  /api/cintexa
GET  /api/cintexa?view=models|credits|usage
POST /api/cintexa { "action": "resolve", "model": "gpt-5.6-sol" }
POST /api/cintexa { "action": "reasoning", "mode": "Deep" }
```

## Progressive delivery

Full master prompt spans multi-phase work already partially delivered in SUPERIOR phases 1–31.
This integration seeds the CINTEXA portfolio and unlimited-credit policy without destroying existing modules.
