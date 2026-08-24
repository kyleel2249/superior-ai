/**
 * Phase 2 requirement: no workspace/project concept existed anywhere in the
 * repo. Deliberately does NOT require a session — the spec's "no mandatory
 * sign-in" default flow means Launch -> Open Workspace -> Start Using, so
 * workspace/project creation must work with zero auth. The existing
 * session/org system in packages/auth is unaffected and still available
 * for anyone who explicitly signs in for multi-user/admin features — this
 * doesn't replace that, it's the separate local-first layer the spec asks for.
 */

export type LocalProfile = "personal" | "business" | "development" | "marketing" | "research" | "creative";

export interface Workspace {
  id: string;
  name: string;
  profile: LocalProfile;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

const workspaces = new Map<string, Workspace>();
const projects = new Map<string, Project>();

export function createWorkspace(name: string, profile: LocalProfile = "personal"): Workspace {
  if (!name.trim()) throw new Error("Workspace name is required");
  const now = new Date().toISOString();
  const workspace: Workspace = {
    id: `ws_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
    profile,
    createdAt: now,
    updatedAt: now,
  };
  workspaces.set(workspace.id, workspace);
  return workspace;
}

export function listWorkspaces(): Workspace[] {
  return Array.from(workspaces.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getWorkspace(id: string): Workspace | undefined {
  return workspaces.get(id);
}

export function renameWorkspace(id: string, name: string): Workspace | undefined {
  const ws = workspaces.get(id);
  if (!ws || !name.trim()) return undefined;
  ws.name = name.trim();
  ws.updatedAt = new Date().toISOString();
  return ws;
}

export function deleteWorkspace(id: string): boolean {
  // Cascade: a workspace with projects still in it is deleted along with them,
  // matching the spec's simple local-first model rather than blocking on referential integrity.
  for (const p of Array.from(projects.values())) {
    if (p.workspaceId === id) projects.delete(p.id);
  }
  return workspaces.delete(id);
}

export function createProject(workspaceId: string, name: string, description?: string): Project {
  if (!workspaces.has(workspaceId)) throw new Error(`Workspace ${workspaceId} does not exist`);
  if (!name.trim()) throw new Error("Project name is required");
  const now = new Date().toISOString();
  const project: Project = {
    id: `proj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    workspaceId,
    name: name.trim(),
    description,
    createdAt: now,
    updatedAt: now,
  };
  projects.set(project.id, project);
  return project;
}

export function listProjects(workspaceId: string): Project[] {
  return Array.from(projects.values())
    .filter((p) => p.workspaceId === workspaceId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getProject(id: string): Project | undefined {
  return projects.get(id);
}

export function renameProject(id: string, name: string): Project | undefined {
  const p = projects.get(id);
  if (!p || !name.trim()) return undefined;
  p.name = name.trim();
  p.updatedAt = new Date().toISOString();
  return p;
}

export function deleteProject(id: string): boolean {
  return projects.delete(id);
}
