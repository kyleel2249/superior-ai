import { describe, it, expect } from "vitest";
import { can, assertCan, roleHasPermission, listPoliciesForRole } from "../rbac";
import type { SessionUser, Role } from "../session";

function userOf(role: Role): SessionUser {
  return { id: "u1", email: "u1@example.com", role };
}

describe("RBAC policy matrix", () => {
  it("owner can do everything, including undefined/admin-only resources", () => {
    const owner = userOf("owner");
    expect(can(owner, "billing", "write")).toBe(true);
    expect(can(owner, "admin", "manage")).toBe(true);
    expect(can(owner, "provider_keys", "manage")).toBe(true);
    expect(can(owner, "privacy", "delete")).toBe(true);
  });

  it("viewer can read but never write, delete, publish, or manage", () => {
    const viewer = userOf("viewer");
    expect(can(viewer, "workspace", "read")).toBe(true);
    expect(can(viewer, "workspace", "write")).toBe(false);
    expect(can(viewer, "crm", "delete")).toBe(false);
    expect(can(viewer, "campaign", "publish")).toBe(false);
    expect(can(viewer, "admin", "manage")).toBe(false);
    expect(can(viewer, "provider_keys", "manage")).toBe(false);
  });

  it("member can read/write/publish/run but cannot touch billing, admin, or secrets", () => {
    const member = userOf("member");
    expect(can(member, "workspace", "write")).toBe(true);
    expect(can(member, "campaign", "publish")).toBe(true);
    expect(can(member, "crm", "write")).toBe(true);
    expect(can(member, "billing", "write")).toBe(false);
    expect(can(member, "admin", "manage")).toBe(false);
    expect(can(member, "provider_keys", "manage")).toBe(false);
    expect(can(member, "audit", "read")).toBe(false); // member has no audit_read
  });

  it("admin can manage providers and billing but roleHasPermission never grants '*' implicitly", () => {
    const admin = userOf("admin");
    expect(can(admin, "provider_keys", "manage")).toBe(true);
    expect(can(admin, "billing", "manage")).toBe(true);
    expect(roleHasPermission("admin", "*")).toBe(false);
    expect(roleHasPermission("owner", "*")).toBe(true);
  });

  it("unknown action on a resource is always denied, even for owner", () => {
    const owner = userOf("owner");
    // "manage" isn't defined for "project" in POLICY_MATRIX
    expect(can(owner, "project", "manage")).toBe(false);
  });

  it("assertCan throws with resource/action/role context for denied actions", () => {
    const viewer = userOf("viewer");
    expect(() => assertCan(viewer, "billing", "write")).toThrowError(
      /Forbidden: viewer cannot write billing/
    );
    expect(() => assertCan(viewer, "workspace", "read")).not.toThrow();
  });

  it("listPoliciesForRole never crashes and reflects the same decisions as can()", () => {
    for (const role of ["owner", "admin", "member", "viewer"] as Role[]) {
      const rows = listPoliciesForRole(role);
      expect(rows.length).toBeGreaterThan(0);
      const user = userOf(role);
      for (const row of rows) {
        expect(row.allowed).toBe(
          can(user, row.resource, row.action as Parameters<typeof can>[2])
        );
      }
    }
  });

  it("privilege escalation guard: member cannot reach any permission granted only to admin/owner", () => {
    const memberOnly = new Set(["read", "write", "run_orchestrator", "crm_write", "publish"]);
    const adminOnlyPerms = ["manage_providers", "billing", "admin_config", "secrets_manage", "data_delete"];
    for (const perm of adminOnlyPerms) {
      expect(memberOnly.has(perm)).toBe(false);
      expect(roleHasPermission("member", perm as any)).toBe(false);
    }
  });
});
