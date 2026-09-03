import { describe, it, expect, afterEach } from "vitest";
import { getPreferences, updatePreferences } from "../preferences";
import { createProject, getProject, updateProject, archiveProject, listProjects } from "../projects";

const originalEnv = process.env.ENABLE_BILLING_UI;
afterEach(() => {
  if (originalEnv === undefined) delete process.env.ENABLE_BILLING_UI;
  else process.env.ENABLE_BILLING_UI = originalEnv;
});

describe("preferences", () => {
  it("returns sensible defaults for a profile that's never been touched", () => {
    const prefs = getPreferences(`profile-${Math.random()}`);
    expect(prefs.theme).toBe("dark");
    expect(prefs.showBillingUi).toBe(false);
  });

  it("showBillingUi cannot be enabled without ENABLE_BILLING_UI=1, even if explicitly requested", () => {
    delete process.env.ENABLE_BILLING_UI;
    const profile = `profile-${Math.random()}`;
    const result = updatePreferences(profile, { showBillingUi: true });
    expect(result.showBillingUi).toBe(false);
  });

  it("showBillingUi turns on when both the env flag and an explicit request are present", () => {
    process.env.ENABLE_BILLING_UI = "1";
    const profile = `profile-${Math.random()}`;
    const result = updatePreferences(profile, { showBillingUi: true });
    expect(result.showBillingUi).toBe(true);
  });

  it("regression: an unrelated patch (e.g. theme) must not silently reset a previously-enabled showBillingUi", () => {
    process.env.ENABLE_BILLING_UI = "1";
    const profile = `profile-${Math.random()}`;
    updatePreferences(profile, { showBillingUi: true });
    expect(getPreferences(profile).showBillingUi).toBe(true);

    // A patch that says nothing about billing UI should carry the setting
    // forward, not reset it to false.
    const afterUnrelatedPatch = updatePreferences(profile, { theme: "light" });
    expect(afterUnrelatedPatch.theme).toBe("light");
    expect(afterUnrelatedPatch.showBillingUi).toBe(true);
  });

  it("still turns off automatically if ENABLE_BILLING_UI is disabled after being on", () => {
    process.env.ENABLE_BILLING_UI = "1";
    const profile = `profile-${Math.random()}`;
    updatePreferences(profile, { showBillingUi: true });

    process.env.ENABLE_BILLING_UI = "0";
    const afterEnvDisabled = updatePreferences(profile, { theme: "system" });
    expect(afterEnvDisabled.showBillingUi).toBe(false);
  });

  it("an explicit showBillingUi:false always turns it off regardless of env", () => {
    process.env.ENABLE_BILLING_UI = "1";
    const profile = `profile-${Math.random()}`;
    updatePreferences(profile, { showBillingUi: true });
    const result = updatePreferences(profile, { showBillingUi: false });
    expect(result.showBillingUi).toBe(false);
  });

  it("preferences are isolated per profile", () => {
    const a = `profile-a-${Math.random()}`;
    const b = `profile-b-${Math.random()}`;
    updatePreferences(a, { theme: "light" });
    expect(getPreferences(b).theme).toBe("dark");
  });
});

describe("projects", () => {
  it("creates a project with a trimmed name, defaulting to 'Untitled project' when blank", () => {
    const p = createProject({ name: "   ", profileId: "p1" });
    expect(p.name).toBe("Untitled project");
    expect(p.status).toBe("active");
  });

  it("listProjects filters by profileId when given, returns all when omitted", () => {
    const profileId = `prof-${Math.random()}`;
    createProject({ name: "A", profileId });
    createProject({ name: "B", profileId });
    const filtered = listProjects(profileId);
    expect(filtered.every((p) => p.profileId === profileId)).toBe(true);
    expect(filtered.length).toBe(2);
  });

  it("updateProject patches only the given fields and bumps updatedAt", () => {
    const p = createProject({ name: "Original", profileId: "p1" });
    const updated = updateProject(p.id, { description: "new desc" });
    expect(updated?.name).toBe("Original");
    expect(updated?.description).toBe("new desc");
  });

  it("archiveProject sets status to archived via updateProject", () => {
    const p = createProject({ name: "ToArchive", profileId: "p1" });
    const archived = archiveProject(p.id);
    expect(archived?.status).toBe("archived");
    expect(getProject(p.id)?.status).toBe("archived");
  });

  it("returns null for operations on a nonexistent project id", () => {
    expect(getProject("proj_nonexistent")).toBeNull();
    expect(updateProject("proj_nonexistent", { name: "x" })).toBeNull();
    expect(archiveProject("proj_nonexistent")).toBeNull();
  });
});
