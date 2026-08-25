import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("CINTEXA NEXUS / SUPERIOR core integration\n");

const files = [
  "packages/ai-gateway/src/registry/cintexa-models.ts",
  "packages/ai-gateway/src/reasoning/engine.ts",
  "packages/billing/src/unlimited-credits.ts",
  "apps/web/src/app/api/cintexa/route.ts",
  "docs/CINTEXA_NEXUS_INTEGRATION.md",
];
for (const f of files) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const seeds = fs.readFileSync(path.join(root, "packages/ai-gateway/src/registry/cintexa-models.ts"), "utf8");
for (const s of ["gemini-3.5-flash-lite", "gpt-5.6-sol", "grok-4.6", "sonar-2", "claude-opus-5", "glm-5.2", "kimi-k3", "not_foundation_model", "UNAVAILABLE"]) {
  if (seeds.includes(s)) ok(`seed:${s}`);
  else fail(`seed:${s}`, "missing");
}

const cred = fs.readFileSync(path.join(root, "packages/billing/src/unlimited-credits.ts"), "utf8");
if (cred.includes("UNLIMITED") && cred.includes("blocksUserOnInternalExhaustion: false")) ok("credits:unlimited");
else fail("credits", "missing");

const re = fs.readFileSync(path.join(root, "packages/ai-gateway/src/reasoning/engine.ts"), "utf8");
if (re.includes("mapReasoningToProvider") && re.includes("XHIGH")) ok("reasoning");
else fail("reasoning", "missing");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
