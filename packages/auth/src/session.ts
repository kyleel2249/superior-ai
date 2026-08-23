/**
 * Auth sessions — JWT-backed with in-memory registry for revocation list
 */

import { signJwt, verifyJwt } from "./jwt";
import { parseCookieHeader, SESSION_COOKIE } from "./cookies";

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
  expiresAt: number;
}

const revoked = new Set<string>();

const ROLE_PERMS: Record<Role, string[]> = {
  owner: ["*"],
  admin: ["read", "write", "manage_providers", "manage_members", "run_orchestrator", "crm_write", "billing"],
  member: ["read", "write", "run_orchestrator"],
  viewer: ["read"],
};

export function createSession(user: SessionUser, ttlSec = 60 * 60 * 24 * 7): Session {
  const token = signJwt({
    sub: user.id,
    email: user.email,
    name: user.name,
    org: user.organizationId,
    role: user.role,
  }, ttlSec);
  return {
    token,
    user,
    expiresAt: Date.now() + ttlSec * 1000,
  };
}

export function getSession(tokenOrHeader: string | null | undefined): Session | null {
  if (!tokenOrHeader) return null;
  let token = tokenOrHeader.replace(/^Bearer\s+/i, "");
  // Also accept raw cookie value
  if (token.includes(SESSION_COOKIE)) {
    token = parseCookieHeader(token, SESSION_COOKIE) ?? token;
  }
  if (revoked.has(token)) return null;
  const claims = verifyJwt(token);
  if (!claims) return null;
  return {
    token,
    user: {
      id: claims.sub,
      email: claims.email,
      name: claims.name,
      organizationId: claims.org,
      role: (claims.role as Role) || "member",
    },
    expiresAt: claims.exp * 1000,
  };
}

export function getSessionFromCookies(cookieHeader: string | null): Session | null {
  const raw = parseCookieHeader(cookieHeader, SESSION_COOKIE);
  return getSession(raw);
}

export function destroySession(token: string): void {
  const clean = token.replace(/^Bearer\s+/i, "");
  revoked.add(clean);
}

export function hasPermission(user: SessionUser, permission: string): boolean {
  const perms = ROLE_PERMS[user.role] ?? [];
  return perms.includes("*") || perms.includes(permission);
}

export function requirePermission(user: SessionUser, permission: string): void {
  if (!hasPermission(user, permission)) {
    throw new Error(`Forbidden: requires ${permission}`);
  }
}

export function devLogin(email = "admin@superior.local", role: Role = "owner"): Session {
  return createSession({
    id: "user_dev_admin",
    email,
    name: "Dev Admin",
    organizationId: "org_dev",
    role,
  });
}

export function getAuthMode(): "oidc" | "dev" {
  if (process.env.AUTH_OIDC_ISSUER && process.env.AUTH_OIDC_CLIENT_ID) return "oidc";
  return "dev";
}

export { SESSION_COOKIE } from "./cookies";
export { sessionCookieOptions } from "./cookies";
