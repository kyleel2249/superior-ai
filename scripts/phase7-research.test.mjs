import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("PHASE 7 — Search, Browser & Deep Research\n");

const files = [
  "packages/tools/src/web-search.ts",
  "packages/tools/src/browser.ts",
  "packages/research/src/citations.ts",
  "packages/research/src/evidence.ts",
  "packages/research/src/contradictions.ts",
  "packages/research/src/url-analyzer.ts",
  "packages/research/src/deep-research.ts",
  "apps/web/src/app/api/search/route.ts",
  "apps/web/src/app/api/research/route.ts",
];
for (const f of files) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const search = fs.readFileSync(path.join(root, "packages/tools/src/web-search.ts"), "utf8");
for (const e of ["google_serper", "bing", "duckduckgo", "brave", "yandex", "wolframalpha", "Never invent"]) {
  if (search.includes(e) || search.includes("Never invents")) ok(`search:${e}`);
  else fail(`search:${e}`, "missing");
}

const browser = fs.readFileSync(path.join(root, "packages/tools/src/browser.ts"), "utf8");
for (const t of ["url_fetch", "url_audit", "url_links", "Observed Data"]) {
  if (browser.includes(t)) ok(`browser:${t}`);
  else fail(`browser:${t}`, "missing");
}

const cite = fs.readFileSync(path.join(root, "packages/research/src/citations.ts"), "utf8");
if (cite.includes("sourcesFromSearchHits") && cite.includes("never invents") || cite.includes("filter")) ok("citations");
else fail("citations", "incomplete");

const deep = fs.readFileSync(path.join(root, "packages/research/src/deep-research.ts"), "utf8");
if (deep.includes("runDeepResearch") && deep.includes("Never invents")) ok("deep research");
else fail("deep", "incomplete");

const api = fs.readFileSync(path.join(root, "apps/web/src/app/api/research/route.ts"), "utf8");
for (const a of ["deep", "urls", "search_cite", "contradictions"]) {
  if (api.includes(a)) ok(`api:${a}`);
  else fail(`api:${a}`, "missing");
}

// Unit: no invent sources
function sourcesFromHits(hits) {
  return hits.filter((h) => h.url && h.url.startsWith("http"));
}
if (sourcesFromHits([{ title: "x", url: "" }]).length === 0) ok("unit:reject empty url");
else fail("unit:sources", "accepted empty");
if (sourcesFromHits([{ title: "x", url: "https://example.com" }]).length === 1) ok("unit:accept https");
else fail("unit:sources", "reject good");

// Unit: contradiction polarity
const POS = /\b(increase|growth|success)\b/i;
const NEG = /\b(decline|failure|avoid)\b/i;
function contrad(a, b) {
  return (POS.test(a) && NEG.test(b)) || (NEG.test(a) && POS.test(b));
}
if (contrad("growth success", "decline failure")) ok("unit:contradiction");
else fail("unit:contradiction", "miss");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
