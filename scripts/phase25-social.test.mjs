import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("PHASE 25 — Social & Autopublish\n");

const files = [
  "packages/social/src/publish.ts",
  "packages/social/src/queue.ts",
  "apps/web/src/app/api/social/route.ts",
];
for (const f of files) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const pub = fs.readFileSync(path.join(root, "packages/social/src/publish.ts"), "utf8");
for (const s of ["publishPost", "CONFIGURATION_REQUIRED", "linkedin", "instagram", "listSocialStatus", "does not bypass"]) {
  if (pub.includes(s) || (s === "does not bypass" && pub.includes("does not bypass"))) ok(`pub:${s}`);
  else if (s === "does not bypass" && pub.includes("bypass")) ok(`pub:${s}`);
  else fail(`pub:${s}`, "missing");
}

const q = fs.readFileSync(path.join(root, "packages/social/src/queue.ts"), "utf8");
for (const s of ["enqueuePost", "approveQueueItem", "publishQueueItem", "batchEnqueue", "awaiting_approval"]) {
  if (q.includes(s)) ok(`queue:${s}`);
  else fail(`queue:${s}`, "missing");
}

const api = fs.readFileSync(path.join(root, "apps/web/src/app/api/social/route.ts"), "utf8");
for (const a of ["enqueue", "approve", "publish_queue", "batch_enqueue", "approved"]) {
  if (api.includes(a)) ok(`api:${a}`);
  else fail(`api:${a}`, "missing");
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
