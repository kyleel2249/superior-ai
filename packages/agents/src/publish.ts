import { signPackHs256, type SignedPackManifest, type PackSignFields } from "./packs/signing";
import { getPack } from "./packs/registry";

/**
 * Publishes a third-party agent pack manifest: validates required fields,
 * then signs it. `usePlatformSign: true` signs with the platform's own
 * HMAC secret (for packs shipped by SUPERIOR AI itself, e.g. via /admin);
 * otherwise the manifest is expected to arrive pre-signed by the publisher.
 */
export function publishPack(
  pack: PackSignFields,
  opts: { usePlatformSign?: boolean } = {}
): SignedPackManifest {
  const required: Array<keyof PackSignFields> = ["id", "name", "version", "category", "description", "author"];
  for (const field of required) {
    if (!pack[field]) throw new Error(`Pack manifest missing required field: ${String(field)}`);
  }
  if (getPack(pack.id) && !opts.usePlatformSign) {
    throw new Error(`Pack id "${pack.id}" collides with a built-in catalog pack.`);
  }
  return signPackHs256(pack);
}
