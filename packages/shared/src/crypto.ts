/**
 * Secret encryption at rest
 * Uses AES-256-GCM with ENCRYPTION_KEY from env.
 * Never log plaintext secrets.
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync, createHash } from "crypto";

const ALGO = "aes-256-gcm";

function deriveKey(secret: string): Buffer {
  // Stable 32-byte key from passphrase
  return scryptSync(secret, "superior-ai-salt-v1", 32);
}

function getKey(): Buffer | null {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw || raw.includes("change-me")) return null;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }
  return deriveKey(raw);
}

export function isEncryptionConfigured(): boolean {
  return getKey() !== null;
}

export function encryptSecret(plaintext: string): string {
  const key = getKey();
  if (!key) {
    // Dev fallback — prefix so we never confuse with ciphertext
    return `plain:${plaintext}`;
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${enc.toString("base64url")}`;
}

export function decryptSecret(payload: string): string {
  if (payload.startsWith("plain:")) {
    return payload.slice("plain:".length);
  }
  const key = getKey();
  if (!key) {
    throw new Error("ENCRYPTION_KEY required to decrypt secrets");
  }
  const parts = payload.split(":");
  if (parts[0] !== "v1" || parts.length !== 4) {
    throw new Error("Invalid ciphertext format");
  }
  const iv = Buffer.from(parts[1]!, "base64url");
  const tag = Buffer.from(parts[2]!, "base64url");
  const data = Buffer.from(parts[3]!, "base64url");
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function hashFingerprint(secret: string): string {
  return createHash("sha256").update(secret).digest("hex").slice(0, 12);
}
