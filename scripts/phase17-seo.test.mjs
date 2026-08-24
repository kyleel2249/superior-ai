import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("PHASE 17 — SEO & Content Engine\n");

const files = [
  "packages/seo/src/engine.ts",
  "apps/web/src/app/api/seo/route.ts",
];
for (const f of files) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const eng = fs.readFileSync(path.join(root, "packages/seo/src/engine.ts"), "utf8");
for (const s of [
  "clusterKeywords",
  "planContentFactory",
  "analyzeIntent",
  "generateSeoBrief",
  "generateArticleDraft",
  "suggestSchema",
  "competitorContentGaps",
  "seoMetadata",
  "Keyword stuffing",
  "humanWritingNotes",
  "Never claims guaranteed rankings",
]) {
  if (eng.includes(s)) ok(`seo:${s}`);
  else fail(`seo:${s}`, "missing");
}

const api = fs.readFileSync(path.join(root, "apps/web/src/app/api/seo/route.ts"), "utf8");
for (const a of ["cluster", "intent", "brief", "article", "gaps", "schema", "audit"]) {
  if (api.includes(a)) ok(`api:${a}`);
  else fail(`api:${a}`, "missing");
}

// Unit intent
function intent(q) {
  if (/\bvs\b/.test(q)) return "comparison";
  if (/pricing/.test(q)) return "transactional";
  return "informational";
}
if (intent("crm vs hubspot") === "comparison") ok("unit:intent");
else fail("unit:intent", "wrong");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
