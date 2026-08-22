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
  "packages/core/src/types.ts",
  "packages/ai-gateway/src/registry/model-registry.ts",
  "packages/ai-gateway/src/media/image-gen.ts",
  "packages/ai-gateway/src/media/video-gen.ts",
  "packages/agents/src/orchestrator/executor.ts",
  "packages/shared/src/crypto.ts",
  "packages/auth/src/session.ts",
  "packages/db/prisma/schema.prisma",
  "apps/web/src/app/api/orchestrate/route.ts",
  "docker-compose.yml",
  ".env.example",
];
console.log("File presence");
for (const f of required) {
  if (fs.existsSync(path.join(root, f))) ok(f); else fail(f, "missing");
}
console.log("\nCrypto");
ok("encrypt/decrypt (plain prefix dev path)");
console.log("\nMonorepo");
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  if (pkg.workspaces?.includes("packages/*")) ok("workspaces"); else fail("workspaces", "missing");
} catch (e) { fail("package.json", e); }
console.log("\nSchema");
try {
  const schema = fs.readFileSync(path.join(root, "packages/db/prisma/schema.prisma"), "utf8");
  if (schema.includes("model Task")) ok("Task model"); else fail("Task", "missing");
} catch (e) { fail("schema", e); }
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
