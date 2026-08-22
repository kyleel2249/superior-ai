CREATE EXTENSION IF NOT EXISTS vector;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'KnowledgeItem'
  ) THEN
    ALTER TABLE "KnowledgeItem"
      ADD COLUMN IF NOT EXISTS embedding vector(1536);
  END IF;
END $$;
