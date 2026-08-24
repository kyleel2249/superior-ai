import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("PHASE 20 — Customer Experience & Support\n");

const files = [
  "packages/cx/src/journey.ts",
  "packages/cx/src/personas.ts",
  "packages/cx/src/voc.ts",
  "packages/support/src/workforce.ts",
  "apps/web/src/app/api/cx/route.ts",
  "apps/web/src/app/api/support/route.ts",
];
for (const f of files) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const voc = fs.readFileSync(path.join(root, "packages/cx/src/voc.ts"), "utf8");
for (const s of ["analyzeVoc", "retentionPlaybook", "npsShell", "csatShell", "not fabricated"]) {
  if (voc.includes(s) || (s === "not fabricated" && voc.includes("not fabricated"))) ok(`voc:${s}`);
  else if (s === "not fabricated" && voc.includes("fabricated")) ok(`voc:${s}`);
  else fail(`voc:${s}`, "missing");
}

const support = fs.readFileSync(path.join(root, "packages/support/src/workforce.ts"), "utf8");
for (const s of ["openTicket", "resolveTicket", "detectSentiment", "upsertKbArticle", "draftSupportReply", "Do not ask customer to repeat"]) {
  if (support.includes(s)) ok(`support:${s}`);
  else fail(`support:${s}`, "missing");
}

const journey = fs.readFileSync(path.join(root, "packages/cx/src/journey.ts"), "utf8");
if (journey.includes("buildJourney") && journey.includes("onboarding")) ok("journey:map");
else fail("journey", "missing");

const cxApi = fs.readFileSync(path.join(root, "apps/web/src/app/api/cx/route.ts"), "utf8");
for (const a of ["persona", "journey", "voc", "retention"]) {
  if (cxApi.includes(a)) ok(`cx-api:${a}`);
  else fail(`cx-api:${a}`, "missing");
}

const supApi = fs.readFileSync(path.join(root, "apps/web/src/app/api/support/route.ts"), "utf8");
for (const a of ["open", "resolve", "kb_upsert", "draft_reply"]) {
  if (supApi.includes(a)) ok(`support-api:${a}`);
  else fail(`support-api:${a}`, "missing");
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
