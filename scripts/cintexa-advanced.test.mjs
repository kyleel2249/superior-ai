import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("CINTEXA Advanced Features\n");

const files = [
  "packages/intelligence/src/digital-twin.ts",
  "packages/intelligence/src/scenario.ts",
  "packages/ai-gateway/src/canary.ts",
  "packages/ai-gateway/src/verification/continuous.ts",
  "packages/agents/src/packs/marketplace.ts",
  "apps/web/src/app/api/advanced/route.ts",
  "apps/web/src/app/advanced/page.tsx",
];
for (const f of files) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const checks = [
  ["packages/intelligence/src/digital-twin.ts", ["upsertTwin", "simulateTwin", "disclaimer"]],
  ["packages/intelligence/src/scenario.ts", ["runScenario", "stress_test", "runScenarioSet"]],
  ["packages/ai-gateway/src/canary.ts", ["runSandboxChecks", "startCanary", "advanceCanary", "autoRollback"]],
  ["packages/ai-gateway/src/verification/continuous.ts", ["startVerificationLoop", "verifyCheckpoint", "final_result"]],
  ["packages/agents/src/packs/marketplace.ts", ["listMarketplace", "installFromMarketplace", "rateMarketplacePack"]],
  ["apps/web/src/app/api/advanced/route.ts", ["twin_simulate", "scenario_set", "canary_start", "verify_start", "marketplace_install"]],
];
for (const [file, needles] of checks) {
  const src = fs.readFileSync(path.join(root, file), "utf8");
  for (const n of needles) {
    if (src.includes(n)) ok(`${path.basename(file)}:${n}`);
    else fail(`${path.basename(file)}:${n}`, "missing");
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
