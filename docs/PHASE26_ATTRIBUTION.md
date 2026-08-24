# PHASE 26 — Analytics & Attribution

**Status:** VERIFIED — **LOCKED**

## Marketing funnel attribution (`@superior-ai/intelligence`)

Events: impression → click → visit → lead → sql → opportunity → won → revenue  

- Record observed events only  
- Rollup by channel & campaign  
- Rates null when denominators missing  
- Optional demo seed (labeled)

## AI cost attribution (`@superior-ai/billing`)

- By meter, model, provider, project, user  
- Optional internal ops — **not** mandatory billing UI  

## API

```http
GET  /api/attribution
GET  /api/attribution?view=channels|campaigns|events|cost
POST /api/attribution { "type": "lead", "channel": "organic", "campaignId": "..." }
POST /api/attribution { "action": "seed_demo" }
POST /api/attribution { "action": "record_cost", "modelId": "...", "costUsd": 0.02 }
GET  /api/analytics  (KPI briefing — Phase 22)
```

## Honesty

No invented conversions or costs. Empty = no events, not zero performance.

## Acceptance

```text
node scripts/phase26-attribution.test.mjs → passed
```

## Next

**Phase 27 — Daily intelligence**
