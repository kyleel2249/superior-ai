import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("PHASE 2 — Local-first acceptance\n");

const files = [
  "packages/workspace/src/profiles.ts",
  "packages/workspace/src/projects.ts",
  "packages/workspace/src/preferences.ts",
  "apps/web/src/components/AppShell.tsx",
  "apps/web/src/components/CommandPalette.tsx",
  "apps/web/src/lib/local-prefs.ts",
  "apps/web/src/app/workspace/page.tsx",
  "apps/web/src/app/settings/preferences/page.tsx",
  "apps/web/src/app/api/workspace/route.ts",
  "apps/web/src/app/layout.tsx",
];
for (const f of files) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const mw = fs.readFileSync(path.join(root, "apps/web/src/middleware.ts"), "utf8");
if (!mw.includes("redirect") && !mw.includes("Unauthorized")) ok("middleware no auth wall");
else if (!/login.*required|force.*auth/i.test(mw)) ok("middleware no forced login");
else fail("middleware", "appears to force auth");

const layout = fs.readFileSync(path.join(root, "apps/web/src/app/layout.tsx"), "utf8");
if (layout.includes("AppShell")) ok("layout uses AppShell");
else fail("layout", "no AppShell");

const palette = fs.readFileSync(path.join(root, "apps/web/src/components/CommandPalette.tsx"), "utf8");
if (palette.includes("metaKey") && palette.includes("ctrlKey") && palette.includes("k")) ok("command palette Ctrl/Cmd+K");
else fail("palette", "shortcut missing");

const ws = fs.readFileSync(path.join(root, "apps/web/src/app/api/workspace/route.ts"), "utf8");
for (const a of ["create_project", "create_profile", "update_preferences", "authRequired: false"]) {
  if (ws.includes(a)) ok(`workspace API:${a}`);
  else fail(`workspace API:${a}`, "missing");
}

const prefs = fs.readFileSync(path.join(root, "packages/workspace/src/preferences.ts"), "utf8");
if (prefs.includes("showBillingUi") && prefs.includes("false")) ok("billing hidden by default in prefs");
else fail("prefs", "billing default");

const billing = fs.readFileSync(path.join(root, "apps/web/src/app/settings/billing/page.tsx"), "utf8");
if (billing.includes("ENABLE_BILLING_UI") && billing.includes("does not expose billing")) ok("billing page gated");
else fail("billing", "not gated");

const profiles = fs.readFileSync(path.join(root, "packages/workspace/src/profiles.ts"), "utf8");
for (const k of ["personal", "business", "development", "marketing", "research", "creative"]) {
  if (profiles.includes(k)) ok(`profile kind:${k}`);
  else fail(`profile:${k}`, "missing");
}

const nav = fs.readFileSync(path.join(root, "apps/web/src/components/AppShell.tsx"), "utf8");
for (const href of ["/chat", "/workspace", "/studio", "/settings/preferences"]) {
  if (nav.includes(href)) ok(`nav:${href}`);
  else fail(`nav:${href}`, "missing");
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
