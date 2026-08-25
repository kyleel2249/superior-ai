import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("PHASE 29 — Security, Permissions, Sandbox\n");

const files = [
  "packages/security/src/sandbox.ts",
  "packages/security/src/api-guard.ts",
  "packages/security/src/gdpr.ts",
  "packages/auth/src/rbac.ts",
  "packages/tools/src/code-exec.ts",
  "apps/web/src/middleware.ts",
  "apps/web/src/app/api/security/route.ts",
  "docs/compliance/GVISOR_WORKER.md",
];
for (const f of files) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const sb = fs.readFileSync(path.join(root, "packages/security/src/sandbox.ts"), "utf8");
for (const s of ["currentSandboxPolicy", "gvisorWorkerNotes", "assertSafeCodeSnippet", "dry_run"]) {
  if (sb.includes(s)) ok(`sandbox:${s}`);
  else fail(`sandbox:${s}`, "missing");
}

const guard = fs.readFileSync(path.join(root, "packages/security/src/api-guard.ts"), "utf8");
if (guard.includes("guardRequest") && guard.includes("local-first")) ok("guard:api");
else fail("guard", "missing");

const mw = fs.readFileSync(path.join(root, "apps/web/src/middleware.ts"), "utf8");
if (mw.includes("X-Frame-Options") && mw.includes("nosniff")) ok("mw:headers");
else fail("mw", "missing");

const api = fs.readFileSync(path.join(root, "apps/web/src/app/api/security/route.ts"), "utf8");
if (api.includes("sandbox") && api.includes("check_code")) ok("api:sandbox");
else fail("api", "missing");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
