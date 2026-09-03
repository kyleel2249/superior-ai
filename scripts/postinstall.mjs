/**
 * Cross-platform postinstall (Windows / macOS / Linux)
 * Avoids bash-only commands so `npm install` works on Windows.
 */
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const prismaSchema = join(root, "packages", "db", "prisma", "schema.prisma");

function runPrismaGenerate(extraEnv = {}) {
  return spawnSync("npx", ["prisma", "generate", `--schema=${prismaSchema}`], {
    cwd: root,
    // Capture output so we can detect a network-blocked engine download and
    // retry automatically, instead of just failing. Still echoed below so
    // nothing is hidden from the user.
    stdio: ["inherit", "pipe", "pipe"],
    shell: true, // required for Windows npx resolution
    env: { ...process.env, ...extraEnv },
    encoding: "utf8",
  });
}

if (existsSync(prismaSchema) && process.env.SKIP_PRISMA_GENERATE !== "1") {
  let result = runPrismaGenerate();
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  process.stdout.write(output);

  const isBlockedEngineDownload =
    result.status !== 0 &&
    /binaries\.prisma\.sh/i.test(output) &&
    /checksum|403|forbidden/i.test(output);

  if (isBlockedEngineDownload && process.env.PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING !== "1") {
    console.warn(
      "[postinstall] Prisma engine download blocked by network policy (binaries.prisma.sh unreachable)."
    );
    console.warn(
      "[postinstall] Retrying with PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 (safe: only skips the checksum fetch, not the engine itself)."
    );
    result = runPrismaGenerate({ PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING: "1" });
    process.stdout.write(`${result.stdout ?? ""}${result.stderr ?? ""}`);
  }

  if (result.status !== 0 && result.status !== null) {
    console.warn(
      "[postinstall] prisma generate skipped or failed (optional until DATABASE_URL / client install)."
    );
    console.warn(
      "[postinstall] If this persists in your environment, allowlist binaries.prisma.sh or set SKIP_PRISMA_GENERATE=1 and run `npm run db:generate` later where network access is available."
    );
  } else {
    console.log("[postinstall] Prisma client generated.");
  }
} else {
  console.log("[postinstall] Prisma generate skipped.");
}

console.log("[postinstall] SUPERIOR AI ready. On Windows: npm run dev:web");
