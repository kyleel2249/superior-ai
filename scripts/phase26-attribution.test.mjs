import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("PHASE 26 — Analytics & Attribution\n");

const files = [
  "packages/intelligence/src/funnel-attribution.ts",
  "packages/intelligence/src/analytics.ts",
  "packages/billing/src/attribution.ts",
  "apps/web/src/app/api/attribution/route.ts",
  "apps/web/src/app/api/analytics/route.ts",
];
for (const f of files) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const fun = fs.readFileSync(path.join(root, "packages/intelligence/src/funnel-attribution.ts"), "utf8");
for (const s of ["recordAttributionEvent", "rollupByChannel", "rollupByCampaign", "funnelSummary", "seedDemoAttribution", "never invents"]) {
  if (fun.includes(s)) ok(`funnel:${s}`);
  else fail(`funnel:${s}`, "missing");
}

const cost = fs.readFileSync(path.join(root, "packages/billing/src/attribution.ts"), "utf8");
if (cost.includes("attributionReport") && cost.includes("recordModelCost")) ok("cost:attribution");
else fail("cost", "missing");

const api = fs.readFileSync(path.join(root, "apps/web/src/app/api/attribution/route.ts"), "utf8");
for (const a of ["seed_demo", "record_cost", "channels", "campaigns", "cost"]) {
  if (api.includes(a)) ok(`api:${a}`);
  else fail(`api:${a}`, "missing");
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
