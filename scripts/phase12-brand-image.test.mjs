import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("PHASE 12 — Image & Brand Studio\n");

const files = [
  "packages/brand/src/letterform.ts",
  "packages/brand/src/kit-export.ts",
  "packages/brand/src/assets.ts",
  "packages/ai-gateway/src/media/image-gen.ts",
  "packages/ai-gateway/src/media/image-edit.ts",
  "apps/web/src/app/brand/page.tsx",
  "apps/web/src/app/api/brand/route.ts",
  "apps/web/src/app/api/images/route.ts",
];
for (const f of files) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const letter = fs.readFileSync(path.join(root, "packages/brand/src/letterform.ts"), "utf8");
for (const s of ["geometric", "curved", "minimalist", "futuristic", "monogram", "sleek", "svgMark", "generateLetterformConcepts"]) {
  if (letter.includes(s)) ok(`brand:${s}`);
  else fail(`brand:${s}`, "missing");
}

const img = fs.readFileSync(path.join(root, "packages/ai-gateway/src/media/image-gen.ts"), "utf8");
if (img.includes("Native Resolution") && img.includes("generateImage") && img.includes("8K")) ok("image:honest resolution");
else fail("image-gen", "honesty");

const edit = fs.readFileSync(path.join(root, "packages/ai-gateway/src/media/image-edit.ts"), "utf8");
for (const op of ["object_removal", "generative_fill", "upscale", "CONFIGURATION_REQUIRED"]) {
  if (edit.includes(op)) ok(`edit:${op}`);
  else fail(`edit:${op}`, "missing");
}

const assets = fs.readFileSync(path.join(root, "packages/brand/src/assets.ts"), "utf8");
if (assets.includes("favicon") && assets.includes("og-image") && assets.includes("ad-landscape")) ok("assets:specs");
else fail("assets", "missing");

const api = fs.readFileSync(path.join(root, "apps/web/src/app/api/images/route.ts"), "utf8");
if (api.includes("editImage") && api.includes("generateImage")) ok("api:images");
else fail("api:images", "incomplete");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
