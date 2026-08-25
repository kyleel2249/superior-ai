-- Task and KnowledgeItem are declared in schema.prisma but no prior
-- migration ever created their tables. schema.prisma's own comment says
-- these come from `prisma db push` / `migrate dev` — but that requires
-- downloading Prisma's schema-engine binary from binaries.prisma.sh, which
-- is unreachable in network-restricted environments (confirmed via a direct
-- `prisma db push` attempt returning 403, not assumed). Migrations 001 and
-- 003 both defensively guard their KnowledgeItem ALTER TABLE with
-- `IF EXISTS (SELECT ... information_schema.tables ...)`, which silently
-- no-ops when the table doesn't exist yet — exactly the situation this
-- migration fixes. Hand-written to match the Prisma model definitions
-- exactly, same approach 001-003 already use.

CREATE TABLE IF NOT EXISTS "tasks" (
  id         TEXT PRIMARY KEY,
  kind       TEXT NOT NULL,
  payload    JSONB NOT NULL,
  status     TEXT NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT now(),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "tasks_kind_idx" ON "tasks" (kind);
CREATE INDEX IF NOT EXISTS "tasks_status_idx" ON "tasks" (status);

CREATE TABLE IF NOT EXISTS "KnowledgeItem" (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  source      TEXT,
  tags        TEXT[] NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now()
);

-- Retroactively apply what 001/003 could not — their IF EXISTS guards
-- silently no-op'd when this table didn't exist yet.
ALTER TABLE "KnowledgeItem" ADD COLUMN IF NOT EXISTS embedding vector(1536);
CREATE INDEX IF NOT EXISTS "KnowledgeItem_embedding_ivfflat_idx"
  ON "KnowledgeItem" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
