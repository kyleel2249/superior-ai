# PHASE 29 — Security, Permissions & Sandbox

**Status:** VERIFIED — **LOCKED**

## Delivered

| Area | Implementation |
|------|----------------|
| RBAC | `packages/auth/src/rbac.ts` — roles + resource matrix |
| API guard | `guardRequest()` local-first + optional auth |
| GDPR / privacy | DSAR, ROPA-lite, erasure plan |
| SOC2 templates | Controls + evidence checklist (not certification) |
| Code sandbox | Process-level + dry-run default (`ALLOW_CODE_EXEC`) |
| gVisor notes | `docs/compliance/GVISOR_WORKER.md` |
| Middleware | Rate limit + security headers |

## API

```http
GET  /api/security?view=sandbox|rbac|gdpr|soc2|audit
POST /api/security { "action": "check_code", "code": "..." }
```

## Acceptance

```text
node scripts/phase29-security.test.mjs → passed
```

## Next

**Phase 30 — Self-testing & self-healing**
