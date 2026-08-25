import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let p=0,f=0;
const ok=n=>{console.log("  ✓ "+n);p++};
const fail=(n,e)=>{console.error("  ✗ "+n+": "+e);f++};
console.log("CINTEXA Advanced Wave 3\n");
for (const file of [
  "packages/intelligence/src/profiles.ts",
  "packages/intelligence/src/workforce-pnl.ts",
  "packages/intelligence/src/proactive.ts",
  "packages/intelligence/src/knowledge-freshness.ts",
  "packages/agents/src/tasks/replay.ts",
  "packages/agents/src/red-team.ts",
  "packages/ai-gateway/src/portfolio-optimizer.ts",
  "packages/ai-gateway/src/routing-simulator.ts",
  "packages/security/src/auto-remediation.ts",
]) {
  if (fs.existsSync(path.join(root,file))) ok(file); else fail(file,"missing");
}
const api=fs.readFileSync(path.join(root,"apps/web/src/app/api/advanced/route.ts"),"utf8");
for (const a of ["workforce_pnl","proactive","portfolio","routing_sim","checkpoint","red_team","remediate_plan","profile_user"]) {
  if (api.includes(a)) ok("api:"+a); else fail("api:"+a,"missing");
}
console.log(`\n${p} passed, ${f} failed`);
process.exit(f>0?1:0);
