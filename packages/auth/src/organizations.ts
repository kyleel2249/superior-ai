import { randomBytes } from "crypto";
import type { Role } from "./session";

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
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

const organizations = new Map<string, Organization>();
const members: Member[] = [];
const invites = new Map<string, Invite>();

export function createOrganization(name: string, owner: { userId: string; email: string }): Organization {
  const org: Organization = {
    id: `org_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    ownerId: owner.userId,
    createdAt: new Date().toISOString(),
  };
  organizations.set(org.id, org);
  members.push({ userId: owner.userId, email: owner.email, organizationId: org.id, role: "owner", joinedAt: org.createdAt });
  return org;
}

export function getOrganization(id: string): Organization | undefined {
  return organizations.get(id);
}

export function listMembers(organizationId: string): Member[] {
  return members.filter((m) => m.organizationId === organizationId);
}

export function createInvite(input: { organizationId: string; email: string; role?: Role }): Invite {
  const now = new Date();
  const invite: Invite = {
    id: `inv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    token: randomBytes(24).toString("base64url"),
    organizationId: input.organizationId,
    email: input.email,
    role: input.role ?? "member",
    status: "pending",
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 7 * 86400000).toISOString(),
  };
  invites.set(invite.token, invite);
  return invite;
}

export function getInvite(token: string): Invite | undefined {
  const invite = invites.get(token);
  if (invite && invite.status === "pending" && new Date(invite.expiresAt).getTime() < Date.now()) {
    invite.status = "expired";
  }
  return invite;
}

export function acceptInvite(token: string, acceptor: { userId: string; email: string }): { ok: boolean; error?: string; member?: Member } {
  const invite = getInvite(token);
  if (!invite) return { ok: false, error: "Invite not found" };
  if (invite.status !== "pending") return { ok: false, error: `Invite is ${invite.status}` };
  invite.status = "accepted";
  const member: Member = {
    userId: acceptor.userId,
    email: acceptor.email,
    organizationId: invite.organizationId,
    role: invite.role,
    joinedAt: new Date().toISOString(),
  };
  members.push(member);
  return { ok: true, member };
}
