# PHASE 11 — Code Review, Gap Detection & Optimization

**Status:** VERIFIED — **LOCKED**

## Analyzers

| Analyzer | Focus |
|----------|--------|
| Security | eval, secrets, XSS sinks, SQL concat, shell |
| Bugs | loose equality, empty catch, TODOs |
| Performance | await-in-loop, JSON clone |
| Accessibility | img alt, clickable divs |
| SEO | title, lazy images |
| Requirements map | Implemented / Partial / Missing |

## Status labels

Implemented · Partial · Missing · Broken · Risk · Optimization Opportunity

## Safe auto-fix

Limited: `==` → `===`, missing `alt=""`.  
Re-scanned after apply. Behavioral tests still require real execution evidence.

## API

```http
POST /api/review { "code": "...", "requirements": ["..."], "applyFixes": true }
POST /api/review { "action": "fixture" }
```

## Acceptance fixture

`reviewBrokenFixture()` — intentionally broken login sample with secrets, eval, empty catch.

## Acceptance

```text
node scripts/phase11-review.test.mjs → passed
```

## Next

**Phase 12 — Image & Brand Studio**
