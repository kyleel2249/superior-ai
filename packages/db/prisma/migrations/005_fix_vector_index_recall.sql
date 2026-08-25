-- BUG FOUND AND VERIFIED, not theoretical: migrations 003's ivfflat indexes
-- (lists = 100) were tested against a real Postgres 16 + pgvector 0.6.0
-- instance with only 2 rows in KnowledgeItem. The ivfflat-indexed
-- vectorSearch query returned only 1 of 2 correct nearest-neighbor matches.
-- Bypassing the index with `SET enable_indexscan = off` and re-running the
-- identical query returned both rows with correct cosine-similarity scores
-- (1.0 and -0.87), proving the SQL/vector logic was always correct and the
-- ivfflat index itself was silently dropping valid results — matching
-- Postgres's own warning at index-creation time ("ivfflat index created
-- with little data ... This will cause low recall").
--
-- Fix: HNSW doesn't need a `lists` parameter tuned to table size and has
-- much better recall characteristics on small/growing tables. pgvector
-- 0.6.0 (confirmed installed) supports it.

DROP INDEX IF EXISTS "PersistentMemory_embedding_ivfflat_idx";
DROP INDEX IF EXISTS "KnowledgeItem_embedding_ivfflat_idx";

CREATE INDEX IF NOT EXISTS "PersistentMemory_embedding_hnsw_idx"
  ON "PersistentMemory" USING hnsw ("embedding" vector_cosine_ops);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'KnowledgeItem'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS "KnowledgeItem_embedding_hnsw_idx" ON "KnowledgeItem" USING hnsw (embedding vector_cosine_ops)';
  END IF;
END $$;
