# Wave 14 — Semantic pack search

## Features
- Embedding search via `@superior-ai/memory` when provider key is set
- Lexical fallback (name, description, agents, workflows, category)
- Hybrid score + optional marketplace rank blend
- `GET /api/packs?q=...` and `?q=...&ranked=1`
- `POST /api/packs` `{ action: "search" | "embed_catalog" }`
- Admin packs UI search box

## Methods
| method | Meaning |
|--------|---------|
| embedding | Cosine similarity only |
| lexical | Token/phrase match only |
| hybrid | Both signals |
