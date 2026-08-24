import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("PHASE 18 — Competitor Intelligence\n");

const files = [
  "packages/competitor/src/intelligence.ts",
  "packages/competitor/src/research.ts",
  "packages/competitor/src/brief.ts",
  "apps/web/src/app/api/competitors/route.ts",
];
for (const f of files) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const intel = fs.readFileSync(path.join(root, "packages/competitor/src/intelligence.ts"), "utf8");
for (const s of ["emptyCompetitor", "buildScorecard", "trafficIntelligenceShell", "Never fabricate", "comparisonTemplate"]) {
  if (intel.includes(s)) ok(`intel:${s}`);
  else fail(`intel:${s}`, "missing");
}

const brief = fs.readFileSync(path.join(root, "packages/competitor/src/brief.ts"), "utf8");
for (const s of ["generateCompetitiveBrief", "buildFeatureComparison", "messagingComparison", "opportunities", "whereTheyWin"]) {
  if (brief.includes(s)) ok(`brief:${s}`);
  else fail(`brief:${s}`, "missing");
}

const research = fs.readFileSync(path.join(root, "packages/competitor/src/research.ts"), "utf8");
if (research.includes("researchCompetitors") && research.includes("liveSearch")) ok("research:live");
else fail("research", "missing");

const api = fs.readFileSync(path.join(root, "apps/web/src/app/api/competitors/route.ts"), "utf8");
for (const a of ["research", "brief", "messaging", "scorecard", "traffic"]) {
  if (api.includes(a)) ok(`api:${a}`);
  else fail(`api:${a}`, "missing");
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
