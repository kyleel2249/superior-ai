/**
 * API route permission helpers — pairs with @superior-ai/auth RBAC.
 */

import {
  getSession,
  can,
  type SessionUser,
  type Resource,
} from "@superior-ai/auth";

export type GuardAction = "read" | "write" | "manage" | "delete" | "export" | "publish";

export interface GuardResult {
  allowed: boolean;
  user: SessionUser | null;
  reason?: string;
}

/** Optional auth: when no session, allow read-only public APIs in local-first mode */
export function guardRequest(
  authHeader: string | null | undefined,
  cookieHeader: string | null | undefined,
  resource: Resource,
  action: GuardAction,
  opts?: { requireAuth?: boolean }
): GuardResult {
  const token = authHeader || cookieHeader || null;
  const session = getSession(token);

  if (!session) {
    if (opts?.requireAuth) {
      return { allowed: false, user: null, reason: "Authentication required" };
    }
    // Local-first default: anonymous may read non-sensitive resources
    if (action === "read" && resource !== "provider_keys" && resource !== "billing" && resource !== "admin") {
      return {
        allowed: true,
        user: null,
        reason: "Anonymous read allowed in local-first mode",
      };
    }
    return { allowed: false, user: null, reason: "Authentication required for this action" };
  }

  if (!can(session.user, resource, action)) {
    return {
      allowed: false,
      user: session.user,
      reason: `Role ${session.user.role} cannot ${action} ${resource}`,
    };
  }
  return { allowed: true, user: session.user };
}

export function sensitiveApiPaths(): Array<{ path: string; resource: Resource; action: GuardAction }> {
  return [
    { path: "/api/billing", resource: "billing", action: "read" },
    { path: "/api/security", resource: "admin", action: "read" },
    { path: "/api/social", resource: "publish", action: "publish" },
    { path: "/api/factory", resource: "project", action: "write" },
  ];
}
