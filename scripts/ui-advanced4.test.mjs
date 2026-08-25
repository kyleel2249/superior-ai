import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let p=0,f=0; const ok=n=>{console.log(" ✓ "+n);p++}; const fail=(n,e)=>{console.error(" ✗ "+n);f++};
console.log("UI + Advanced wave 4\n");
const css = fs.readFileSync(path.join(root,"apps/web/src/app/globals.css"),"utf8");
for (const s of ["text-gradient","btn-rainbow","card-glow","animate-fade-up","prefers-reduced-motion"]) {
  if (css.includes(s)) ok("css:"+s); else fail("css:"+s);
}
for (const file of [
  "packages/intelligence/src/experimentation.ts",
  "packages/intelligence/src/goal-alignment.ts",
  "packages/agents/src/templates/library.ts",
]) {
  if (fs.existsSync(path.join(root,file))) ok(file); else fail(file);
}
const api = fs.readFileSync(path.join(root,"apps/web/src/app/api/advanced/route.ts"),"utf8");
for (const a of ["experiment_create","goal_align","templates_list"]) {
  if (api.includes(a)) ok("api:"+a); else fail("api:"+a);
}
const shell = fs.readFileSync(path.join(root,"apps/web/src/components/AppShell.tsx"),"utf8");
if (shell.includes("btn-rainbow") && shell.includes("/advanced")) ok("shell");
else fail("shell");
console.log(`\n${p} passed, ${f} failed`);
process.exit(f?1:0);
