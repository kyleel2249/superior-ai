import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let p=0,f=0; const ok=n=>{console.log(" ✓ "+n);p++}; const fail=(n,e)=>{console.error(" ✗ "+n+": "+e);f++};
console.log("Theme + multi-engine search\n");
const css = fs.readFileSync(path.join(root,"apps/web/src/app/globals.css"),"utf8");
for (const s of ['data-theme="light"','data-theme="midnight"','data-theme="aurora"',"theme-light"]) {
  if (css.includes(s)) ok("css:"+s); else fail("css:"+s,"missing");
}
if (fs.existsSync(path.join(root,"apps/web/src/components/ThemeToggle.tsx"))) ok("ThemeToggle");
else fail("ThemeToggle","missing");
const ws = fs.readFileSync(path.join(root,"packages/tools/src/web-search.ts"),"utf8");
if (ws.includes("searchAllEngines")) ok("searchAllEngines"); else fail("searchAllEngines","missing");
if (fs.existsSync(path.join(root,"apps/web/src/app/api/search/route.ts"))) ok("api/search");
else fail("api/search","missing");
if (fs.existsSync(path.join(root,"packages/research/src/auto-gather.ts"))) ok("auto-gather");
else fail("auto-gather","missing");
const shell = fs.readFileSync(path.join(root,"apps/web/src/components/AppShell.tsx"),"utf8");
if (shell.includes("<ThemeToggle")) ok("shell:toggle"); else fail("shell:toggle","missing");
console.log(`\n${p} passed, ${f} failed`);
process.exit(f?1:0);
