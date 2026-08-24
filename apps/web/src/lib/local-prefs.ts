/**
 * Client-side preference + project mirror (localStorage).
 * Survives refresh without mandatory auth.
 */

const PREFS_KEY = "superior_ai_prefs_v1";
const PROJECTS_KEY = "superior_ai_projects_v1";
const PROFILE_KEY = "superior_ai_active_profile_v1";

export type LocalPrefs = {
  theme: "dark" | "light" | "system";
  language: string;
  defaultIntelligence: string;
  reduceMotion: boolean;
  profileId?: string;
};

export function loadLocalPrefs(): LocalPrefs {
  if (typeof window === "undefined") {
    return {
      theme: "dark",
      language: "en",
      defaultIntelligence: "BALANCED",
      reduceMotion: false,
    };
  }
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) {
      return {
        theme: "dark",
        language: "en",
        defaultIntelligence: "BALANCED",
        reduceMotion: false,
      };
    }
    return { ...JSON.parse(raw) };
  } catch {
    return {
      theme: "dark",
      language: "en",
      defaultIntelligence: "BALANCED",
      reduceMotion: false,
    };
  }
}

export function saveLocalPrefs(prefs: Partial<LocalPrefs>): LocalPrefs {
  const next = { ...loadLocalPrefs(), ...prefs };
  localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  if (next.profileId) localStorage.setItem(PROFILE_KEY, next.profileId);
  return next;
}

export function loadLocalProjects(): Array<{
  id: string;
  name: string;
  description?: string;
  profileId: string;
}> {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(PROJECTS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveLocalProject(p: {
  id: string;
  name: string;
  description?: string;
  profileId: string;
}): void {
  const list = loadLocalProjects().filter((x) => x.id !== p.id);
  list.unshift(p);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(list.slice(0, 50)));
}
