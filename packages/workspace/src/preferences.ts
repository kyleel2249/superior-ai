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
  // Only touch showBillingUi when this patch actually mentions it — an
  // unrelated patch (e.g. changing theme) must carry the current value
  // forward, not silently reset it to false (a real bug: previously this
  // recomputed showBillingUi from patch.showBillingUi on every call, so any
  // patch that omitted it wiped out a previously-enabled setting).
  const requestedBillingUi =
    patch.showBillingUi !== undefined ? patch.showBillingUi : current.showBillingUi;
  const next: WorkspacePreferences = {
    ...current,
    ...patch,
    // Still re-gated by the env flag on every write — if ENABLE_BILLING_UI
    // is turned off after being on, the setting turns off automatically too.
    showBillingUi: process.env.ENABLE_BILLING_UI === "1" && requestedBillingUi === true,
    updatedAt: new Date().toISOString(),
  };
  byProfile.set(profileId, next);
  return next;
}
