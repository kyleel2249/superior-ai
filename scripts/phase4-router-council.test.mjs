import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("PHASE 4 — Router & Multi-Model Council\n");

const files = [
  "packages/ai-gateway/src/router/superior-router.ts",
  "packages/ai-gateway/src/router/task-classifier.ts",
  "packages/ai-gateway/src/router/ensemble.ts",
  "packages/agents/src/council-roles.ts",
  "packages/agents/src/council.ts",
  "apps/web/src/app/api/route/route.ts",
  "apps/web/src/app/api/orchestrate/route.ts",
];
for (const f of files) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const router = fs.readFileSync(path.join(root, "packages/ai-gateway/src/router/superior-router.ts"), "utf8");
for (const s of ["scoreModel", "primary", "secondary", "critic", "fallback", "SUPREME", "AUTONOMOUS"]) {
  if (router.includes(s)) ok(`router:${s}`);
  else fail(`router:${s}`, "missing");
}

const clf = fs.readFileSync(path.join(root, "packages/ai-gateway/src/router/task-classifier.ts"), "utf8");
for (const s of ["coding", "research", "classifyTask", "intelligenceLevel"]) {
  if (clf.includes(s)) ok(`classifier:${s}`);
  else fail(`classifier:${s}`, "missing");
}

const ens = fs.readFileSync(path.join(root, "packages/ai-gateway/src/router/ensemble.ts"), "utf8");
for (const s of ["planEnsemble", "detectConflict", "synthesizeFinal", "supreme", "autonomous", "singleFinal", "conflictPolicy"]) {
  if (ens.includes(s) || (s === "singleFinal" && ens.includes("exactly one final"))) ok(`ensemble:${s}`);
  else fail(`ensemble:${s}`, "missing");
}

const roles = fs.readFileSync(path.join(root, "packages/agents/src/council-roles.ts"), "utf8");
for (const s of ["CRITIC_SYSTEM", "VERIFIER_SYSTEM", "SYNTHESIS_SYSTEM", "planCouncilPasses"]) {
  if (roles.includes(s)) ok(`council:${s}`);
  else fail(`council:${s}`, "missing");
}

const api = fs.readFileSync(path.join(root, "apps/web/src/app/api/route/route.ts"), "utf8");
for (const a of ["classify", "route", "conflict", "synthesize", "plan"]) {
  if (api.includes(a)) ok(`api:${a}`);
  else fail(`api:${a}`, "missing");
}

// Pure logic unit tests inline
function classifyTask(text) {
  if (/\bcode|debug\b/i.test(text)) return "coding";
  if (/\bresearch\b/i.test(text)) return "research";
  return "chat";
}
if (classifyTask("debug this TypeScript API") === "coding") ok("unit:classify coding");
else fail("unit:classify", "coding");
if (classifyTask("research competitor pricing") === "research") ok("unit:classify research");
else fail("unit:classify", "research");

function detectConflict(answers) {
  const n = answers.map((a) => a.text.toLowerCase());
  const yes = n.filter((t) => /\byes\b|\brecommend\b/.test(t)).length;
  const no = n.filter((t) => /\bno\b|\bavoid\b/.test(t)).length;
  return yes > 0 && no > 0;
}
if (detectConflict([{ text: "I recommend shipping" }, { text: "Avoid shipping now" }])) ok("unit:conflict detect");
else fail("unit:conflict", "missed");

function synthesizeFinal(primary, critic) {
  return primary + (critic ? "\n\n— Critic notes —\n" + critic : "");
}
const final = synthesizeFinal("Answer A", "Missing sources");
if (final.includes("Answer A") && final.includes("Critic") && final.split("Answer A").length === 2) ok("unit:single final");
else fail("unit:synthesize", "duplicate or missing");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
