import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("PHASE 3 — Model & Provider Infrastructure\n");

const files = [
  "packages/ai-gateway/src/registry/model-registry.ts",
  "packages/ai-gateway/src/providers/base.ts",
  "packages/ai-gateway/src/providers/openai.ts",
  "packages/ai-gateway/src/providers/anthropic.ts",
  "packages/ai-gateway/src/providers/xai.ts",
  "packages/ai-gateway/src/providers/google.ts",
  "packages/ai-gateway/src/providers/openrouter.ts",
  "packages/ai-gateway/src/providers/local.ts",
  "packages/ai-gateway/src/providers/index.ts",
  "packages/ai-gateway/src/health/monitor.ts",
  "packages/ai-gateway/src/router/superior-router.ts",
  "packages/ai-gateway/src/credentials.ts",
  "packages/ai-gateway/src/discovery.ts",
  "packages/ai-gateway/src/benchmark.ts",
  "packages/ai-gateway/src/gateway/openai-compat.ts",
  "apps/web/src/app/api/models/route.ts",
  "apps/web/src/app/api/health/route.ts",
  "apps/web/src/app/admin/providers/page.tsx",
];
for (const f of files) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const reg = fs.readFileSync(path.join(root, "packages/ai-gateway/src/registry/model-registry.ts"), "utf8");
for (const s of ["UNAVAILABLE", "gpt-6", "gpt-7", "CONFIGURATION_REQUIRED", "resolve", "fallbackPriority", "functionCalling", "structuredOutput"]) {
  if (reg.includes(s)) ok(`registry:${s}`);
  else fail(`registry:${s}`, "missing");
}

const providers = fs.readFileSync(path.join(root, "packages/ai-gateway/src/providers/index.ts"), "utf8");
for (const p of ["openai", "anthropic", "xai", "google", "openrouter", "local", "azure-openai"]) {
  if (providers.includes(p) || providers.includes(`"${p}"`)) ok(`adapter:${p}`);
  else fail(`adapter:${p}`, "missing");
}

const base = fs.readFileSync(path.join(root, "packages/ai-gateway/src/providers/base.ts"), "utf8");
for (const m of ["healthCheck", "listModels", "chat", "chatStream"]) {
  if (base.includes(m)) ok(`base:${m}`);
  else fail(`base:${m}`, "missing");
}

const cred = fs.readFileSync(path.join(root, "packages/ai-gateway/src/credentials.ts"), "utf8");
if (cred.includes("listCredentialStatus") && cred.includes("fingerprint")) ok("credentials manager");
else fail("credentials", "incomplete");

const disc = fs.readFileSync(path.join(root, "packages/ai-gateway/src/discovery.ts"), "utf8");
if (disc.includes("discoverModels") && !disc.includes("fake available")) ok("discovery");
else fail("discovery", "incomplete");

const modelsApi = fs.readFileSync(path.join(root, "apps/web/src/app/api/models/route.ts"), "utf8");
for (const a of ["discover", "health", "benchmark", "resolve"]) {
  if (modelsApi.includes(a)) ok(`models API:${a}`);
  else fail(`models API:${a}`, "missing");
}

const health = fs.readFileSync(path.join(root, "packages/ai-gateway/src/health/monitor.ts"), "utf8");
if (health.includes("checkProvider") && (health.includes("healthScore") || health.includes("HEALTH_CHECK"))) ok("health monitor");
else fail("health", "incomplete");

const router = fs.readFileSync(path.join(root, "packages/ai-gateway/src/router/superior-router.ts"), "utf8");
if (router.includes("fallback") || router.includes("Fallback") || router.includes("selectModel") || router.includes("route")) {
  ok("router present");
} else fail("router", "missing routing logic");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
