# PHASE 23 — Security, Privacy & Compliance

**Status:** VERIFIED — **LOCKED**

## Security stack

| Area | Implementation |
|------|----------------|
| Auth | JWT sessions, roles, optional OIDC JWKS (`@superior-ai/auth`) |
| Audit | Append-only event ring + stdout ship (`@superior-ai/audit`) |
| Privacy | Data classification + privacy request queue |
| SOC2 | Control templates + evidence checklist (**not a certification**) |
| Headers | Recommended security headers map |

## KPI Dashboard UI

Route: **`/dashboard`**

- Enter **observed** KPI values only  
- Generate executive briefing via `/api/analytics`  
- Status chips: ok · watch · alert · **no_data**  
- Empty metrics stay empty — never invented  

## API

```http
GET  /api/security?view=soc2|classification|privacy|headers|audit
POST /api/security { "action": "privacy_request", "type": "export", "subjectRef": "..." }
GET  /api/analytics?view=kpis
POST /api/analytics { "action": "briefing", "observed": [...] }
```

## Acceptance

```text
node scripts/phase23-security.test.mjs → passed
```

## Next

**Phase 24 — Infrastructure, Deploy & Observability**
