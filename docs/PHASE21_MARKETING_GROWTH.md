# PHASE 21 — Marketing Automation & Growth Loop

**Status:** VERIFIED — **LOCKED**

## Capabilities

- Content calendar (7-day multi-platform)
- Content ideas
- Growth experiments (hypotheses + metrics)
- Opportunity list
- Nurture & launch workflows with **approval gates**
- Email sequence templates
- Full growth loop orchestration (research → optimize)
- Publish stage blocked until authorization

## API

```http
POST /api/marketing { "action": "growth", "product": "...", "objective": "..." }
POST /api/marketing { "action": "nurture" | "launch" | "calendar" | "approve_step" | "advance" }
POST /api/growth { "objective": "...", "product": "..." }
```

## Honesty

No fabricated performance metrics. External publish/send requires approval + connectors.

## Acceptance

```text
node scripts/phase21-marketing.test.mjs → passed
```

## Next

**Phase 22 — Analytics, BI & Decision System**
