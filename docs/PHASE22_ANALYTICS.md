# PHASE 22 — Analytics, BI & Decision System

**Status:** VERIFIED — **LOCKED**

## Capabilities

| Feature | Detail |
|---------|--------|
| KPI catalog | Traffic → retention → ops |
| Evaluate KPIs | Only from **observed** metrics |
| Executive briefing | Narrative + risks + decisions needed |
| Decision records | Options, pros/cons, assumptions, evidence refs |
| Funnel template | Stages map to metrics (connectors required) |
| Master business loop | Multi-stage plan |

## Honesty

- No invented KPI values  
- `no_data` when metrics not supplied  
- Analytical assistance only  

## API

```http
POST /api/analytics { "action": "briefing", "observed": [{ "kpiId": "leads", "value": 120, "period": "2026-W34", "source": "crm" }] }
POST /api/analytics { "action": "decision", "question": "...", "options": [...], "recommendation": "..." }
GET  /api/analytics?view=kpis
```

## Acceptance

```text
node scripts/phase22-analytics.test.mjs → passed
```

## Next

**Phase 23 — Security, Privacy & Compliance**
