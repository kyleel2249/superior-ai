import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("PHASE 28 — AI Company Command Center\n");

const files = [
  "apps/web/src/app/command/page.tsx",
  "apps/web/src/app/api/company/route.ts",
  "packages/agents/src/departments/company-mode.ts",
  "packages/agents/src/departments/full-council.ts",
];
for (const f of files) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const ui = fs.readFileSync(path.join(root, "apps/web/src/app/command/page.tsx"), "utf8");
for (const s of ["Command Center", "Engage departments", "/api/company", "/api/daily", "Executive synthesis"]) {
  if (ui.includes(s)) ok(`ui:${s}`);
  else fail(`ui:${s}`, "missing");
}

const mode = fs.readFileSync(path.join(root, "packages/agents/src/departments/company-mode.ts"), "utf8");
if (mode.includes("runAsCompany") && mode.includes("listCompanyDepartments")) ok("mode:run");
else fail("mode", "missing");

const nav = fs.readFileSync(path.join(root, "apps/web/src/components/AppShell.tsx"), "utf8");
if (nav.includes('href: "/command"')) ok("nav:command");
else fail("nav", "missing");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
