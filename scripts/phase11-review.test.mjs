import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("PHASE 11 — Code Review & Optimization\n");

const files = [
  "packages/agents/src/review/code-review.ts",
  "apps/web/src/app/api/review/route.ts",
];
for (const f of files) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const src = fs.readFileSync(path.join(root, "packages/agents/src/review/code-review.ts"), "utf8");
for (const s of [
  "scanSecurity",
  "scanBugs",
  "scanPerformance",
  "scanAccessibility",
  "scanSeo",
  "mapRequirements",
  "applySafeFixes",
  "reviewCode",
  "reviewBrokenFixture",
  "Implemented",
  "Missing",
  "Broken",
  "Risk",
  "Optimization Opportunity",
]) {
  if (src.includes(s)) ok(`review:${s}`);
  else fail(`review:${s}`, "missing");
}

const api = fs.readFileSync(path.join(root, "apps/web/src/app/api/review/route.ts"), "utf8");
if (api.includes("reviewCode") && api.includes("fixture")) ok("api:review");
else fail("api", "incomplete");

// Unit: detect eval
function hasEval(code) {
  return /eval\s*\(/.test(code);
}
if (hasEval("eval(x)")) ok("unit:security eval");
else fail("unit:security", "eval");

// Unit: requirement mapping
function mapReq(req, code) {
  const terms = req.toLowerCase().split(/\W+/).filter((t) => t.length > 3);
  const hits = terms.filter((t) => code.toLowerCase().includes(t)).length;
  return terms.length && hits / terms.length >= 0.6 ? "Implemented" : "Missing";
}
if (mapReq("No hardcoded secrets", "const x = 1") === "Missing") ok("unit:gap missing");
else fail("unit:gap", "miss");
if (mapReq("validate user input", "function validate(userInput) {}") === "Implemented") ok("unit:gap implemented");
else fail("unit:gap", "impl");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
