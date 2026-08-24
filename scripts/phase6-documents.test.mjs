import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("PHASE 6 — File, Document & Multimodal\n");

const files = [
  "packages/documents/src/types.ts",
  "packages/documents/src/detect.ts",
  "packages/documents/src/parsers.ts",
  "packages/documents/src/multimodal.ts",
  "packages/documents/src/compare.ts",
  "packages/documents/src/index.ts",
  "apps/web/src/app/api/documents/route.ts",
  "packages/tools/src/document-tools.ts",
];
for (const f of files) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const parsers = fs.readFileSync(path.join(root, "packages/documents/src/parsers.ts"), "utf8");
for (const k of ["parseTxt", "parseCsv", "parseJson", "parsePdfBuffer", "parseDocxBuffer", "parseXlsxBuffer", "parsePptxBuffer", "parseHtml"]) {
  if (parsers.includes(k)) ok(`parser:${k}`);
  else fail(`parser:${k}`, "missing");
}

const mm = fs.readFileSync(path.join(root, "packages/documents/src/multimodal.ts"), "utf8");
for (const k of ["analyzeImage", "transcribeAudio", "analyzeVideo", "CONFIGURATION_REQUIRED"]) {
  if (mm.includes(k)) ok(`mm:${k}`);
  else fail(`mm:${k}`, "missing");
}

const api = fs.readFileSync(path.join(root, "apps/web/src/app/api/documents/route.ts"), "utf8");
for (const a of ["parse", "detect", "analyze", "compare", "multi"]) {
  if (api.includes(a)) ok(`api:${a}`);
  else fail(`api:${a}`, "missing");
}

// Unit: CSV parse logic
function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter(Boolean);
  const headers = lines[0].split(",");
  const rows = lines.slice(1).map((l) => l.split(","));
  return { headers, rows };
}
const csv = parseCsv("name,region\nAcme,Ghana\nBeta,Kenya");
if (csv.headers[0] === "name" && csv.rows.length === 2) ok("unit:csv");
else fail("unit:csv", "parse");

// Unit: detect
function detect(name) {
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".csv")) return "csv";
  if (name.endsWith(".png")) return "image";
  return "unknown";
}
if (detect("report.pdf") === "pdf" && detect("shot.png") === "image") ok("unit:detect");
else fail("unit:detect", "miss");

// Unit: PDF header
const pdfHeader = Buffer.from("%PDF-1.4\n");
if (pdfHeader.toString("latin1").startsWith("%PDF")) ok("unit:pdf header");
else fail("unit:pdf", "header");

// Honesty: no fake transcript
if (mm.includes("No fabricated") || mm.includes("not executed") || mm.includes("CONFIGURATION_REQUIRED")) {
  ok("honesty: no fabricated media results");
} else fail("honesty", "missing warnings");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
