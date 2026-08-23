import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("SUPERIOR AI smoke tests\n");

// Read a file relative to repo root, returning null (and recording a
// failure) instead of throwing, so one missing/unreadable file can't crash
// the whole smoke run and hide every other result.
function readSafe(name) {
  try {
    return fs.readFileSync(path.join(root, name), "utf8");
  } catch (e) {
    fail(name, e.code === "ENOENT" ? "missing" : e.message);
    return null;
  }
}

const required = [
  "packages/memory/src/postgres.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/002_persistent_memory.sql",
  "packages/brand/src/letterform.ts",
  "apps/web/src/app/api/brand/route.ts",
  "apps/web/src/app/api/chat/route.ts",
  "apps/web/src/app/api/memory/route.ts",
  "apps/web/src/app/api/models/route.ts",
  "apps/web/src/app/api/campaigns/route.ts",
  "apps/web/src/app/login/page.tsx",
  "apps/web/src/app/studio/page.tsx",
  "apps/web/src/app/sales/page.tsx",
  "docs/runbook/WINDOWS.md",
  "scripts/postinstall.mjs",
];

for (const f of required) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const schema = readSafe("packages/db/prisma/schema.prisma");
if (schema) {
  if (schema.includes("model PersistentMemory")) ok("prisma model: PersistentMemory");
  else fail("schema", "no PersistentMemory model");
  if (schema.includes("model Task")) ok("prisma model: Task");
  else fail("schema", "no Task model");
}

const chat = readSafe("apps/web/src/app/api/chat/route.ts");
if (chat) {
  if (chat.includes("retrieveRelevantDurable") && chat.includes("memoryBlock")) ok("chat memory wire");
  else fail("chat", "memory not wired");
}

const authRoute = readSafe("apps/web/src/app/api/auth/route.ts");
if (authRoute) {
  if (authRoute.includes("superior_session")) ok("auth session cookie");
  else fail("auth", "superior_session cookie not set");
}

const pkgRaw = readSafe("package.json");
if (pkgRaw) {
  const pkg = JSON.parse(pkgRaw);
  if (pkg.scripts && pkg.scripts["dev:web"]) ok("dev:web script");
  else fail("scripts", "dev:web missing");
  if (/^(npm|pnpm|yarn|bun)@\d+\.\d+\.\d+/.test(pkg.packageManager ?? "")) ok("packageManager field");
  else fail("packageManager", `invalid or missing: ${pkg.packageManager}`);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
