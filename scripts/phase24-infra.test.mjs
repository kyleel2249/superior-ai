import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("PHASE 24 — Infrastructure, RBAC, GDPR, Dashboard mock\n");

const files = [
  "packages/auth/src/rbac.ts",
  "packages/security/src/gdpr.ts",
  "packages/observability/src/status.ts",
  "packages/observability/src/rate-limit.ts",
  "apps/web/src/app/api/health/route.ts",
  "apps/web/src/app/api/security/route.ts",
  "apps/web/src/app/status/page.tsx",
  "apps/web/src/app/dashboard/page.tsx",
  "docs/compliance/MULTI_REGION_FAILOVER.md",
  "docs/compliance/DEPLOY.md",
];
for (const f of files) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const rbac = fs.readFileSync(path.join(root, "packages/auth/src/rbac.ts"), "utf8");
for (const s of ["POLICY_MATRIX", "can(", "assertCan", "listPoliciesForRole", "EXTENDED_ROLE_PERMS", "data_export"]) {
  if (rbac.includes(s)) ok(`rbac:${s}`);
  else fail(`rbac:${s}`, "missing");
}

const gdpr = fs.readFileSync(path.join(root, "packages/security/src/gdpr.ts"), "utf8");
for (const s of ["openDsar", "erasurePlan", "listProcessingActivities", "consentRecordTemplate", "lawfulBasis"]) {
  if (gdpr.includes(s)) ok(`gdpr:${s}`);
  else fail(`gdpr:${s}`, "missing");
}

const dash = fs.readFileSync(path.join(root, "apps/web/src/app/dashboard/page.tsx"), "utf8");
for (const s of ["MOCK_OBSERVED", "Load mock data", "Demo mode", "18420"]) {
  if (dash.includes(s)) ok(`dash:${s}`);
  else fail(`dash:${s}`, "missing");
}

const secApi = fs.readFileSync(path.join(root, "apps/web/src/app/api/security/route.ts"), "utf8");
for (const s of ["gdpr", "rbac", "dsar", "erasure_plan"]) {
  if (secApi.includes(s)) ok(`api:${s}`);
  else fail(`api:${s}`, "missing");
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
