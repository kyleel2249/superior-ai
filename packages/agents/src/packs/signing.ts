/**
 * Signed agent pack manifests
 * HMAC-SHA256 over canonical JSON of pack fields (excluding signature).
 * Production third parties: replace with asymmetric keys (Ed25519) via PACK_SIGNING_PUBLIC_KEY.
 */

import { createHmac, createVerify, timingSafeEqual, generateKeyPairSync, sign as cryptoSign } from "crypto";
export interface PackSignFields {
  id: string;
  name: string;
  version: string;
  category: string;
  description: string;
  agents: string[];
  workflows: string[];
  requiredTools: string[];
  requiredPermissions: string[];
  author: string;
  verified: boolean;
  pricing: string;
}
type AgentPackManifest = PackSignFields;

export interface SignedPackManifest extends AgentPackManifest {
  signature: string;
  signedAt: string;
  alg: "HS256" | "EdDSA";
}

function signingSecret(): string {
  return process.env.PACK_SIGNING_SECRET || process.env.AUTH_SECRET || "dev-pack-signing-change-me";
}

/** Canonical payload for signing — stable key order */
export function canonicalPackPayload(pack: AgentPackManifest): string {
  const ordered = {
    id: pack.id,
    name: pack.name,
    version: pack.version,
    category: pack.category,
    description: pack.description,
    agents: pack.agents,
    workflows: pack.workflows,
    requiredTools: pack.requiredTools,
    requiredPermissions: pack.requiredPermissions,
    author: pack.author,
    verified: pack.verified,
    pricing: pack.pricing,
  };
  return JSON.stringify(ordered);
}

export function signPackHs256(pack: AgentPackManifest): SignedPackManifest {
  const payload = canonicalPackPayload(pack);
  const signature = createHmac("sha256", signingSecret()).update(payload).digest("base64url");
  return {
    ...pack,
    signature,
    signedAt: new Date().toISOString(),
    alg: "HS256",
  };
}

export function verifyPackSignature(
  signed: SignedPackManifest | (AgentPackManifest & { signature?: string; alg?: string })
): { valid: boolean; error?: string; method?: string } {
  if (!signed.signature) {
    return { valid: false, error: "Missing signature" };
  }

  const base: AgentPackManifest = {
    id: signed.id,
    name: signed.name,
    version: signed.version,
    category: signed.category,
    description: signed.description,
    agents: signed.agents,
    workflows: signed.workflows,
    requiredTools: signed.requiredTools,
    requiredPermissions: signed.requiredPermissions,
    author: signed.author,
    verified: signed.verified,
    pricing: signed.pricing,
  };
  const payload = canonicalPackPayload(base);

  if (signed.alg === "EdDSA" || process.env.PACK_SIGNING_PUBLIC_KEY) {
    try {
      const pub = process.env.PACK_SIGNING_PUBLIC_KEY;
      if (!pub) {
        return { valid: false, error: "PACK_SIGNING_PUBLIC_KEY required for EdDSA" };
      }
      const verifier = createVerify("SHA256");
      verifier.update(payload);
      verifier.end();
      // Expect PEM public key; signature base64url
      const sigBuf = Buffer.from(signed.signature, "base64url");
      const ok = verifier.verify(pub, sigBuf);
      return ok
        ? { valid: true, method: "EdDSA" }
        : { valid: false, error: "EdDSA signature mismatch", method: "EdDSA" };
    } catch (err) {
      return {
        valid: false,
        error: err instanceof Error ? err.message : String(err),
        method: "EdDSA",
      };
    }
  }

  // HS256 (platform-signed packs)
  const expected = createHmac("sha256", signingSecret()).update(payload).digest();
  const actual = Buffer.from(signed.signature, "base64url");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return { valid: false, error: "HS256 signature mismatch", method: "HS256" };
  }
  return { valid: true, method: "HS256" };
}

/** Dev helper — generate Ed25519 keypair for third-party pack publishers */
export function generatePackKeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  return { publicKey, privateKey };
}

export function signPackEd25519(pack: AgentPackManifest, privateKeyPem: string): SignedPackManifest {
  const payload = canonicalPackPayload(pack);
  const signature = cryptoSign(null, Buffer.from(payload), privateKeyPem).toString("base64url");
  return {
    ...pack,
    signature,
    signedAt: new Date().toISOString(),
    alg: "EdDSA",
  };
}
