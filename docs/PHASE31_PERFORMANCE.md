# PHASE 31 — Performance & Scalability

**Status:** VERIFIED — **LOCKED**

## Features

- Performance budgets (health, chat, memory, command center)
- Timing samples + p95 summary
- Pagination helper (max page size 100)
- Concurrency pool (`mapPool`)
- Scale checklist (instances, cache, queue, DB, gateway, workers)
- Bounded in-memory cache (`cacheSetBounded`)

## API

```http
GET  /api/performance
GET  /api/performance?view=budgets|timings|scale|cache
POST /api/performance { "action": "probe_health" | "record" | "paginate" }
```

## Acceptance

```text
node scripts/phase31-performance.test.mjs → passed
```

## Next

**Phase 32 — End-to-end testing**
