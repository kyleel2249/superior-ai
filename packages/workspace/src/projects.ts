/**
 * Local project registry — persists in-process; client also mirrors to localStorage.
 */

export interface ProjectRecord {
  id: string;
  name: string;
  description?: string;
  profileId: string;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

const projects = new Map<string, ProjectRecord>();

export function listProjects(profileId?: string): ProjectRecord[] {
  const all = [...projects.values()];
  if (!profileId) return all;
  return all.filter((p) => p.profileId === profileId);
}

export function getProject(id: string): ProjectRecord | null {
  return projects.get(id) ?? null;
}

export function createProject(input: {
  name: string;
  description?: string;
  profileId: string;
}): ProjectRecord {
  const now = new Date().toISOString();
  const p: ProjectRecord = {
    id: `proj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name: input.name.trim() || "Untitled project",
    description: input.description,
    profileId: input.profileId,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
  projects.set(p.id, p);
  return p;
}

export function updateProject(
  id: string,
  patch: Partial<Pick<ProjectRecord, "name" | "description" | "status">>
): ProjectRecord | null {
  const p = projects.get(id);
  if (!p) return null;
  if (patch.name !== undefined) p.name = patch.name;
  if (patch.description !== undefined) p.description = patch.description;
  if (patch.status !== undefined) p.status = patch.status;
  p.updatedAt = new Date().toISOString();
  return p;
}

export function archiveProject(id: string): ProjectRecord | null {
  return updateProject(id, { status: "archived" });
}
