import { describe, it, expect, afterEach } from "vitest";
import { encryptSecret, decryptSecret, isEncryptionConfigured, hashFingerprint } from "../crypto";

const original = process.env.ENCRYPTION_KEY;
afterEach(() => {
  if (original === undefined) delete process.env.ENCRYPTION_KEY;
  else process.env.ENCRYPTION_KEY = original;
});

describe("without ENCRYPTION_KEY (dev fallback)", () => {
  it("isEncryptionConfigured is false", () => {
    delete process.env.ENCRYPTION_KEY;
    expect(isEncryptionConfigured()).toBe(false);
  });

  it("a 'change-me' placeholder key counts as unconfigured, not real", () => {
    process.env.ENCRYPTION_KEY = "change-me-please";
    expect(isEncryptionConfigured()).toBe(false);
  });

  it("encryptSecret labels output with a 'plain:' prefix — never silently pretends to encrypt", () => {
    delete process.env.ENCRYPTION_KEY;
    const result = encryptSecret("my-secret-value");
    expect(result).toBe("plain:my-secret-value");
  });

  it("decryptSecret round-trips the plain: fallback correctly", () => {
    delete process.env.ENCRYPTION_KEY;
    const enc = encryptSecret("round-trip-me");
    expect(decryptSecret(enc)).toBe("round-trip-me");
  });
});

describe("with a real ENCRYPTION_KEY", () => {
  it("accepts a 64-char hex key directly", () => {
    process.env.ENCRYPTION_KEY = "a".repeat(64);
    expect(isEncryptionConfigured()).toBe(true);
  });

  it("derives a stable key from an arbitrary passphrase", () => {
    process.env.ENCRYPTION_KEY = "a memorable passphrase, not hex";
    expect(isEncryptionConfigured()).toBe(true);
  });

  it("encrypt/decrypt round-trips correctly with a hex key", () => {
    process.env.ENCRYPTION_KEY = "b".repeat(64);
    const enc = encryptSecret("top-secret-api-key-123");
    expect(enc.startsWith("v1:")).toBe(true);
    expect(enc).not.toContain("top-secret-api-key-123"); // never leaks plaintext into ciphertext
    expect(decryptSecret(enc)).toBe("top-secret-api-key-123");
  });

  it("encrypt/decrypt round-trips correctly with a passphrase key", () => {
    process.env.ENCRYPTION_KEY = "a much longer passphrase used as a key";
    const enc = encryptSecret("another-secret");
    expect(decryptSecret(enc)).toBe("another-secret");
  });

  it("two encryptions of the same plaintext produce different ciphertext (random IV)", () => {
    process.env.ENCRYPTION_KEY = "c".repeat(64);
    const a = encryptSecret("same-value");
    const b = encryptSecret("same-value");
    expect(a).not.toBe(b);
    expect(decryptSecret(a)).toBe("same-value");
    expect(decryptSecret(b)).toBe("same-value");
  });

  it("GCM auth tag detects tampering — a modified ciphertext fails to decrypt rather than returning garbage", () => {
    process.env.ENCRYPTION_KEY = "d".repeat(64);
    const enc = encryptSecret("tamper-test");
    const parts = enc.split(":");
    // Flip the last character of the ciphertext payload segment.
    const tampered = parts[3]!.slice(0, -1) + (parts[3]!.endsWith("A") ? "B" : "A");
    const tamperedPayload = [parts[0], parts[1], parts[2], tampered].join(":");
    expect(() => decryptSecret(tamperedPayload)).toThrow();
  });

  it("decrypting without the key that encrypted it throws rather than returning wrong plaintext", () => {
    process.env.ENCRYPTION_KEY = "e".repeat(64);
    const enc = encryptSecret("key-mismatch-test");
    process.env.ENCRYPTION_KEY = "f".repeat(64);
    expect(() => decryptSecret(enc)).toThrow();
  });

  it("rejects a malformed ciphertext payload", () => {
    process.env.ENCRYPTION_KEY = "a".repeat(64);
    expect(() => decryptSecret("not-a-valid-payload")).toThrow(/Invalid ciphertext format/);
  });

  it("decryptSecret throws when no key is configured and the payload isn't the plain: fallback", () => {
    process.env.ENCRYPTION_KEY = "a".repeat(64);
    const enc = encryptSecret("needs-key");
    delete process.env.ENCRYPTION_KEY;
    expect(() => decryptSecret(enc)).toThrow(/ENCRYPTION_KEY required/);
  });
});

describe("hashFingerprint", () => {
  it("is deterministic for the same input", () => {
    expect(hashFingerprint("same-input")).toBe(hashFingerprint("same-input"));
  });

  it("differs for different input", () => {
    expect(hashFingerprint("input-a")).not.toBe(hashFingerprint("input-b"));
  });

  it("never contains the original secret", () => {
    const fp = hashFingerprint("sk-super-secret-key-value");
    expect(fp).not.toContain("sk-super-secret-key-value");
    expect(fp.length).toBe(12);
  });
});
