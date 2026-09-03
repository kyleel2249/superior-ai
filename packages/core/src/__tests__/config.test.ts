import { describe, it, expect, afterEach } from "vitest";
import { loadConfig, isFeatureEnabled, resetConfigCache } from "../config";
import { flag, listFlags } from "../flags";

const FLAG_KEYS = ["FEATURE_FLAGS", "ENABLE_BILLING_UI", "ALLOW_CODE_EXEC", "ENABLE_AUTONOMOUS_TOOLS"] as const;

function withEnv(overrides: Partial<Record<(typeof FLAG_KEYS)[number], string | undefined>>, fn: () => void) {
  const originals = FLAG_KEYS.map((k) => [k, process.env[k]] as const);
  for (const k of FLAG_KEYS) delete process.env[k];
  for (const [k, v] of Object.entries(overrides)) {
    if (v !== undefined) process.env[k] = v;
  }
  resetConfigCache();
  try {
    fn();
  } finally {
    for (const [k, v] of originals) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    resetConfigCache();
  }
}

afterEach(() => {
  resetConfigCache();
});

describe("loadConfig / feature flag defaults", () => {
  it("defaults billingUi and codeExec to false, autonomousTools to true, when unset", () => {
    withEnv({}, () => {
      const cfg = loadConfig(true);
      expect(cfg.featureFlags.billingUi).toBe(false);
      expect(cfg.featureFlags.codeExec).toBe(false);
      expect(cfg.featureFlags.autonomousTools).toBe(true);
      expect(cfg.featureFlags.localFirst).toBe(true);
    });
  });

  it("ENABLE_AUTONOMOUS_TOOLS=0 is the only way to turn autonomousTools off (opt-out, not opt-in)", () => {
    withEnv({ ENABLE_AUTONOMOUS_TOOLS: "0" }, () => {
      expect(loadConfig(true).featureFlags.autonomousTools).toBe(false);
    });
    withEnv({ ENABLE_AUTONOMOUS_TOOLS: "anything-else" }, () => {
      expect(loadConfig(true).featureFlags.autonomousTools).toBe(true);
    });
  });

  it("ENABLE_BILLING_UI and ALLOW_CODE_EXEC require exactly '1' to enable", () => {
    withEnv({ ENABLE_BILLING_UI: "true", ALLOW_CODE_EXEC: "yes" }, () => {
      // Neither "true" nor "yes" is "1" for these two — verifies strict opt-in
      const cfg = loadConfig(true);
      expect(cfg.featureFlags.billingUi).toBe(false);
      expect(cfg.featureFlags.codeExec).toBe(false);
    });
    withEnv({ ENABLE_BILLING_UI: "1", ALLOW_CODE_EXEC: "1" }, () => {
      const cfg = loadConfig(true);
      expect(cfg.featureFlags.billingUi).toBe(true);
      expect(cfg.featureFlags.codeExec).toBe(true);
    });
  });

  it("FEATURE_FLAGS parses comma-separated key=value pairs and overrides named defaults", () => {
    withEnv({ FEATURE_FLAGS: "customThing=1,billingUi=1,localFirst=0" }, () => {
      const cfg = loadConfig(true);
      expect(cfg.featureFlags.customThing).toBe(true);
      expect(cfg.featureFlags.billingUi).toBe(true);
      expect(cfg.featureFlags.localFirst).toBe(false);
    });
  });

  it("a bare flag name with no '=value' defaults to true", () => {
    withEnv({ FEATURE_FLAGS: "someBareFlag" }, () => {
      expect(loadConfig(true).featureFlags.someBareFlag).toBe(true);
    });
  });

  it("caches config until resetConfigCache() or force=true is used", () => {
    withEnv({ ENABLE_BILLING_UI: "1" }, () => {
      const first = loadConfig(true);
      expect(first.featureFlags.billingUi).toBe(true);

      process.env.ENABLE_BILLING_UI = "0";
      // No force, no reset — should still reflect the cached value.
      const stillCached = loadConfig();
      expect(stillCached.featureFlags.billingUi).toBe(true);

      const forced = loadConfig(true);
      expect(forced.featureFlags.billingUi).toBe(false);
    });
  });
});

describe("flags.ts wrapper", () => {
  it("flag() and listFlags() reflect the same underlying config", () => {
    withEnv({ FEATURE_FLAGS: "wrapperTest=1" }, () => {
      loadConfig(true);
      expect(flag("wrapperTest")).toBe(true);
      expect(listFlags().wrapperTest).toBe(true);
      expect(isFeatureEnabled("wrapperTest")).toBe(true);
    });
  });

  it("unknown flag names are false, never throw", () => {
    expect(() => flag("totally_unknown_flag_xyz")).not.toThrow();
    expect(flag("totally_unknown_flag_xyz")).toBe(false);
  });

  it("listFlags() returns a snapshot copy, not a live reference to internal config", () => {
    const snapshot = listFlags();
    snapshot.injected = true;
    expect(listFlags().injected).toBeUndefined();
  });
});
