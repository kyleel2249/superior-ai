import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("PHASE 31 — Performance & Scalability\n");

const files = [
  "packages/observability/src/performance.ts",
  "packages/cache/src/index.ts",
  "apps/web/src/app/api/performance/route.ts",
];
for (const f of files) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const perf = fs.readFileSync(path.join(root, "packages/observability/src/performance.ts"), "utf8");
for (const s of ["DEFAULT_BUDGETS", "paginate", "mapPool", "scaleChecklist", "recordTiming", "withTimingAsync"]) {
  if (perf.includes(s)) ok(`perf:${s}`);
  else fail(`perf:${s}`, "missing");
}

const cache = fs.readFileSync(path.join(root, "packages/cache/src/index.ts"), "utf8");
if (cache.includes("cacheSetBounded") && cache.includes("cacheGetOrSet")) ok("cache:bounded");
else fail("cache", "missing");

const api = fs.readFileSync(path.join(root, "apps/web/src/app/api/performance/route.ts"), "utf8");
for (const a of ["budgets", "timings", "scale", "probe_health", "paginate"]) {
  if (api.includes(a)) ok(`api:${a}`);
  else fail(`api:${a}`, "missing");
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
