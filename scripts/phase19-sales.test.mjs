import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("PHASE 19 — CRM, Sales & Lead Engine\n");

const files = [
  "packages/sales/src/engine.ts",
  "packages/crm/src/connectors.ts",
  "apps/web/src/app/api/sales/route.ts",
  "apps/web/src/app/api/crm/route.ts",
];
for (const f of files) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const sales = fs.readFileSync(path.join(root, "packages/sales/src/engine.ts"), "utf8");
for (const s of [
  "createLeadShell",
  "scoreLead",
  "personalizeOutreach",
  "Never invent",
  "buildSalesSequence",
  "generateProposal",
  "createDealFromLead",
  "pipelineSnapshot",
  "qualifyLead",
  "funnelStages",
]) {
  if (sales.includes(s)) ok(`sales:${s}`);
  else fail(`sales:${s}`, "missing");
}

const crm = fs.readFileSync(path.join(root, "packages/crm/src/connectors.ts"), "utf8");
for (const s of ["hubspot", "salesforce", "pipedrive", "upsertContact", "notConfigured"]) {
  if (crm.includes(s)) ok(`crm:${s}`);
  else fail(`crm:${s}`, "missing");
}

const api = fs.readFileSync(path.join(root, "apps/web/src/app/api/sales/route.ts"), "utf8");
for (const a of ["create_lead", "sequence", "proposal", "deal", "qualify", "outreach"]) {
  if (api.includes(a)) ok(`api:${a}`);
  else fail(`api:${a}`, "missing");
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
