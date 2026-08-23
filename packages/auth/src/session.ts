import { signJwt, verifyJwt, type JwtClaims } from "./jwt";

export type Role = "owner" | "admin" | "member" | "viewer";

export interface SessionUser {
  id: string;
  email: string;
  name?: string;
  organizationId?: string;
  role: Role;
}

export interface Session {
  token: string;
  user: SessionUser;
  expiresAt: string;
}

const PERMISSIONS: Record<Role, string[]> = {
  owner: ["run_orchestrator", "manage_providers", "billing", "read", "write", "invite"],
  admin: ["run_orchestrator", "manage_providers", "read", "write", "invite"],
  member: ["run_orchestrator", "read", "write"],
  viewer: ["read"],
};

// Revocation list — JWTs are stateless, so logout has to be tracked explicitly.
const revoked = new Set<string>();

function tokenFromAuthHeader(authHeader?: string | null): string | null {
  if (!authHeader) return null;
  const m = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  return m ? m[1]! : authHeader.trim();
}

function claimsToUser(claims: JwtClaims): SessionUser {
  return {
    id: claims.sub,
    email: claims.email,
    name: claims.name,
    organizationId: claims.org,
    role: (claims.role as Role) ?? "member",
  };
}

export function getAuthMode(): "dev" | "oidc" {
  return process.env.OIDC_ISSUER ? "oidc" : "dev";
}

/** Dev-mode login only. In production with OIDC configured, real login goes through the OIDC flow (see jwks.ts validateIdToken). */
export function devLogin(email?: string, role: Role = "owner"): Session {
  const cleanEmail = (email || "dev@superior-ai.local").trim().toLowerCase();
  const token = signJwt({
    sub: `user_${Buffer.from(cleanEmail).toString("base64url").slice(0, 16)}`,
    email: cleanEmail,
    role,
  });
  const claims = verifyJwt(token)!;
  return { token, user: claimsToUser(claims), expiresAt: new Date(claims.exp * 1000).toISOString() };
}

export function getSession(authHeader?: string | null): Session | null {
  const token = tokenFromAuthHeader(authHeader);
  if (!token || revoked.has(token)) return null;
  const claims = verifyJwt(token);
  if (!claims) return null;
  return { token, user: claimsToUser(claims), expiresAt: new Date(claims.exp * 1000).toISOString() };
}

export function getSessionFromCookies(cookieHeader?: string | null): Session | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.split(";").map((c) => c.trim()).find((c) => c.startsWith("superior_session="));
  if (!match) return null;
  const token = decodeURIComponent(match.slice("superior_session=".length));
  return getSession(`Bearer ${token}`);
}

export function destroySession(authHeader?: string | null): void {
  const token = tokenFromAuthHeader(authHeader);
  if (token) revoked.add(token);
}

export function hasPermission(user: SessionUser | null | undefined, permission: string): boolean {
  if (!user) return false;
  return PERMISSIONS[user.role]?.includes(permission) ?? false;
}
