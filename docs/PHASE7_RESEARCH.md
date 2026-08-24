# PHASE 7 — Internet Search, Browser & Deep Research

**Status:** VERIFIED — **LOCKED**

## Search (`packages/tools` + `/api/search`)

Multi-engine cascade: Google (Serper/CSE), Bing, Yahoo-via-Bing, DuckDuckGo, Brave, Yandex, Naver, Ecosia-via-Bing, Mojeek, WolframAlpha, Tavily.  
Startpage/Baidu marked CONFIGURATION_REQUIRED (no public API bypass).

**Rule:** Never invents result lists.

## Browser tools

| Tool | Purpose |
|------|---------|
| `url_fetch` | Title, meta, H1, text excerpt |
| `url_audit` | Basic SEO signals from HTML |
| `url_links` | Outbound https links |

Respects http(s) only; no auth bypass.

## Research package (`@superior-ai/research`)

| Module | Role |
|--------|------|
| citations | Bibliography from real hits only |
| evidence | Observed / Unsupported labels |
| contradictions | Cross-source polarity conflicts |
| url-analyzer | Batch URL fetch |
| deep-research | Search → optional fetch → evidence → cite |

## API

```http
POST /api/research { "action": "deep", "query": "...", "urls": [], "fetchTop": 2 }
POST /api/research { "action": "urls", "urls": ["https://..."] }
POST /api/research { "action": "search_cite", "query": "...", "claims": ["..."] }
POST /api/search { "query": "...", "multi": true }
```

## Acceptance

```text
node scripts/phase7-research.test.mjs → 29 passed, 0 failed
```

## Next

**Phase 8 — Core Agent Framework**
