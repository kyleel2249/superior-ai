import { randomBytes } from "crypto";
import type { Role } from "./session";

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  ownerId: string;
}

export interface Member {
  userId: string;
  email: string;
  organizationId: string;
  role: Role;
  joinedAt: string;
}

export interface Invite {
  id: string;
  token: string;
  organizationId: string;
  email: string;
  role: Role;
  status: "pending" | "accepted" | "expired";
  createdAt: string;
  expiresAt: string;
}

const orgs = new Map<string, Organization>();
const members = new Map<string, Member[]>(); // orgId -> members
const invites = new Map<string, Invite>(); // token -> invite

export function createOrganization(name: string, owner: { userId: string; email: string }): Organization {
  const org: Organization = {
    id: `org_${Date.now().toString(36)}${randomBytes(3).toString("hex")}`,
    name,
    createdAt: new Date().toISOString(),
    ownerId: owner.userId,
  };
  orgs.set(org.id, org);
  members.set(org.id, [{ userId: owner.userId, email: owner.email, organizationId: org.id, role: "owner", joinedAt: org.createdAt }]);
  return org;
}

export function getOrganization(id: string): Organization | undefined {
  return orgs.get(id);
}

export function listMembers(organizationId: string): Member[] {
  return members.get(organizationId) ?? [];
}

export function createInvite(input: { organizationId: string; email: string; role?: Role }): Invite {
  const invite: Invite = {
    id: `inv_${Date.now().toString(36)}`,
    token: randomBytes(24).toString("base64url"),
    organizationId: input.organizationId,
    email: input.email.trim().toLowerCase(),
    role: input.role ?? "member",
    status: "pending",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
  invites.set(invite.token, invite);
  return invite;
}

export function getInvite(token: string): Invite | undefined {
  const inv = invites.get(token);
  if (inv && inv.status === "pending" && new Date(inv.expiresAt).getTime() < Date.now()) {
    inv.status = "expired";
  }
  return inv;
}

export function acceptInvite(token: string, user: { userId: string; email: string }): { ok: boolean; error?: string; organization?: Organization } {
  const invite = getInvite(token);
  if (!invite) return { ok: false, error: "Invite not found" };
  if (invite.status !== "pending") return { ok: false, error: `Invite is ${invite.status}` };
  const org = orgs.get(invite.organizationId);
  if (!org) return { ok: false, error: "Organization not found" };
  const list = members.get(org.id) ?? [];
  if (!list.some((m) => m.userId === user.userId)) {
    list.push({ userId: user.userId, email: user.email, organizationId: org.id, role: invite.role, joinedAt: new Date().toISOString() });
    members.set(org.id, list);
  }
  invite.status = "accepted";
  return { ok: true, organization: org };
}
