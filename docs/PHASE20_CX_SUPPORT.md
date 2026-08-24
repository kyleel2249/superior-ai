# PHASE 20 — Customer Experience & Support

**Status:** VERIFIED — **LOCKED**

## CX (`@superior-ai/cx`)

- Personas (create / evolve)
- Journey map with friction + actions
- VoC theme analysis from provided text
- NPS/CSAT shells (null until surveys)
- Retention playbook

## Support (`@superior-ai/support`)

- Tickets with sentiment + role routing
- Escalation on angry/urgent
- Customer history continuity (no “repeat yourself”)
- Knowledge base upsert/search
- Draft reply guidance
- Trend alerts

## API

```http
POST /api/cx { "action": "journey", "product": "..." }
POST /api/cx { "action": "voc", "texts": ["..."] }
POST /api/support { "action": "open", "subject": "...", "body": "..." }
POST /api/support { "action": "kb_upsert" | "draft_reply" | "resolve" }
```

## Honesty

NPS/CSAT not invented. VoC only from supplied text.

## Acceptance

```text
node scripts/phase20-cx.test.mjs → passed
```

## Next

**Phase 21 — Marketing Automation & Growth Loop**
