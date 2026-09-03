/**
 * Organizations + invites (multi-tenant foundation)
 */

import type { Role } from "./session";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  createdAt: string;
}

export interface OrgMember {
  organizationId: string;
  userId: string;
  email: string;
  role: Role;
  joinedAt: string;
}

export interface Invite {
  id: string;
  organizationId: string;
  email: string;
  role: Role;
  token: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expiresAt: string;
  createdAt: string;
}

const orgs = new Map<string, Organization>();
const members = new Map<string, OrgMember[]>(); // orgId -> members
const invites = new Map<string, Invite>();

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
}

export function createOrganization(name: string, owner: { userId: string; email: string }): Organization {
  const id = `org_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const org: Organization = {
    id,
    name,
    slug: slugify(name) || id,
    plan: "free",
    createdAt: new Date().toISOString(),
  };
  orgs.set(id, org);
  members.set(id, [
    {
      organizationId: id,
      userId: owner.userId,
      email: owner.email,
      role: "owner",
      joinedAt: new Date().toISOString(),
    },
  ]);
  return org;
}

export function getOrganization(id: string): Organization | undefined {
  return orgs.get(id);
}

export function listMembers(organizationId: string): OrgMember[] {
  return members.get(organizationId) ?? [];
}

export function createInvite(input: {
  organizationId: string;
  email: string;
  role?: Role;
  ttlHours?: number;
}): Invite {
  const id = `inv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const token = `invite_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
  const hours = input.ttlHours ?? 72;
  const invite: Invite = {
    id,
    organizationId: input.organizationId,
    email: input.email.toLowerCase(),
    role: input.role ?? "member",
    token,
    status: "pending",
    expiresAt: new Date(Date.now() + hours * 3600_000).toISOString(),
    createdAt: new Date().toISOString(),
  };
  invites.set(token, invite);
  return invite;
}

export function acceptInvite(
  token: string,
  user: { userId: string; email: string }
): { ok: boolean; organizationId?: string; error?: string } {
  const invite = invites.get(token);
  if (!invite) return { ok: false, error: "Invalid invite" };
  if (invite.status !== "pending") return { ok: false, error: `Invite ${invite.status}` };
  if (new Date(invite.expiresAt) < new Date()) {
    invite.status = "expired";
    return { ok: false, error: "Invite expired" };
  }
  if (user.email.toLowerCase() !== invite.email) {
    return { ok: false, error: "Email does not match invite" };
  }
  const list = members.get(invite.organizationId) ?? [];
  if (!list.find((m) => m.userId === user.userId)) {
    list.push({
      organizationId: invite.organizationId,
      userId: user.userId,
      email: user.email,
      role: invite.role,
      joinedAt: new Date().toISOString(),
    });
    members.set(invite.organizationId, list);
  }
  invite.status = "accepted";
  return { ok: true, organizationId: invite.organizationId };
}

export function getInvite(token: string): Invite | undefined {
  return invites.get(token);
}
