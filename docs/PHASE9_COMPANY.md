# PHASE 9 — Expert Departments & AI Company

**Status:** VERIFIED — **LOCKED**

## Departments (`ALL_DEPARTMENTS`)

Executive · Strategy · Sales · Marketing · Creative · Technology · Finance · Customer · Operations · HR · Legal · Research · SEO

Each department has objectives, KPIs, and specialist agents.

## RUN AS A COMPANY

`runAsCompany({ objective, product?, audience?, region? })`:

1. Select departments from objective signals  
2. Seed **shared memory**  
3. Each department produces recommendation / risks / assumptions  
4. Assigns durable agent tasks + message-bus handoffs  
5. Growth loop plan attached  
6. Executive synthesis (single final narrative)  

Shared across departments: memory, decisions, artifacts, project state.

## API

```http
GET  /api/company
POST /api/company { "objective": "Launch a new SaaS product", "product": "...", "audience": "...", "region": "..." }
POST /api/company { "action": "plan", "objective": "..." }
POST /api/company { "action": "org" }
```

## Test scenario

```text
Launch a new SaaS product.
→ multiple departments collaborate through shared memory and state
```

## Acceptance

```text
node scripts/phase9-company.test.mjs → passed
```

## Disclaimer

Analytical assistance only — not licensed legal, financial, or medical advice.

## Next

**Phase 10 — Software Factory**
