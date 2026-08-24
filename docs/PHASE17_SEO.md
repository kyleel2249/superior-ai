# PHASE 17 — SEO & Content Engine

**Status:** VERIFIED — **LOCKED**

## Capabilities

| Feature | Function |
|---------|----------|
| Keyword clusters | `clusterKeywords` |
| Content factory plan | Pillar + cluster list |
| Intent analysis | informational → transactional |
| SEO brief | Outline, metadata, internal links |
| Article draft | Rank-ready structure, human writing notes |
| Content gaps | Competitor gap hypotheses |
| Schema hints | Article, FAQ, Product, Organization |
| URL audit shell | Live crawl required for scores |

## Honesty

- Never claims guaranteed rankings  
- No invented search volumes unless provider data wired  
- No keyword stuffing  

## API

```http
POST /api/seo { "action": "article", "topic": "CRM for small business", "audience": "SMB owners" }
POST /api/seo { "action": "brief" | "cluster" | "intent" | "gaps" | "schema" | "audit" }
```

## Acceptance

```text
node scripts/phase17-seo.test.mjs → passed
```

## Next

**Phase 18 — Competitor Intelligence System**
