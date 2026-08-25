import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("CINTEXA — Cascade, Council, Quality, Control Center\n");

const files = [
  "packages/ai-gateway/src/router/cascade.ts",
  "packages/ai-gateway/src/router/council.ts",
  "packages/ai-gateway/src/quality/engine.ts",
  "apps/web/src/app/admin/control/page.tsx",
  "apps/web/src/app/api/cintexa/route.ts",
];
for (const f of files) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const cascade = fs.readFileSync(path.join(root, "packages/ai-gateway/src/router/cascade.ts"), "utf8");
for (const s of ["planCascade", "worker", "frontier", "human_review", "nextCascadeTier"]) {
  if (cascade.includes(s)) ok(`cascade:${s}`);
  else fail(`cascade:${s}`, "missing");
}

const council = fs.readFileSync(path.join(root, "packages/ai-gateway/src/router/council.ts"), "utf8");
for (const s of ["planCouncil", "planDisagreement", "judge", "prefer_evidence"]) {
  if (council.includes(s)) ok(`council:${s}`);
  else fail(`council:${s}`, "missing");
}

const quality = fs.readFileSync(path.join(root, "packages/ai-gateway/src/quality/engine.ts"), "utf8");
for (const s of ["evaluateQuality", "qualityGate", "recommendedAction", "escalate_human"]) {
  if (quality.includes(s)) ok(`quality:${s}`);
  else fail(`quality:${s}`, "missing");
}

const api = fs.readFileSync(path.join(root, "apps/web/src/app/api/cintexa/route.ts"), "utf8");
for (const a of ["cascade", "council", "quality", "disagreement"]) {
  if (api.includes(`"${a}"`) || api.includes(`'${a}'`) || api.includes(`action === "${a}"`)) ok(`api:${a}`);
  else fail(`api:${a}`, "missing");
}

const ui = fs.readFileSync(path.join(root, "apps/web/src/app/admin/control/page.tsx"), "utf8");
if (ui.includes("CINTEXA AI Control Center") && ui.includes("Plan cascade")) ok("ui:control");
else fail("ui", "missing");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
