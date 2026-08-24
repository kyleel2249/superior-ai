/**
 * Phase 4 requirement: Verification Agent.
 *
 * HONESTY NOTE: this is NOT a fact-checker — there's no ground-truth source
 * to check against inside this module. What it actually does: scans for
 * hedge language (signals the model itself is uncertain) and for absolute-
 * certainty language on claims that commonly need qualification (numbers,
 * dates, "always"/"never" claims), which is a real, inspectable signal that
 * a response might need a second look — not a verdict on whether it's true.
 */

const HEDGE_PATTERNS = [
  /\bi think\b/i,
  /\bmight be\b/i,
  /\bmay be\b/i,
  /\bpossibly\b/i,
  /\bnot (entirely )?sure\b/i,
  /\bi believe\b/i,
  /\bcould be\b/i,
];

const OVERCONFIDENT_PATTERNS = [/\balways\b/i, /\bnever\b/i, /\bguaranteed\b/i, /\b100%\b/i, /\bdefinitely\b/i, /\bcertainly\b/i];

export interface VerificationResult {
  hedgeSignals: string[];
  overconfidenceSignals: string[];
  containsNumericClaims: boolean;
  containsDateClaims: boolean;
  needsReview: boolean;
  note: string;
}

export function verifyResponse(text: string): VerificationResult {
  const hedgeSignals = HEDGE_PATTERNS.filter((p) => p.test(text)).map((p) => p.source);
  const overconfidenceSignals = OVERCONFIDENT_PATTERNS.filter((p) => p.test(text)).map((p) => p.source);
  const containsNumericClaims = /\b\d+(\.\d+)?%?\b/.test(text);
  const containsDateClaims = /\b(19|20)\d{2}\b/.test(text);

  const needsReview = overconfidenceSignals.length > 0 && (containsNumericClaims || containsDateClaims);

  return {
    hedgeSignals,
    overconfidenceSignals,
    containsNumericClaims,
    containsDateClaims,
    needsReview,
    note: needsReview
      ? "Contains absolute-certainty language alongside numeric/date claims — worth a human check, not verified against any source here."
      : "No overconfidence-plus-specific-claim pattern detected. This is not a fact-check — only an absence-of-red-flag signal.",
  };
}
