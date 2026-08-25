/**
 * Personal + project AI profiles — preferences and context, not sensitive inference.
 */

export interface UserAiProfile {
  userId: string;
  preferredOutputFormat?: string;
  preferredDepth?: "brief" | "standard" | "deep";
  preferredModel?: string;
  preferredReasoning?: string;
  codingStyle?: string;
  communicationStyle?: string;
  preferredTools?: string[];
  approvalPreference?: "minimal" | "standard" | "strict";
  goals?: string[];
  updatedAt: string;
}

export interface ProjectAiProfile {
  projectId: string;
  mission?: string;
  goals?: string[];
  architectureNotes?: string[];
  preferredModels?: string[];
  tools?: string[];
  policies?: string[];
  kpis?: string[];
  deadlines?: string[];
  historyNotes?: string[];
  updatedAt: string;
}

const users = new Map<string, UserAiProfile>();
const projects = new Map<string, ProjectAiProfile>();

export function upsertUserProfile(
  input: Partial<UserAiProfile> & { userId: string }
): UserAiProfile {
  const prev = users.get(input.userId);
  const row: UserAiProfile = {
    ...prev,
    ...input,
    userId: input.userId,
    updatedAt: new Date().toISOString(),
  };
  users.set(row.userId, row);
  return row;
}

export function getUserProfile(userId: string): UserAiProfile | undefined {
  return users.get(userId);
}

export function upsertProjectProfile(
  input: Partial<ProjectAiProfile> & { projectId: string }
): ProjectAiProfile {
  const prev = projects.get(input.projectId);
  const row: ProjectAiProfile = {
    ...prev,
    ...input,
    projectId: input.projectId,
    updatedAt: new Date().toISOString(),
  };
  projects.set(row.projectId, row);
  return row;
}

export function getProjectProfile(projectId: string): ProjectAiProfile | undefined {
  return projects.get(projectId);
}

export function listProjectProfiles(): ProjectAiProfile[] {
  return [...projects.values()];
}
