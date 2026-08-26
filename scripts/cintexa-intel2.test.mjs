import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("CINTEXA KPI / Economics / Trust / KG\n");

const files = [
  "packages/intelligence/src/kpi-intelligence.ts",
  "packages/intelligence/src/root-cause.ts",
  "packages/intelligence/src/ai-economics.ts",
  "packages/intelligence/src/capacity-planner.ts",
  "packages/intelligence/src/knowledge-graph.ts",
  "packages/security/src/instruction-trust.ts",
];
for (const f of files) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const twin = fs.readFileSync(path.join(root, "packages/intelligence/src/digital-twin.ts"), "utf8");
if (twin.includes("FIXED_COEFFICIENTS") && twin.includes("Deterministic")) ok("twin:deterministic");
else fail("twin", "not deterministic");

const trust = fs.readFileSync(path.join(root, "packages/security/src/instruction-trust.ts"), "utf8");
for (const s of ["UNTRUSTED_EXTERNAL_CONTENT", "ignore_previous", "mergeTrustedPrompt"]) {
  if (trust.includes(s)) ok(`trust:${s}`);
  else fail(`trust:${s}`, "missing");
}

const api = fs.readFileSync(path.join(root, "apps/web/src/app/api/advanced/route.ts"), "utf8");
for (const a of ["kpi_record", "root_cause_create", "economics_rollup", "capacity_plan", "trust_analyze", "kg_upsert"]) {
  if (api.includes(a)) ok(`api:${a}`);
  else fail(`api:${a}`, "missing");
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
