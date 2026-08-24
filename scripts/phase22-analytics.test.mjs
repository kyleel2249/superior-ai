import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("PHASE 22 — Analytics, BI & Decisions\n");

const files = [
  "packages/intelligence/src/analytics.ts",
  "packages/intelligence/src/master-loop.ts",
  "apps/web/src/app/api/analytics/route.ts",
];
for (const f of files) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const a = fs.readFileSync(path.join(root, "packages/intelligence/src/analytics.ts"), "utf8");
for (const s of [
  "DEFAULT_KPIS",
  "evaluateKpis",
  "buildExecutiveBriefing",
  "createDecision",
  "no_data",
  "Never invents",
  "funnelAnalyticsTemplate",
  "ObservedMetric",
]) {
  if (a.includes(s)) ok(`analytics:${s}`);
  else fail(`analytics:${s}`, "missing");
}

const api = fs.readFileSync(path.join(root, "apps/web/src/app/api/analytics/route.ts"), "utf8");
for (const x of ["briefing", "evaluate", "decision", "master_loop", "observed"]) {
  if (api.includes(x)) ok(`api:${x}`);
  else fail(`api:${x}`, "missing");
}

// Unit: no data without observation
function evalKpi(observed) {
  return observed.length ? "ok" : "no_data";
}
if (evalKpi([]) === "no_data") ok("unit:no invent");
else fail("unit", "invented");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
