import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("PHASE 23 — Security, Privacy & Compliance + KPI Dashboard\n");

const files = [
  "packages/security/src/privacy.ts",
  "packages/security/src/compliance.ts",
  "packages/auth/src/session.ts",
  "packages/audit/src/log.ts",
  "apps/web/src/app/api/security/route.ts",
  "apps/web/src/app/dashboard/page.tsx",
];
for (const f of files) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const priv = fs.readFileSync(path.join(root, "packages/security/src/privacy.ts"), "utf8");
for (const s of ["dataClassificationGuide", "openPrivacyRequest", "restricted", "API keys"]) {
  if (priv.includes(s)) ok(`privacy:${s}`);
  else fail(`privacy:${s}`, "missing");
}

const comp = fs.readFileSync(path.join(root, "packages/security/src/compliance.ts"), "utf8");
for (const s of ["soc2ControlTemplates", "evidencePackChecklist", "securityHeadersRecommended", "CC6.1"]) {
  if (comp.includes(s)) ok(`compliance:${s}`);
  else fail(`compliance:${s}`, "missing");
}

const dash = fs.readFileSync(path.join(root, "apps/web/src/app/dashboard/page.tsx"), "utf8");
for (const s of ["KPI Dashboard", "no_data", "observed", "Generate briefing", "/api/analytics"]) {
  if (dash.includes(s)) ok(`dashboard:${s}`);
  else fail(`dashboard:${s}`, "missing");
}

const audit = fs.readFileSync(path.join(root, "packages/audit/src/log.ts"), "utf8");
if (audit.includes("listAuditEvents") && audit.includes("auth.login")) ok("audit:stream");
else fail("audit", "missing");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
