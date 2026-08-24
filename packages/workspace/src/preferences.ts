/**
 * Phase 2 requirements: Preferences, Settings, Theme, Language. Explicitly
 * excludes anything billing-related per the spec's own rule ("Do not expose
 * Billing / Credits / Token Counters / Usage Meters / Budgets" in this
 * no-mandatory-signin default experience).
 */

export type Theme = "dark" | "light" | "system";
export type Language = "en" | "es" | "fr" | "de" | "pt" | "ja" | "zh";

export interface WorkspacePreferences {
  workspaceId: string;
  theme: Theme;
  language: Language;
  keyboardShortcutsEnabled: boolean;
  custom: Record<string, string | number | boolean>;
}

const DEFAULTS: Omit<WorkspacePreferences, "workspaceId"> = {
  theme: "dark",
  language: "en",
  keyboardShortcutsEnabled: true,
  custom: {},
};

const store = new Map<string, WorkspacePreferences>();

export function getPreferences(workspaceId: string): WorkspacePreferences {
  return store.get(workspaceId) ?? { workspaceId, ...DEFAULTS, custom: {} };
}

export function setPreferences(workspaceId: string, patch: Partial<Omit<WorkspacePreferences, "workspaceId">>): WorkspacePreferences {
  const current = getPreferences(workspaceId);
  const updated: WorkspacePreferences = {
    ...current,
    ...patch,
    custom: { ...current.custom, ...(patch.custom ?? {}) },
  };
  store.set(workspaceId, updated);
  return updated;
}

export function setCustomPreference(workspaceId: string, key: string, value: string | number | boolean): WorkspacePreferences {
  return setPreferences(workspaceId, { custom: { [key]: value } });
}

export function resetPreferences(workspaceId: string): WorkspacePreferences {
  const reset: WorkspacePreferences = { workspaceId, ...DEFAULTS, custom: {} };
  store.set(workspaceId, reset);
  return reset;
}
