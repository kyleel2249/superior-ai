/**
 * apps/web/src/app/api/auth/route.ts and .../orgs/route.ts import
 * devLogin, getSession, getSessionFromCookies, destroySession, getAuthMode,
 * hasPermission from this package — none of it existed, only raw
 * signJwt/verifyJwt (./jwt.ts). Built on top of those primitives.
 */
import { signJwt, verifyJwt } from "./jwt";

export type Role = "owner" | "admin" | "member" | "viewer";

export interface SessionUser {
  id: string;
  email: string;
  name?: string;
  organizationId?: string;
  role: Role;
}

export interface Session {
  user: SessionUser;
  token: string;
  expiresAt: string;
}

const revokedTokens = new Set<string>();

const ROLE_PERMISSIONS: Record<Role, string[] | "*"> = {
  owner: "*",
  admin: ["run_orchestrator", "manage_providers", "billing", "read", "write"],
  member: ["run_orchestrator", "read", "write"],
  viewer: ["read"],
};

export function getAuthMode(): "dev" | "oidc" {
  return process.env.OIDC_ISSUER_URL && process.env.NODE_ENV === "production" ? "oidc" : "dev";
}

export function devLogin(email?: string, role: Role = "owner"): Session {
  const resolvedEmail = email && email.trim() ? email.trim() : "dev@superior.local";
  const ttlSec = 60 * 60 * 24 * 7;
  const token = signJwt(
    { sub: `user_${Buffer.from(resolvedEmail).toString("base64url").slice(0, 12)}`, email: resolvedEmail, role },
    ttlSec
  );
  const claims = verifyJwt(token)!;
  return {
    user: { id: claims.sub, email: claims.email, role: claims.role as Role, organizationId: claims.org },
    token,
    expiresAt: new Date(claims.exp * 1000).toISOString(),
  };
}

function sessionFromToken(token: string | null): Session | null {
  if (!token || revokedTokens.has(token)) return null;
  const claims = verifyJwt(token);
  if (!claims) return null;
  return {
    user: { id: claims.sub, email: claims.email, name: claims.name, role: (claims.role as Role) ?? "member", organizationId: claims.org },
    token,
    expiresAt: new Date(claims.exp * 1000).toISOString(),
  };
}

export function getSession(authHeader: string | null): Session | null {
  if (!authHeader) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  return sessionFromToken(match ? match[1]! : null);
}

export function getSessionFromCookies(cookieHeader: string | null): Session | null {
  if (!cookieHeader) return null;
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [k, ...rest] = c.trim().split("=");
      return [k, decodeURIComponent(rest.join("="))];
    })
  );
  return sessionFromToken(cookies["superior_session"] ?? null);
}

/** Stateless JWTs can't be revoked server-side by nature, so this tracks an explicit revocation list. */
export function destroySession(authHeaderOrToken: string): void {
  const match = /^Bearer\s+(.+)$/i.exec(authHeaderOrToken.trim());
  revokedTokens.add(match ? match[1]! : authHeaderOrToken.trim());
}

export function hasPermission(user: { role?: string } | null | undefined, permission: string): boolean {
  if (!user?.role) return false;
  const perms = ROLE_PERMISSIONS[user.role as Role];
  if (!perms) return false;
  return perms === "*" || perms.includes(permission);
}
