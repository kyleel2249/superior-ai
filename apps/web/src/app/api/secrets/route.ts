import { NextRequest, NextResponse } from "next/server";
import { encryptSecret, decryptSecret, isEncryptionConfigured, hashFingerprint } from "@superior-ai/shared";

/**
 * Encrypt/decrypt provider or CRM secrets for storage.
 * Never returns decrypted values unless action=decrypt with explicit flag.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === "status") {
      return NextResponse.json({ configured: isEncryptionConfigured() });
    }
    if (body.action === "encrypt") {
      const plaintext = String(body.value ?? "");
      if (!plaintext) return NextResponse.json({ error: "value required" }, { status: 400 });
      const ciphertext = encryptSecret(plaintext);
      return NextResponse.json({
        ciphertext,
        fingerprint: hashFingerprint(plaintext),
        encryptionConfigured: isEncryptionConfigured(),
        note: isEncryptionConfigured()
          ? "Encrypted with AES-256-GCM"
          : "ENCRYPTION_KEY not set — stored with plain: prefix for dev only",
      });
    }
    if (body.action === "decrypt") {
      if (body.confirm !== true) {
        return NextResponse.json({ error: "confirm:true required to decrypt" }, { status: 400 });
      }
      const plaintext = decryptSecret(String(body.ciphertext ?? ""));
      return NextResponse.json({
        fingerprint: hashFingerprint(plaintext),
        length: plaintext.length,
        // Do not echo full secret in logs; return only for authorized admin flows
        value: plaintext,
      });
    }
    return NextResponse.json({ error: "action must be status | encrypt | decrypt" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
