/**
 * OIDC JWKS verification
 * Uses `jose` when installed for RS256 signature verification.
 * Falls back to claims-only validation with explicit signatureVerified=false.
 */

import { decodeJwtPayload } from "./jwt";

interface JwksKey {
  kid?: string;
  kty: string;
  n?: string;
  e?: string;
  alg?: string;
  use?: string;
}

let cachedJwks: { keys: JwksKey[]; fetchedAt: number; jwksUri: string } | null = null;

export async function resolveJwksUri(issuer: string): Promise<string> {
  const base = issuer.replace(/\/$/, "");
  try {
    const confRes = await fetch(`${base}/.well-known/openid-configuration`);
    if (confRes.ok) {
      const conf = (await confRes.json()) as { jwks_uri?: string };
      if (conf.jwks_uri) return conf.jwks_uri;
    }
  } catch {
    /* fall through */
  }
  return `${base}/.well-known/jwks.json`;
}

export async function fetchJwks(issuer: string): Promise<JwksKey[]> {
  if (cachedJwks && Date.now() - cachedJwks.fetchedAt < 3600_000) {
    return cachedJwks.keys;
  }
  const jwksUri = await resolveJwksUri(issuer);
  const res = await fetch(jwksUri);
  if (!res.ok) throw new Error(`JWKS fetch failed: ${res.status}`);
  const data = (await res.json()) as { keys: JwksKey[] };
  cachedJwks = { keys: data.keys, fetchedAt: Date.now(), jwksUri };
  return data.keys;
}

export interface IdTokenValidation {
  valid: boolean;
  claims?: Record<string, unknown>;
  error?: string;
  signatureVerified: boolean;
  method: "jose" | "claims_only" | "none";
}

async function verifyWithJose(
  idToken: string,
  opts: { issuer: string; audience: string }
): Promise<IdTokenValidation | null> {
  try {
    // Dynamic import — optional dependency
    const jose = await import("jose").catch(() => null);
    if (!jose) return null;

    const jwksUri = await resolveJwksUri(opts.issuer);
    const JWKS = jose.createRemoteJWKSet(new URL(jwksUri));
    const { payload } = await jose.jwtVerify(idToken, JWKS, {
      issuer: opts.issuer.replace(/\/$/, ""),
      audience: opts.audience,
    });
    return {
      valid: true,
      claims: payload as Record<string, unknown>,
      signatureVerified: true,
      method: "jose",
    };
  } catch (err) {
    // jose present but verification failed
    if (String(err).includes("Cannot find module") || String(err).includes("MODULE_NOT_FOUND")) {
      return null;
    }
    return {
      valid: false,
      signatureVerified: false,
      method: "jose",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function validateClaimsOnly(
  idToken: string,
  opts: { issuer: string; audience: string }
): IdTokenValidation {
  const claims = decodeJwtPayload(idToken);
  if (!claims) {
    return { valid: false, signatureVerified: false, method: "none", error: "Malformed JWT" };
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof claims.exp === "number" && claims.exp < now) {
    return { valid: false, claims, signatureVerified: false, method: "claims_only", error: "Token expired" };
  }

  const iss = String(claims.iss ?? "");
  const issuerNorm = opts.issuer.replace(/\/$/, "");
  if (iss && iss.replace(/\/$/, "") !== issuerNorm) {
    return {
      valid: false,
      claims,
      signatureVerified: false,
      method: "claims_only",
      error: `Issuer mismatch: ${iss}`,
    };
  }

  const aud = claims.aud;
  if (
    aud &&
    aud !== opts.audience &&
    !(Array.isArray(aud) && aud.includes(opts.audience))
  ) {
    return {
      valid: false,
      claims,
      signatureVerified: false,
      method: "claims_only",
      error: "Audience mismatch",
    };
  }

  return {
    valid: true,
    claims,
    signatureVerified: false,
    method: "claims_only",
    error: "Claims OK. Install `jose` for signatureVerified=true (RS256 via JWKS).",
  };
}

export async function validateIdToken(
  idToken: string,
  opts: { issuer: string; audience: string }
): Promise<IdTokenValidation> {
  const joseResult = await verifyWithJose(idToken, opts);
  if (joseResult) return joseResult;

  // Ensure JWKS is reachable even in claims-only mode
  try {
    await fetchJwks(opts.issuer);
  } catch (err) {
    const claims = decodeJwtPayload(idToken) ?? undefined;
    return {
      valid: false,
      claims,
      signatureVerified: false,
      method: "none",
      error: `JWKS unavailable: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  return validateClaimsOnly(idToken, opts);
}
