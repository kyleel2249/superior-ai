/**
 * Optional local workspace profiles — no mandatory sign-in
 */

export type WorkspaceProfileKind =
  | "personal"
  | "business"
  | "development"
  | "marketing"
  | "research"
  | "creative";

export interface WorkspaceProfile {
  id: string;
  name: string;
  kind: WorkspaceProfileKind;
  createdAt: string;
}

const profiles: WorkspaceProfile[] = [
  {
    id: "profile_default",
    name: "Default",
    kind: "personal",
    createdAt: new Date().toISOString(),
  },
];

let activeProfileId = "profile_default";

export function listProfiles(): WorkspaceProfile[] {
  return [...profiles];
}

export function getActiveProfile(): WorkspaceProfile {
  return profiles.find((p) => p.id === activeProfileId) ?? profiles[0]!;
}

export function setActiveProfile(id: string): WorkspaceProfile | null {
  const p = profiles.find((x) => x.id === id);
  if (!p) return null;
  activeProfileId = id;
  return p;
}

export function createProfile(name: string, kind: WorkspaceProfileKind): WorkspaceProfile {
  const p: WorkspaceProfile = {
    id: `profile_${Date.now().toString(36)}`,
    name,
    kind,
    createdAt: new Date().toISOString(),
  };
  profiles.push(p);
  return p;
}
