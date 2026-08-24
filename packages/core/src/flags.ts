/**
 * Feature flags — env-backed, runtime readable.
 */
import { loadConfig, isFeatureEnabled } from "./config";

export type FlagName =
  | "localFirst"
  | "billingUi"
  | "codeExec"
  | "autonomousTools"
  | "multiEngineSearch"
  | string;

export function flag(name: FlagName): boolean {
  return isFeatureEnabled(name);
}

export function listFlags(): Record<string, boolean> {
  return { ...loadConfig().featureFlags };
}
