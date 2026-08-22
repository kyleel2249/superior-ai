import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("SUPERIOR AI smoke tests\n");

const required = [
  "packages/memory/src/postgres.ts",
  "packages/db/prisma/migrations/002_persistent_memory.sql",
  "packages/brand/src/letterform.ts",
  "apps/web/src/app/api/brand/route.ts",
  "apps/web/src/app/api/chat/route.ts",
  "apps/web/src/app/api/memory/route.ts",
  "docs/runbook/WINDOWS.md",
  "scripts/postinstall.mjs",
];

for (const f of required) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const schema = fs.readFileSync(path.join(root, "packages/db/prisma/schema.prisma"), "utf8");
if (schema.includes("model PersistentMemory")) ok("prisma model");
else fail("schema", "no PersistentMemory");

const chat = fs.readFileSync(path.join(root, "apps/web/src/app/api/chat/route.ts"), "utf8");
if (chat.includes("retrieveRelevantDurable") && chat.includes("memoryBlock")) ok("chat memory wire");
else fail("chat", "memory not wired");

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
if (pkg.scripts && pkg.scripts["dev:web"]) ok("dev:web script");
else fail("scripts", "dev:web missing");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
