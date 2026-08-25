import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("CINTEXA Advanced Wave 2\n");
const files = [
  "packages/intelligence/src/opportunity-engine.ts",
  "packages/intelligence/src/predictive-alerts.ts",
  "packages/intelligence/src/sla-queue-incident.ts",
  "packages/security/src/autonomy.ts",
  "packages/agents/src/skills/registry.ts",
];
for (const f of files) {
  if (fs.existsSync(path.join(root, f))) ok(f); else fail(f, "missing");
}
const api = fs.readFileSync(path.join(root, "apps/web/src/app/api/advanced/route.ts"), "utf8");
for (const a of ["opportunities", "alert_series", "enqueue", "incident_open", "action_risk", "role_generate", "skills_compose"]) {
  if (api.includes(a)) ok(`api:${a}`); else fail(`api:${a}`, "missing");
}
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
