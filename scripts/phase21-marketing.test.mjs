import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("PHASE 21 — Marketing Automation & Growth\n");

const files = [
  "packages/marketing/src/calendar.ts",
  "packages/marketing/src/growth.ts",
  "packages/marketing/src/automation.ts",
  "packages/marketing/src/growth-runner.ts",
  "packages/agents/src/growth-loop.ts",
  "apps/web/src/app/api/marketing/route.ts",
  "apps/web/src/app/api/growth/route.ts",
];
for (const f of files) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const auto = fs.readFileSync(path.join(root, "packages/marketing/src/automation.ts"), "utf8");
for (const s of ["createNurtureWorkflow", "createLaunchWorkflow", "approveWorkflowStep", "requiresApproval", "emailSequenceTemplates"]) {
  if (auto.includes(s)) ok(`auto:${s}`);
  else fail(`auto:${s}`, "missing");
}

const gr = fs.readFileSync(path.join(root, "packages/marketing/src/growth-runner.ts"), "utf8");
for (const s of ["runGrowthLoop", "PUBLISH_WITH_AUTHORIZATION", "blocked_approval", "GROWTH_STAGES"]) {
  if (gr.includes(s)) ok(`growth:${s}`);
  else fail(`growth:${s}`, "missing");
}

const loop = fs.readFileSync(path.join(root, "packages/agents/src/growth-loop.ts"), "utf8");
if (loop.includes("OPTIMIZE") && loop.includes("RESEARCH")) ok("agents:growth-loop");
else fail("agents:loop", "missing");

const api = fs.readFileSync(path.join(root, "apps/web/src/app/api/marketing/route.ts"), "utf8");
for (const a of ["calendar", "nurture", "launch", "approve_step", "growth"]) {
  if (api.includes(a)) ok(`api:${a}`);
  else fail(`api:${a}`, "missing");
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
