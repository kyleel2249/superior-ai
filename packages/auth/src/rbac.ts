/**
 * RBAC policy matrix — resource + action checks.
 */

import type { Role, SessionUser } from "./session";
import { hasPermission } from "./session";

export type Permission =
  | "read"
  | "write"
  | "manage_providers"
  | "manage_members"
  | "run_orchestrator"
  | "crm_write"
  | "billing"
  | "admin_config"
  | "audit_read"
  | "data_export"
  | "data_delete"
  | "publish"
  | "secrets_manage"
  | "*";

export type Resource =
  | "workspace"
  | "project"
  | "memory"
  | "crm"
  | "campaign"
  | "provider_keys"
  | "billing"
  | "audit"
  | "privacy"
  | "admin"
  | "publish";

/** Resource → minimum permission required for action */
export const POLICY_MATRIX: Record<
  Resource,
  Partial<Record<"read" | "write" | "manage" | "delete" | "export" | "publish", Permission>>
> = {
  workspace: { read: "read", write: "write", manage: "admin_config" },
  project: { read: "read", write: "write", delete: "write" },
  memory: { read: "read", write: "write", delete: "write", export: "data_export" },
  crm: { read: "read", write: "crm_write", delete: "crm_write", export: "data_export" },
  campaign: { read: "read", write: "write", publish: "publish" },
  provider_keys: { read: "manage_providers", write: "manage_providers", manage: "secrets_manage" },
  billing: { read: "billing", write: "billing", manage: "billing" },
  audit: { read: "audit_read" },
  privacy: { read: "data_export", write: "data_delete", export: "data_export", delete: "data_delete" },
  admin: { read: "admin_config", manage: "admin_config" },
  publish: { publish: "publish" },
};

/** Extended role permissions beyond session ROLE_PERMS */
export const EXTENDED_ROLE_PERMS: Record<Role, Permission[]> = {
  owner: ["*"],
  admin: [
    "read",
    "write",
    "manage_providers",
    "manage_members",
    "run_orchestrator",
    "crm_write",
    "billing",
    "admin_config",
    "audit_read",
    "data_export",
    "data_delete",
    "publish",
    "secrets_manage",
  ],
  member: ["read", "write", "run_orchestrator", "crm_write", "publish"],
  viewer: ["read", "audit_read"],
};

export function roleHasPermission(role: Role, permission: Permission): boolean {
  const perms = EXTENDED_ROLE_PERMS[role] ?? [];
  return perms.includes("*") || perms.includes(permission);
}

export function can(
  user: SessionUser,
  resource: Resource,
  action: "read" | "write" | "manage" | "delete" | "export" | "publish"
): boolean {
  const required = POLICY_MATRIX[resource]?.[action];
  if (!required) return false;
  if (roleHasPermission(user.role, required)) return true;
  // Fallback to session hasPermission for legacy perms
  return hasPermission(user, required);
}

export function assertCan(
  user: SessionUser,
  resource: Resource,
  action: "read" | "write" | "manage" | "delete" | "export" | "publish"
): void {
  if (!can(user, resource, action)) {
    throw new Error(`Forbidden: ${user.role} cannot ${action} ${resource}`);
  }
}

export function listPoliciesForRole(role: Role): Array<{ resource: Resource; action: string; allowed: boolean }> {
  const rows: Array<{ resource: Resource; action: string; allowed: boolean }> = [];
  const fakeUser: SessionUser = {
    id: "policy_probe",
    email: "probe@local",
    role,
  };
  for (const resource of Object.keys(POLICY_MATRIX) as Resource[]) {
    const actions = POLICY_MATRIX[resource];
    for (const action of Object.keys(actions) as Array<keyof typeof actions>) {
      rows.push({
        resource,
        action,
        allowed: can(fakeUser, resource, action),
      });
    }
  }
  return rows;
}
