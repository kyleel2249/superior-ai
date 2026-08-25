import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("PHASE 30 — Self-testing & Self-healing\n");

const files = [
  "packages/observability/src/self-test.ts",
  "packages/observability/src/self-heal.ts",
  "apps/web/src/app/api/self-test/route.ts",
];
for (const f of files) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const st = fs.readFileSync(path.join(root, "packages/observability/src/self-test.ts"), "utf8");
for (const s of ["runSelfTests", "SelfTestReport", "getFoundationHealth"]) {
  if (st.includes(s)) ok(`test:${s}`);
  else fail(`test:${s}`, "missing");
}

const sh = fs.readFileSync(path.join(root, "packages/observability/src/self-heal.ts"), "utf8");
for (const s of ["applyHealAction", "autoHealFromReport", "requiresApproval", "listHealActions"]) {
  if (sh.includes(s)) ok(`heal:${s}`);
  else fail(`heal:${s}`, "missing");
}

const api = fs.readFileSync(path.join(root, "apps/web/src/app/api/self-test/route.ts"), "utf8");
for (const a of ["run", "heal", "auto_heal", "pulse"]) {
  if (api.includes(a)) ok(`api:${a}`);
  else fail(`api:${a}`, "missing");
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
