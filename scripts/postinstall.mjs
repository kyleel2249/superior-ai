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

if (existsSync(prismaSchema) && process.env.SKIP_PRISMA_GENERATE !== "1") {
  const result = spawnSync(
    "npx",
    ["prisma", "generate", `--schema=${prismaSchema}`],
    {
      cwd: root,
      stdio: "inherit",
      shell: true, // required for Windows npx resolution
      env: process.env,
    }
  );
  if (result.status !== 0 && result.status !== null) {
    console.warn(
      "[postinstall] prisma generate skipped or failed (optional until DATABASE_URL / client install)."
    );
  }
} else {
  console.log("[postinstall] Prisma generate skipped.");
}

console.log("[postinstall] SUPERIOR AI ready. On Windows: npm run dev:web");
