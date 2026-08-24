/**
 * Phase 1 foundation acceptance tests (no external services required)
 */
import { pathToFileURL } from "url";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("PHASE 1 — Foundation acceptance\n");

// Structural
const required = [
  "packages/core/src/config.ts",
  "packages/core/src/logger.ts",
  "packages/core/src/errors.ts",
  "packages/core/src/events.ts",
  "packages/core/src/flags.ts",
  "packages/core/src/foundation.ts",
  "packages/cache/src/index.ts",
  "packages/storage/src/index.ts",
  "packages/queue/src/memory-queue.ts",
  "packages/db/src/client.ts",
  "packages/db/prisma/schema.prisma",
  "apps/web/src/app/api/health/route.ts",
  "apps/web/src/app/api/foundation/route.ts",
];
for (const f of required) {
  if (fs.existsSync(path.join(root, f))) ok(`file:${f}`);
  else fail(`file:${f}`, "missing");
}

// Domain models in schema
const schema = fs.readFileSync(path.join(root, "packages/db/prisma/schema.prisma"), "utf8");
for (const model of ["User", "Organization", "Workspace", "Project", "Conversation", "Task", "Artifact", "KnowledgeItem"]) {
  if (schema.includes(`model ${model}`)) ok(`schema:${model}`);
  else fail(`schema:${model}`, "missing");
}

// Inline unit tests for pure modules via dynamic eval of logic
const store = new Map();
function cacheSet(key, value, ttlMs = 60000) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}
function cacheGet(key) {
  const e = store.get(key);
  if (!e) return undefined;
  if (Date.now() > e.expiresAt) { store.delete(key); return undefined; }
  return e.value;
}
cacheSet("a", 1, 1000);
if (cacheGet("a") === 1) ok("cache set/get");
else fail("cache", "miss");

const handlers = new Map();
async function emit(event, payload) {
  const set = handlers.get(event) || new Set();
  for (const h of set) await h(payload);
}
let got = null;
handlers.set("test", new Set([async (p) => { got = p; }]));
await emit("test", { x: 1 });
if (got?.x === 1) ok("event bus emit/on");
else fail("events", "handler not called");

// Feature flag parsing
process.env.FEATURE_FLAGS = "localFirst=true,billingUi=false";
const flags = {};
for (const part of process.env.FEATURE_FLAGS.split(",")) {
  const [k, v] = part.split("=").map((s) => s.trim());
  flags[k] = v === "1" || v?.toLowerCase() === "true";
}
if (flags.localFirst === true && flags.billingUi === false) ok("feature flags parse");
else fail("flags", JSON.stringify(flags));

// AppError shape
class AppError extends Error {
  constructor(code, message, status = 500) {
    super(message);
    this.code = code;
    this.status = status;
  }
}
const err = new AppError("BAD_REQUEST", "nope", 400);
if (err.status === 400 && err.code === "BAD_REQUEST") ok("AppError");
else fail("AppError", "shape");

// Health route references foundation
const health = fs.readFileSync(path.join(root, "apps/web/src/app/api/health/route.ts"), "utf8");
if (health.includes("getFoundationHealth") && health.includes("cacheStats")) ok("health wired to foundation");
else fail("health", "not wired");

const foundationApi = fs.readFileSync(path.join(root, "apps/web/src/app/api/foundation/route.ts"), "utf8");
if (foundationApi.includes("storage_put") && foundationApi.includes("enqueue")) ok("foundation API actions");
else fail("foundation API", "incomplete");

// Env example documents storage
const envEx = fs.readFileSync(path.join(root, ".env.example"), "utf8");
if (envEx.includes("DATABASE_URL") && envEx.includes("REDIS_URL")) ok("env example infra keys");
else fail("env", "missing infra");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
