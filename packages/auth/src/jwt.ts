import { createHmac, timingSafeEqual } from "crypto";

export interface JwtClaims {
  sub: string;
  email: string;
  name?: string;
  org?: string;
  role: string;
  iat: number;
  exp: number;
}

function secret(): string {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dev-only-change-me-superior-ai";
}

function b64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf.toString("base64url");
}

function fromB64url(s: string): Buffer {
  return Buffer.from(s, "base64url");
}

export function signJwt(claims: Omit<JwtClaims, "iat" | "exp">, ttlSec = 60 * 60 * 24 * 7): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body: JwtClaims = { ...claims, iat: now, exp: now + ttlSec };
  const h = b64url(JSON.stringify(header));
  const p = b64url(JSON.stringify(body));
  const data = `${h}.${p}`;
  const sig = createHmac("sha256", secret()).update(data).digest();
  return `${data}.${b64url(sig)}`;
}

export function verifyJwt(token: string): JwtClaims | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [h, p, s] = parts as [string, string, string];
    const data = `${h}.${p}`;
    const expected = createHmac("sha256", secret()).update(data).digest();
    const actual = fromB64url(s);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    const claims = JSON.parse(fromB64url(p).toString("utf8")) as JwtClaims;
    if (claims.exp < Math.floor(Date.now() / 1000)) return null;
    return claims;
  } catch {
    return null;
  }
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    return JSON.parse(fromB64url(parts[1]!).toString("utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}
