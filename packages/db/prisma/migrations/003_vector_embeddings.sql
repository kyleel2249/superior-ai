-- Vector embeddings for knowledge + persistent memory (pgvector)
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "PersistentMemory"
  ADD COLUMN IF NOT EXISTS "embedding" vector(1536);

CREATE INDEX IF NOT EXISTS "PersistentMemory_embedding_ivfflat_idx"
  ON "PersistentMemory" USING ivfflat ("embedding" vector_cosine_ops)
  WITH (lists = 100);

-- Knowledge items table embedding (if KnowledgeItem exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'KnowledgeItem'
  ) THEN
    EXECUTE 'ALTER TABLE "KnowledgeItem" ADD COLUMN IF NOT EXISTS embedding vector(1536)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS "KnowledgeItem_embedding_ivfflat_idx" ON "KnowledgeItem" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)';
  END IF;
END $$;
