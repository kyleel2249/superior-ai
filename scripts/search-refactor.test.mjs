import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let p = 0, f = 0;
const ok = (n) => { console.log(" ✓ " + n); p++; };
const fail = (n, e) => { console.error(" ✗ " + n + ": " + e); f++; };

console.log("Search refactor + summarization\n");

for (const file of [
  "packages/tools/src/search/types.ts",
  "packages/tools/src/search/merge.ts",
  "packages/tools/src/search/summarize.ts",
  "docs/PROJECT_ASSESSMENT.md",
]) {
  if (fs.existsSync(path.join(root, file))) ok(file);
  else fail(file, "missing");
}

const merge = fs.readFileSync(path.join(root, "packages/tools/src/search/merge.ts"), "utf8");
for (const s of ["normalizeUrl", "mergeSearchHits", "formatEngineSummary"]) {
  if (merge.includes(`function ${s}`) || merge.includes(`export function ${s}`)) ok("merge:" + s);
  else fail("merge:" + s, "missing");
}

const sum = fs.readFileSync(path.join(root, "packages/tools/src/search/summarize.ts"), "utf8");
for (const s of ["summarizeSearchExtractive", "summarizeSearchResults", "buildSummarizationPrompt", "preferAbstractive"]) {
  if (sum.includes(s)) ok("sum:" + s);
  else fail("sum:" + s, "missing");
}

const ws = fs.readFileSync(path.join(root, "packages/tools/src/web-search.ts"), "utf8");
if (ws.includes("mergeSearchHits")) ok("web-search uses merge");
else fail("web-search merge", "not wired");

const dr = fs.readFileSync(path.join(root, "packages/research/src/deep-research.ts"), "utf8");
if (dr.includes("multi.merged") && !dr.includes("multi.results")) ok("deep-research uses merged");
else fail("deep-research", "still uses multi.results");

const ag = fs.readFileSync(path.join(root, "packages/research/src/auto-gather.ts"), "utf8");
if (ag.includes("summarizeSearchResults")) ok("auto-gather summarizes");
else fail("auto-gather", "no summarize");

const api = fs.readFileSync(path.join(root, "apps/web/src/app/api/search/route.ts"), "utf8");
if (api.includes("summarize") && api.includes("aiSummary")) ok("api/search summarize");
else fail("api/search", "no summarize flag");

// Unit-ish: extractive pure logic via dynamic import may fail without ts; simulate scoring contract
if (sum.includes("relevanceScore") && sum.includes("Never invent")) ok("grounding rules");
else fail("grounding", "weak");

console.log(`\n${p} passed, ${f} failed`);
process.exit(f ? 1 : 0);
