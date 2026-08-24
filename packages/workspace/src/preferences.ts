/**
 * Workspace preferences — theme, language, defaults.
 * Server holds active session prefs; client mirrors to localStorage.
 */

export type ThemeMode = "dark" | "light" | "system";

export interface WorkspacePreferences {
  theme: ThemeMode;
  language: string;
  defaultIntelligence: string;
  reduceMotion: boolean;
  showBillingUi: boolean;
  commandPaletteEnabled: boolean;
  updatedAt: string;
}

const defaults: WorkspacePreferences = {
  theme: "dark",
  language: "en",
  defaultIntelligence: "BALANCED",
  reduceMotion: false,
  showBillingUi: false,
  commandPaletteEnabled: true,
  updatedAt: new Date().toISOString(),
};

const byProfile = new Map<string, WorkspacePreferences>();

export function getPreferences(profileId: string): WorkspacePreferences {
  return { ...(byProfile.get(profileId) ?? defaults) };
}

export function updatePreferences(
  profileId: string,
  patch: Partial<WorkspacePreferences>
): WorkspacePreferences {
  const current = getPreferences(profileId);
  const next: WorkspacePreferences = {
    ...current,
    ...patch,
    // Never allow billing UI unless explicit env + patch
    showBillingUi:
      process.env.ENABLE_BILLING_UI === "1" && patch.showBillingUi === true
        ? true
        : false,
    updatedAt: new Date().toISOString(),
  };
  byProfile.set(profileId, next);
  return next;
}
