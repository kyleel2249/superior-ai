import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("PHASE 27 — Daily Intelligence\n");

const files = [
  "packages/intelligence/src/daily-brief.ts",
  "apps/web/src/app/api/daily/route.ts",
  "apps/web/src/app/daily/page.tsx",
];
for (const f of files) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const src = fs.readFileSync(path.join(root, "packages/intelligence/src/daily-brief.ts"), "utf8");
for (const s of ["generateDailyBrief", "focusToday", "buildExecutiveBriefing", "funnelSummary", "never invents"]) {
  if (src.includes(s)) ok(`brief:${s}`);
  else fail(`brief:${s}`, "missing");
}

const api = fs.readFileSync(path.join(root, "apps/web/src/app/api/daily/route.ts"), "utf8");
if (api.includes("generateDailyBrief") && api.includes("retrieveRelevant")) ok("api:daily");
else fail("api", "missing");

const page = fs.readFileSync(path.join(root, "apps/web/src/app/daily/page.tsx"), "utf8");
if (page.includes("Daily Intelligence") && page.includes("/api/daily")) ok("ui:daily");
else fail("ui", "missing");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
