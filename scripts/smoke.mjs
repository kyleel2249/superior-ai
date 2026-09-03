import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("SUPERIOR AI smoke tests\n");

const required = [
  "packages/memory/src/postgres.ts",
  "packages/db/prisma/migrations/002_persistent_memory.sql",
  "packages/db/prisma/migrations/003_vector_embeddings.sql",
  "packages/brand/src/letterform.ts",
  "packages/brand/src/kit-export.ts",
  "packages/agents/src/commands/universal.ts",
  "packages/agents/src/orchestrator/executor.ts",
  "packages/agents/src/factory/software-factory.ts",
  "packages/agents/src/departments/full-council.ts",
  "packages/tools/src/web-search.ts",
  "packages/tools/src/code-exec.ts",
  "packages/tools/src/repo.ts",
  "packages/competitor/src/research.ts",
  "packages/memory/src/rag.ts",
  "apps/web/src/app/api/brand/route.ts",
  "apps/web/src/app/api/chat/route.ts",
  "apps/web/src/app/api/competitors/route.ts",
  "apps/web/src/app/api/factory/route.ts",
  "apps/web/src/app/api/knowledge/route.ts",
  "apps/web/src/app/competitors/page.tsx",
  "apps/web/src/app/brand/page.tsx",
];

for (const f of required) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const chat = fs.readFileSync(path.join(root, "apps/web/src/app/api/chat/route.ts"), "utf8");
if (chat.includes("parseUniversalCommand") && chat.includes("runOrchestrator")) ok("chat modes+commands");
else fail("chat", "incomplete");

const ws = fs.readFileSync(path.join(root, "packages/tools/src/web-search.ts"), "utf8");
if (ws.includes("liveSearch") && ws.includes("searchDuckDuckGo")) ok("liveSearch multi-engine");
else fail("search", "incomplete");

const orch = fs.readFileSync(path.join(root, "packages/agents/src/orchestrator/executor.ts"), "utf8");
if (orch.includes("web_search")) ok("orchestrator web_search tool");
else fail("orch", "no web_search");

const fac = fs.readFileSync(path.join(root, "packages/agents/src/factory/software-factory.ts"), "utf8");
if (fac.includes("factoryValidateCode") && fac.includes("repoListFiles")) ok("factory code-exec+repo");
else fail("factory", "not connected");

const rag = fs.readFileSync(path.join(root, "packages/memory/src/rag.ts"), "utf8");
if (rag.includes("hybridRetrieve")) ok("hybrid RAG");
else fail("rag", "no hybrid");

const kit = fs.readFileSync(path.join(root, "packages/brand/src/kit-export.ts"), "utf8");
if (kit.includes("buildBrandKitPack")) ok("brand kit pack");
else fail("kit", "missing");

const core = fs.readFileSync(path.join(root, "packages/core/src/types.ts"), "utf8");
if (core.includes('"SUPREME"')) ok("SUPREME level");
else fail("core", "no SUPREME");

const searchSrc = fs.readFileSync(path.join(root, "packages/tools/src/web-search.ts"), "utf8");
for (const eng of ["google_cse", "brave", "yandex", "naver", "mojeek", "wolframalpha", "yahoo_via_bing", "ecosia_via_bing", "startpage", "multiEngineSearch", "listSearchEngines"]) {
  if (searchSrc.includes(eng)) ok(`search:${eng}`);
  else fail(`search:${eng}`, "missing");
}
if (fs.existsSync(path.join(root, "apps/web/src/app/api/search/route.ts"))) ok("api/search");
else fail("api/search", "missing");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
