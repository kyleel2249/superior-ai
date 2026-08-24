# PHASE 16 — Advertising & Story Engine

**Status:** VERIFIED — **LOCKED**

## Capabilities

- Hook generator (by story type)
- CTA generator
- Ad variants at 10 / 15 / 20 / 30 / 45 / 60 / 90s
- Ad skits
- Campaign from one-liner (existing) + full creative pack
- Performance estimate heuristics (labeled estimates only)

## Story types

problem · customer · founder · transformation · humorous · educational · emotional

## API

```http
POST /api/ads { "action": "campaign", "product": "...", "audience": "...", "storyType": "problem" }
POST /api/ads { "action": "hooks" | "ctas" | "variant" | "skit" | "full" }
POST /api/campaigns { "objective": "..." }
```

## Acceptance

```text
node scripts/phase16-ads.test.mjs → passed
```

## Next

**Phase 17 — SEO & Content Engine**
