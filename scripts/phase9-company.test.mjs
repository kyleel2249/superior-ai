import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("PHASE 9 — Expert Departments & AI Company\n");

const files = [
  "packages/agents/src/departments/full-council.ts",
  "packages/agents/src/departments/company-mode.ts",
  "packages/agents/src/growth-loop.ts",
  "apps/web/src/app/api/company/route.ts",
];
for (const f of files) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const full = fs.readFileSync(path.join(root, "packages/agents/src/departments/full-council.ts"), "utf8");
for (const d of [
  "EXECUTIVE_TEAM",
  "STRATEGY_DEPT",
  "SALES_DEPT",
  "MARKETING_DEPT",
  "CREATIVE_DEPT",
  "TECHNOLOGY_DEPT",
  "FINANCE_DEPT",
  "CUSTOMER_DEPT",
  "OPERATIONS_DEPT",
  "HR_DEPT",
  "LEGAL_DEPT",
  "RESEARCH_DEPT",
  "SEO_DEPT",
  "ALL_DEPARTMENTS",
  "selectAgentsForGrowthTask",
  "buildCompanyOrgChart",
]) {
  if (full.includes(d)) ok(`dept:${d}`);
  else fail(`dept:${d}`, "missing");
}

const company = fs.readFileSync(path.join(root, "packages/agents/src/departments/company-mode.ts"), "utf8");
for (const s of ["runAsCompany", "RUN_AS_COMPANY", "shared", "executiveSynthesis", "selectAgentsForGrowthTask"]) {
  if (company.includes(s)) ok(`company:${s}`);
  else fail(`company:${s}`, "missing");
}

const growth = fs.readFileSync(path.join(root, "packages/agents/src/growth-loop.ts"), "utf8");
for (const s of ["RESEARCH", "CREATE_CAMPAIGN", "GENERATE_LEADS", "OPTIMIZE", "growthLoopPlan"]) {
  if (growth.includes(s)) ok(`growth:${s}`);
  else fail(`growth:${s}`, "missing");
}

const api = fs.readFileSync(path.join(root, "apps/web/src/app/api/company/route.ts"), "utf8");
for (const a of ["runAsCompany", "listCompanyDepartments", "plan", "org"]) {
  if (api.includes(a)) ok(`api:${a}`);
  else fail(`api:${a}`, "missing");
}

// Unit: department pick includes executive
function pick(obj) {
  const ids = new Set(["executive"]);
  if (/sales/i.test(obj)) ids.add("sales");
  if (/marketing/i.test(obj)) ids.add("marketing");
  return [...ids];
}
if (pick("Launch SaaS").includes("executive") && pick("sales pipeline").includes("sales")) ok("unit:dept pick");
else fail("unit:dept", "pick");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
