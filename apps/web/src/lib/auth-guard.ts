import { getSession, hasPermission, type SessionUser } from "@superior-ai/auth";

export function userFromRequest(authHeader: string | null): SessionUser | null {
  return getSession(authHeader)?.user ?? null;
}

export function assertPerm(authHeader: string | null, permission: string): SessionUser {
  const user = userFromRequest(authHeader);
  if (!user) throw new Error("Unauthorized");
  if (!hasPermission(user, permission)) throw new Error(`Forbidden: ${permission}`);
  return user;
}
