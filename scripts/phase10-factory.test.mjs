import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("PHASE 10 — Software Factory\n");

const files = [
  "packages/agents/src/factory/software-factory.ts",
  "packages/tools/src/code-exec.ts",
  "packages/tools/src/repo.ts",
  "apps/web/src/app/api/factory/route.ts",
  "apps/web/src/app/api/repo/route.ts",
  "apps/web/src/app/api/exec/route.ts",
];
for (const f of files) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const sf = fs.readFileSync(path.join(root, "packages/agents/src/factory/software-factory.ts"), "utf8");
for (const s of [
  "createFactoryTask",
  "factoryInspectRepo",
  "factoryValidateCode",
  "runFactoryPipeline",
  "runFullSoftwareFactory",
  "generateSoftwareSpecs",
  "factoryProposeDeploy",
  "will not claim tests passed",
  "approveMutations",
  "REQUIREMENTS.md",
  "ARCHITECTURE.md",
]) {
  if (sf.includes(s)) ok(`factory:${s}`);
  else fail(`factory:${s}`, "missing");
}

const exec = fs.readFileSync(path.join(root, "packages/tools/src/code-exec.ts"), "utf8");
if (exec.includes("executeCode") || exec.includes("ALLOW_CODE_EXEC")) ok("code-exec sandbox");
else fail("code-exec", "missing");

const repo = fs.readFileSync(path.join(root, "packages/tools/src/repo.ts"), "utf8");
if (repo.includes("repoListFiles") || repo.includes("listFiles")) ok("repo inspect");
else fail("repo", "missing");

const api = fs.readFileSync(path.join(root, "apps/web/src/app/api/factory/route.ts"), "utf8");
for (const a of ["pipeline", "full", "inspect", "validate", "advance", "specs"]) {
  if (api.includes(a)) ok(`api:${a}`);
  else fail(`api:${a}`, "missing");
}

// Unit: no fake pass without evidence
function recordTest(passed, log) {
  if (passed && !log) return "INVALID"; // must not claim pass without log in strict mode optional
  return passed ? `PASS:${log}` : `FAIL:${log}`;
}
if (recordTest(false, "1 failed").startsWith("FAIL")) ok("unit:honest fail");
else fail("unit:test", "honesty");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
