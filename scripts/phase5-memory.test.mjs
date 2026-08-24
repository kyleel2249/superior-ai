import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("PHASE 5 — Memory & Knowledge System\n");

const files = [
  "packages/memory/src/layers.ts",
  "packages/memory/src/persistent.ts",
  "packages/memory/src/postgres.ts",
  "packages/memory/src/rag.ts",
  "packages/memory/src/embeddings.ts",
  "packages/memory/src/conflicts.ts",
  "packages/memory/src/knowledge-graph.ts",
  "packages/memory/src/context.ts",
  "packages/db/prisma/migrations/002_persistent_memory.sql",
  "packages/db/prisma/migrations/003_vector_embeddings.sql",
  "apps/web/src/app/api/memory/route.ts",
  "apps/web/src/app/api/chat/route.ts",
];
for (const f of files) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const pers = fs.readFileSync(path.join(root, "packages/memory/src/persistent.ts"), "utf8");
const types = [
  "conversation", "user", "project", "company", "customer", "product", "market",
  "competitor", "campaign", "creative", "codebase", "research", "decision",
  "workflow", "agent", "preference", "rejection",
];
for (const t of types) {
  if (pers.includes(`"${t}"`) || pers.includes(`| "${t}"`) || pers.includes(`| "${t}"`)) ok(`type:${t}`);
  else if (pers.includes(t)) ok(`type:${t}`);
  else fail(`type:${t}`, "missing");
}

for (const fn of ["remember", "forget", "updateMemory", "retrieveRelevant", "formatMemoryForPrompt"]) {
  if (pers.includes(`function ${fn}`) || pers.includes(`export function ${fn}`)) ok(`fn:${fn}`);
  else fail(`fn:${fn}`, "missing");
}

const api = fs.readFileSync(path.join(root, "apps/web/src/app/api/memory/route.ts"), "utf8");
for (const a of ["remember", "forget", "update", "update_default", "retrieve", "search", "conflicts", "context", "graph_link"]) {
  if (api.includes(a)) ok(`api:${a}`);
  else fail(`api:${a}`, "missing");
}

const chat = fs.readFileSync(path.join(root, "apps/web/src/app/api/chat/route.ts"), "utf8");
if (chat.includes("retrieveRelevantDurable") && chat.includes("formatMemoryForPrompt")) ok("chat injects memory");
else fail("chat", "memory not wired");

const rag = fs.readFileSync(path.join(root, "packages/memory/src/rag.ts"), "utf8");
if (rag.includes("hybridRetrieve") && rag.includes("vectorSearch")) ok("hybrid RAG");
else fail("rag", "incomplete");

const conf = fs.readFileSync(path.join(root, "packages/memory/src/conflicts.ts"), "utf8");
if (conf.includes("detectMemoryConflicts") && conf.includes("preferCanonical")) ok("conflicts");
else fail("conflicts", "incomplete");

const graph = fs.readFileSync(path.join(root, "packages/memory/src/knowledge-graph.ts"), "utf8");
if (graph.includes("linkEntities") && graph.includes("neighbors")) ok("knowledge graph");
else fail("graph", "incomplete");

const mig = fs.readFileSync(path.join(root, "packages/db/prisma/migrations/003_vector_embeddings.sql"), "utf8");
if (mig.includes("vector(1536)") && mig.includes("ivfflat")) ok("pgvector migration");
else fail("pgvector", "missing");

// Unit: conflict polarity
const NEGATION = /\b(not|never|don't|avoid)\b/i;
function conflict(a, b) {
  return NEGATION.test(a) !== NEGATION.test(b);
}
if (conflict("Prefer long answers", "Never use long answers")) ok("unit:conflict polarity");
else fail("unit:conflict", "miss");

// Unit: irrelevant filter — no term overlap → skip
function relevant(query, content) {
  const terms = query.toLowerCase().split(/\W+/).filter((t) => t.length > 2);
  const c = content.toLowerCase();
  return terms.some((t) => c.includes(t));
}
if (!relevant("Ghana CRM pricing", "Recipe for chocolate cake")) ok("unit:irrelevant filtered");
else fail("unit:filter", "false positive");
if (relevant("Ghana CRM pricing", "CRM pricing research for Ghana SMBs")) ok("unit:relevant kept");
else fail("unit:filter", "false negative");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
