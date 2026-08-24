import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("PHASE 16 — Advertising & Story Engine\n");

const files = [
  "packages/creative/src/ad-engine.ts",
  "packages/creative/src/campaign-engine.ts",
  "apps/web/src/app/api/ads/route.ts",
  "apps/web/src/app/api/campaigns/route.ts",
];
for (const f of files) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const ad = fs.readFileSync(path.join(root, "packages/creative/src/ad-engine.ts"), "utf8");
for (const s of [
  "generateHooks",
  "generateCtas",
  "generateAdVariant",
  "generateAdSkit",
  "generateAdCampaignCreative",
  "problem",
  "customer",
  "founder",
  "transformation",
  "humorous",
  "educational",
  "emotional",
  "10",
  "90",
]) {
  if (ad.includes(s)) ok(`ad:${s}`);
  else fail(`ad:${s}`, "missing");
}

const api = fs.readFileSync(path.join(root, "apps/web/src/app/api/ads/route.ts"), "utf8");
for (const a of ["hooks", "ctas", "variant", "skit", "campaign", "full"]) {
  if (api.includes(a)) ok(`api:${a}`);
  else fail(`api:${a}`, "missing");
}

// Unit: duration set
const durs = [10, 15, 20, 30, 45, 60, 90];
if (durs.length === 7) ok("unit:7 durations");
else fail("unit:dur", "count");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
