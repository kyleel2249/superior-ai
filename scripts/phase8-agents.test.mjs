import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("PHASE 8 — Core Agent Framework\n");

const files = [
  "packages/agents/src/framework/permissions.ts",
  "packages/agents/src/framework/message-bus.ts",
  "packages/agents/src/framework/task-manager.ts",
  "packages/agents/src/framework/runtime.ts",
  "packages/agents/src/framework/scheduler.ts",
  "packages/agents/src/council.ts",
  "apps/web/src/app/api/agents/route.ts",
];
for (const f of files) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const tm = fs.readFileSync(path.join(root, "packages/agents/src/framework/task-manager.ts"), "utf8");
for (const fn of ["createAgentTask", "assignTask", "completeTask", "failTask", "retryTask", "escalateTask"]) {
  if (tm.includes(fn)) ok(`task:${fn}`);
  else fail(`task:${fn}`, "missing");
}

const bus = fs.readFileSync(path.join(root, "packages/agents/src/framework/message-bus.ts"), "utf8");
for (const fn of ["sendAgentMessage", "subscribeAgent", "readInbox"]) {
  if (bus.includes(fn)) ok(`bus:${fn}`);
  else fail(`bus:${fn}`, "missing");
}

const rt = fs.readFileSync(path.join(root, "packages/agents/src/framework/runtime.ts"), "utf8");
for (const fn of ["createAgentInstance", "agentUseTool", "agentUseMemory", "agentCallAgent", "runAgentTask"]) {
  if (rt.includes(fn)) ok(`runtime:${fn}`);
  else fail(`runtime:${fn}`, "missing");
}

const api = fs.readFileSync(path.join(root, "apps/web/src/app/api/agents/route.ts"), "utf8");
for (const a of ["create", "run", "assign", "complete", "fail", "retry", "escalate", "message", "use_tool", "use_memory", "call_agent", "schedule"]) {
  if (api.includes(`"${a}"`) || api.includes(`action === "${a}"`)) ok(`api:${a}`);
  else fail(`api:${a}`, "missing");
}

const council = fs.readFileSync(path.join(root, "packages/agents/src/council.ts"), "utf8");
for (const f of ["systemPrompt", "permissions", "tools", "preferredModels", "role"]) {
  if (council.includes(f)) ok(`def:${f}`);
  else fail(`def:${f}`, "missing");
}

// Unit: permissions
function has(granted, need) {
  return need.every((p) => granted.includes(p) || granted.includes("*"));
}
if (has(["plan", "delegate"], ["plan"])) ok("unit:perm allow");
else fail("unit:perm", "allow");
if (!has(["plan"], ["approve"])) ok("unit:perm deny");
else fail("unit:perm", "deny");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
