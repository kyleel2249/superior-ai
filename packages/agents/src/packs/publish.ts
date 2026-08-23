/**
 * apps/web/src/app/api/publishers/route.ts calls
 * publishPack(body.pack, { usePlatformSign: true }) — this function didn't
 * exist. It validates the manifest shape, signs it (reusing the existing
 * HS256/EdDSA signing in ./signing.ts), and registers it into the installable
 * catalog (./registry.ts) as an unverified pack pending review.
 */
import { signPackHs256, signPackEd25519, type SignedPackManifest } from "./signing";
import { registerCustomPack, type AgentPackManifest, type PackCategory } from "./registry";

const REQUIRED_FIELDS: Array<keyof AgentPackManifest> = ["id", "name", "version", "category", "description"];
const VALID_CATEGORIES: PackCategory[] = [
  "growth",
  "engineering",
  "finance",
  "legal",
  "support",
  "research",
  "creative",
  "operations",
];

export interface PublishPackOptions {
  usePlatformSign?: boolean;
  privateKeyPem?: string;
}

export function publishPack(rawPack: Partial<AgentPackManifest>, options: PublishPackOptions = {}): SignedPackManifest {
  const missing = REQUIRED_FIELDS.filter((field) => !rawPack[field]);
  if (missing.length > 0) {
    throw new Error(`Pack manifest is missing required field(s): ${missing.join(", ")}`);
  }
  if (!VALID_CATEGORIES.includes(rawPack.category as PackCategory)) {
    throw new Error(`Pack category must be one of: ${VALID_CATEGORIES.join(", ")}`);
  }

  // Third-party publishes are never auto-verified — that requires a manual
  // platform review, matching the existing installPack() rule that only
  // verified packs can be installed.
  const pack: AgentPackManifest = {
    id: String(rawPack.id),
    name: String(rawPack.name),
    version: String(rawPack.version),
    category: rawPack.category as PackCategory,
    description: String(rawPack.description),
    agents: rawPack.agents ?? [],
    workflows: rawPack.workflows ?? [],
    requiredTools: rawPack.requiredTools ?? [],
    requiredPermissions: rawPack.requiredPermissions ?? [],
    author: rawPack.author ?? "unknown",
    verified: false,
    pricing: rawPack.pricing ?? "add_on",
  };

  const signed =
    !options.usePlatformSign && options.privateKeyPem
      ? signPackEd25519(pack, options.privateKeyPem)
      : signPackHs256(pack);

  registerCustomPack(pack);
  return signed;
}
