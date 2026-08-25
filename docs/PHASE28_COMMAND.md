# PHASE 28 — AI Company Command Center

**Status:** VERIFIED — **LOCKED**

## Surface

**`/command`** — unified company operating view

- Department grid (agents, objectives, KPIs)
- **Engage departments** → `POST /api/company` (`runAsCompany`)
- Parallel **Daily Intelligence** brief
- Executive synthesis + department contributions
- Org chart preview + quick links to product surfaces

## Related

- `/ceo` — lighter CEO desk
- `/api/company` — RUN AS A COMPANY API
- `/api/daily` — morning brief

## Acceptance

```text
node scripts/phase28-command.test.mjs → passed
```

## Next

**Phase 29 — Security, permissions, sandbox** (deepen; RBAC/GDPR already partial)
