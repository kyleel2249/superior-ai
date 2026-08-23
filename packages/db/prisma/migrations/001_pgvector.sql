-- SUPERIOR AI — pgvector migration
-- Run against Postgres with pgvector image (docker compose postgres).

CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column if KnowledgeItem exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'KnowledgeItem'
  ) THEN
    ALTER TABLE "KnowledgeItem"
      ADD COLUMN IF NOT EXISTS embedding vector(1536);
    -- IVFFlat index for cosine similarity (create after some rows exist for best results)
    -- CREATE INDEX IF NOT EXISTS knowledge_embedding_idx
    --   ON "KnowledgeItem" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
  END IF;
END $$;

-- Optional: raw SQL search helper
-- SELECT id, title, 1 - (embedding <=> $1::vector) AS score
-- FROM "KnowledgeItem"
-- ORDER BY embedding <=> $1::vector
-- LIMIT 8;
