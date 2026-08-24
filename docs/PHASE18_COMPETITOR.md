# PHASE 18 — Competitor Intelligence System

**Status:** VERIFIED — **LOCKED**

## Capabilities

- Live research (search + URL fetch) via `researchCompetitors`
- Scorecard: opportunity / threat / SEO / content / offer / positioning gaps
- Feature & messaging comparison matrices
- Executive competitive brief
- Traffic intelligence **shell** (no fabricated numbers)
- War-room memory tags

## Honesty

- Public data only  
- No invented traffic, revenue, or contacts  
- Provenance labels on outputs  

## API

```http
POST /api/competitors { "ourProduct": "...", "competitors": [{ "name": "...", "url": "..." }] }
POST /api/competitors { "action": "brief", "live": true, ... }
POST /api/competitors { "action": "messaging" | "scorecard" | "traffic" }
```

## Acceptance

```text
node scripts/phase18-competitor.test.mjs → passed
```

## Next

**Phase 19 — CRM, Sales & Lead Engine**
