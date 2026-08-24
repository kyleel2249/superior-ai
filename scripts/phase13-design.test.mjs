import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("PHASE 13 — Vector Design Studio\n");

const files = [
  "packages/design/src/types.ts",
  "packages/design/src/path.ts",
  "packages/design/src/boolean.ts",
  "packages/design/src/svg.ts",
  "packages/design/src/document.ts",
  "apps/web/src/app/api/design/route.ts",
];
for (const f of files) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const pathSrc = fs.readFileSync(path.join(root, "packages/design/src/path.ts"), "utf8");
for (const s of ["pathToD", "parseD", "bezierThrough", "M", "C", "Q"]) {
  if (pathSrc.includes(s)) ok(`path:${s}`);
  else fail(`path:${s}`, "missing");
}

const bool = fs.readFileSync(path.join(root, "packages/design/src/boolean.ts"), "utf8");
for (const s of ["union", "intersect", "subtract", "exclude", "shapeBuilderRect"]) {
  if (bool.includes(s)) ok(`bool:${s}`);
  else fail(`bool:${s}`, "missing");
}

const svg = fs.readFileSync(path.join(root, "packages/design/src/svg.ts"), "utf8");
for (const s of ["linearGradient", "textPath", "symbol", "pattern"]) {
  if (svg.includes(s)) ok(`svg:${s}`);
  else fail(`svg:${s}`, "missing");
}

const doc = fs.readFileSync(path.join(root, "packages/design/src/document.ts"), "utf8");
for (const s of ["createDocument", "createBrandDesignSystem", "defineSymbol", "addTextOnPath", "exportSvg"]) {
  if (doc.includes(s)) ok(`doc:${s}`);
  else fail(`doc:${s}`, "missing");
}

// Unit path d
function pathToD(cmds) {
  return cmds.map((c) => (c.op === "M" ? `M ${c.x} ${c.y}` : c.op === "Z" ? "Z" : "")).filter(Boolean).join(" ");
}
if (pathToD([{ op: "M", x: 0, y: 0 }, { op: "Z" }]).includes("M 0 0")) ok("unit:pathToD");
else fail("unit:path", "d");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
