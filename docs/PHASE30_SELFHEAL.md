# PHASE 30 — Self-testing & Self-healing

**Status:** VERIFIED — **LOCKED**

## Self-tests

Structural checks:

- Foundation health
- Status board overall
- Sandbox policy
- Code-exec posture
- Module surfaces

Results: pass / fail / warn / skip — **no fake green on external APIs**.

## Self-heal

Safe actions:

- Reset degraded status components
- Clear API degraded flag
- Re-run self-tests
- Incident resolve (**approval required**)

## API

```http
POST /api/self-test { "action": "run" }
POST /api/self-test { "action": "auto_heal" }
POST /api/self-test { "action": "heal", "actionId": "reset_status_defaults" }
GET  /api/self-test?view=pulse|log|actions
```

## Acceptance

```text
node scripts/phase30-selfheal.test.mjs → passed
```

## Next

**Phase 31 — Performance & scalability**
