# PHASE 27 — Daily Intelligence

**Status:** VERIFIED — **LOCKED**

## Capability

Morning brief combining:

- Executive KPI snapshot (observed only)
- Funnel event totals
- Channel rollups
- Memory cues (when available)
- Focus-for-today actions
- Master loop stage preview

## Surfaces

- UI: `/daily`
- API: `POST /api/daily`

## Honesty

No invented metrics. Empty KPIs stay `no_data`.

## Acceptance

```text
node scripts/phase27-daily.test.mjs → passed
```

## Next

**Phase 28 — AI company command center**
