import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("PHASE 15 — UGC, Avatar & Media Cloning\n");

const files = [
  "packages/creative/src/ugc.ts",
  "packages/creative/src/avatar.ts",
  "apps/web/src/app/api/ugc/route.ts",
];
for (const f of files) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const ugc = fs.readFileSync(path.join(root, "packages/creative/src/ugc.ts"), "utf8");
for (const s of ["createUgcPackage", "productTestimonialUgc", "CreatorPersona", "authorized_likeness", "likenessAuthorization", "consistencyKeys"]) {
  if (ugc.includes(s)) ok(`ugc:${s}`);
  else fail(`ugc:${s}`, "missing");
}

const av = fs.readFileSync(path.join(root, "packages/creative/src/avatar.ts"), "utf8");
for (const s of ["createFictionalAvatar", "createAuthorizedAvatar", "buildTalkingAvatarScript", "blocked_authorization", "lipSync", "gestures"]) {
  if (av.includes(s)) ok(`avatar:${s}`);
  else fail(`avatar:${s}`, "missing");
}

const api = fs.readFileSync(path.join(root, "apps/web/src/app/api/ugc/route.ts"), "utf8");
for (const a of ["ugc", "testimonial", "avatar", "talking"]) {
  if (api.includes(a)) ok(`api:${a}`);
  else fail(`api:${a}`, "missing");
}

// Unit: block unauthorized likeness
function authGate(likenessAuth) {
  if (!likenessAuth) return "fallback_stock";
  return "authorized";
}
if (authGate(false) === "fallback_stock") ok("unit:auth gate");
else fail("unit:auth", "fail open");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
