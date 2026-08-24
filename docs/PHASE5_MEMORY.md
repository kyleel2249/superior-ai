# PHASE 5 — Memory & Knowledge System

**Status:** VERIFIED — **LOCKED**  
**Depends on:** Phase 1, Phase 3 (embeddings optional)

## Memory types

conversation · user · project · company · customer · product · market · competitor · campaign · creative · codebase · research · decision · workflow · agent · preference · rejection · success · failure · cx · support

## Stack

| Capability | Implementation |
|------------|----------------|
| In-process store | `persistent.ts` / `layers.ts` |
| Postgres durability | `postgres.ts` + migration `002` |
| pgvector embeddings | migration `003`, `embeddings.ts` |
| Hybrid RAG | lexical + vector `rag.ts` |
| Conflict detection | `conflicts.ts` |
| Knowledge graph | `knowledge-graph.ts` (entities + edges) |
| Chat context | auto via `retrieveRelevantDurable` in `/api/chat` |
| Context builder | `buildMemoryContext` |

## User intents

| Intent | Action |
|--------|--------|
| Remember this | `POST /api/memory` `{ action: "remember", ... }` |
| Forget this | `{ action: "forget", id \| key \| contentContains }` |
| Update this | `{ action: "update", id \| key, content }` |
| Use as default | `{ action: "update_default", key, content }` |
| Search | `{ action: "search", query }` or `GET ?q=` |
| Conflicts | `{ action: "conflicts" }` |
| Context block | `{ action: "context", query }` |

## Retrieval policy

- Ranked by relevance + importance + trust + recency  
- Irrelevant memories (no term/vector overlap) are **not** injected  
- Prompt block is compact (`formatMemoryForPrompt`), not a full dump  

## Acceptance

```text
node scripts/phase5-memory.test.mjs → 51 passed, 0 failed
```

## Ops notes

- Without `DATABASE_URL`: in-memory durable fallback  
- Without embedding keys: lexical retrieval still works  
- Apply SQL migrations for production Postgres + pgvector  

## Next

**Phase 6 — File, Document & Multimodal Intelligence**
