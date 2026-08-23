# Wave 16

## Postgres persistent memory
- `PersistentMemory` Prisma model + `002_persistent_memory.sql`
- `rememberDurable` / `forgetDurable` / `retrieveRelevantDurable`
- Falls back to in-memory when `DATABASE_URL` missing

## Brand / letterform
- `@superior-ai/brand` — geometric→monogram styles, SVG marks, palette, brand guide outline
- `POST /api/brand` persists creative memory

## Chat orchestrator
- Auto-retrieves relevant memory + rejections
- Injects into system prompt
- Stores conversation snippets
- Response meta: `memoryUsed`, `memoryBackend`
