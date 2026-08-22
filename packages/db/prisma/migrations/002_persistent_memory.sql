CREATE TABLE IF NOT EXISTS "PersistentMemory" (
  "id" TEXT PRIMARY KEY,
  "type" TEXT NOT NULL,
  "key" TEXT,
  "content" TEXT NOT NULL,
  "importance" INTEGER NOT NULL DEFAULT 50,
  "projectId" TEXT,
  "customerId" TEXT,
  "organizationId" TEXT,
  "profileId" TEXT,
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "active" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "PersistentMemory_profileId_active_idx" ON "PersistentMemory" ("profileId", "active");
CREATE INDEX IF NOT EXISTS "PersistentMemory_organizationId_type_idx" ON "PersistentMemory" ("organizationId", "type");
CREATE INDEX IF NOT EXISTS "PersistentMemory_key_idx" ON "PersistentMemory" ("key");
CREATE INDEX IF NOT EXISTS "PersistentMemory_customerId_idx" ON "PersistentMemory" ("customerId");
