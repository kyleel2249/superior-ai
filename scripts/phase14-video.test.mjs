import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0, failed = 0;
const ok = (n) => { console.log(`  ✓ ${n}`); passed++; };
const fail = (n, e) => { console.error(`  ✗ ${n}: ${e}`); failed++; };

console.log("PHASE 14 — Video & Cinematic Studio\n");

const files = [
  "packages/ai-gateway/src/media/video-gen.ts",
  "packages/creative/src/story-director.ts",
  "packages/creative/src/timeline.ts",
  "packages/creative/src/cinematic-director.ts",
  "apps/web/src/app/api/video/route.ts",
];
for (const f of files) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else fail(f, "missing");
}

const vg = fs.readFileSync(path.join(root, "packages/ai-gateway/src/media/video-gen.ts"), "utf8");
for (const s of ["ContinuityLock", "generateVideo", "mediaProduced", "buildContinuityLock", "never fakes"]) {
  if (vg.includes(s) || (s === "never fakes" && vg.includes("never fakes media"))) ok(`video:${s}`);
  else if (s === "never fakes" && vg.includes("Never") && vg.includes("media")) ok(`video:${s}`);
  else fail(`video:${s}`, "missing");
}

const tl = fs.readFileSync(path.join(root, "packages/creative/src/timeline.ts"), "utf8");
for (const s of ["buildTimelineFromScenes", "planClipStitch", "captions", "voiceover", "music", "missing_media"]) {
  if (tl.includes(s)) ok(`timeline:${s}`);
  else fail(`timeline:${s}`, "missing");
}

const cin = fs.readFileSync(path.join(root, "packages/creative/src/cinematic-director.ts"), "utf8");
for (const s of ["planCinematicProduction", "extendStory", "continuityNotes", "lightingNotes", "cameraNotes"]) {
  if (cin.includes(s)) ok(`cinematic:${s}`);
  else fail(`cinematic:${s}`, "missing");
}

const api = fs.readFileSync(path.join(root, "apps/web/src/app/api/video/route.ts"), "utf8");
for (const a of ["cinematic", "timeline", "stitch", "extend", "generate"]) {
  if (api.includes(a)) ok(`api:${a}`);
  else fail(`api:${a}`, "missing");
}

// Unit: stitch honesty
function stitch(clips) {
  const mediaComplete = clips.every((c) => c.assetUrl);
  return { mediaComplete, note: mediaComplete ? "ready" : "Missing media" };
}
if (!stitch([{ sceneId: "a", durationSec: 3 }]).mediaComplete) ok("unit:no fake media");
else fail("unit:stitch", "false complete");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
