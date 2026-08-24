/**
 * Code Review, Gap Detection & Optimization
 * Heuristic static analysis + requirements gap map.
 * Does not invent test results; fix suggestions are proposals until applied + re-validated.
 */

export type FindingSeverity = "info" | "low" | "medium" | "high" | "critical";

export type FindingCategory =
  | "bug"
  | "security"
  | "performance"
  | "accessibility"
  | "seo"
  | "architecture"
  | "style"
  | "gap"
  | "optimization";

export type ImplementationStatus =
  | "Implemented"
  | "Partial"
  | "Missing"
  | "Broken"
  | "Risk"
  | "Optimization Opportunity";

export interface CodeFinding {
  id: string;
  category: FindingCategory;
  severity: FindingSeverity;
  status: ImplementationStatus;
  title: string;
  detail: string;
  lineHint?: number;
  suggestion?: string;
  autoFixable?: boolean;
  fixedSnippet?: string;
}

export interface RequirementItem {
  id: string;
  text: string;
  status: ImplementationStatus;
  evidence?: string;
}

export interface ReviewReport {
  summary: string;
  findings: CodeFinding[];
  requirements: RequirementItem[];
  counts: Record<string, number>;
  fixedCode?: string;
  verified: boolean;
  verificationNote: string;
}

function lineOf(code: string, index: number): number {
  return code.slice(0, Math.max(0, index)).split(/\n/).length;
}

let fid = 0;
function finding(
  partial: Omit<CodeFinding, "id">
): CodeFinding {
  fid += 1;
  return { id: `f_${fid}`, ...partial };
}

/** Security heuristics */
export function scanSecurity(code: string): CodeFinding[] {
  const out: CodeFinding[] = [];
  const rules: Array<{ re: RegExp; title: string; severity: FindingSeverity; suggestion: string }> = [
    { re: /eval\s*\(/, title: "Use of eval", severity: "critical", suggestion: "Avoid eval; use safe parsers." },
    { re: /new\s+Function\s*\(/, title: "Dynamic Function constructor", severity: "high", suggestion: "Avoid runtime code generation from strings." },
    { re: /innerHTML\s*=/, title: "innerHTML assignment", severity: "high", suggestion: "Use textContent or sanitized HTML." },
    { re: /dangerouslySetInnerHTML/, title: "dangerouslySetInnerHTML", severity: "medium", suggestion: "Sanitize input; prefer safe components." },
    { re: /password\s*=\s*['"][^'"]+['"]/, title: "Hardcoded password", severity: "critical", suggestion: "Use secrets manager / env vars." },
    { re: /api[_-]?key\s*=\s*['"][a-zA-Z0-9_\-]{16,}['"]/i, title: "Hardcoded API key", severity: "critical", suggestion: "Move to environment configuration." },
    { re: /SELECT\s+\*\s+FROM\s+.+\+/, title: "Possible SQL string concat", severity: "high", suggestion: "Use parameterized queries." },
    { re: /child_process|exec\s*\(|execSync/, title: "Shell execution", severity: "high", suggestion: "Restrict and sanitize; prefer explicit APIs." },
    { re: /http:\/\//, title: "Insecure HTTP URL", severity: "low", suggestion: "Prefer HTTPS for external calls." },
  ];
  for (const r of rules) {
    const m = r.re.exec(code);
    if (m) {
      out.push(
        finding({
          category: "security",
          severity: r.severity,
          status: "Risk",
          title: r.title,
          detail: `Matched pattern ${r.re}`,
          lineHint: lineOf(code, m.index),
          suggestion: r.suggestion,
        })
      );
    }
  }
  return out;
}

/** Bug / correctness heuristics */
export function scanBugs(code: string): CodeFinding[] {
  const out: CodeFinding[] = [];
  if (/==\s*null|!=\s*null/.test(code) === false && /==[^=]|!=[^=]/.test(code)) {
    const m = /[^=!]==[^=]|!=[^=]/.exec(code);
    if (m) {
      out.push(
        finding({
          category: "bug",
          severity: "medium",
          status: "Broken",
          title: "Loose equality",
          detail: "Use === / !== to avoid coercion bugs",
          lineHint: lineOf(code, m.index),
          suggestion: "Replace == with === and != with !==",
          autoFixable: true,
        })
      );
    }
  }
  if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(code)) {
    out.push(
      finding({
        category: "bug",
        severity: "medium",
        status: "Broken",
        title: "Empty catch block",
        detail: "Errors swallowed silently",
        suggestion: "Log or rethrow; never leave empty catch in production paths",
      })
    );
  }
  if (/TODO|FIXME|XXX/.test(code)) {
    out.push(
      finding({
        category: "gap",
        severity: "info",
        status: "Partial",
        title: "Outstanding TODO/FIXME",
        detail: "Markers indicate incomplete work",
        suggestion: "Resolve or track in issue tracker",
      })
    );
  }
  if (/\bany\b/.test(code) && /:\s*any\b|<any>|as any/.test(code)) {
    out.push(
      finding({
        category: "architecture",
        severity: "low",
        status: "Optimization Opportunity",
        title: "TypeScript any usage",
        detail: "Weakens type safety",
        suggestion: "Replace any with precise types",
      })
    );
  }
  return out;
}

export function scanPerformance(code: string): CodeFinding[] {
  const out: CodeFinding[] = [];
  if (/for\s*\([^)]+\)\s*\{[^}]*await\s+/.test(code)) {
    out.push(
      finding({
        category: "performance",
        severity: "medium",
        status: "Optimization Opportunity",
        title: "Sequential await in loop",
        detail: "May be parallelizable with Promise.all when independent",
        suggestion: "Batch independent async work",
      })
    );
  }
  if (/JSON\.parse\s*\(\s*JSON\.stringify/.test(code)) {
    out.push(
      finding({
        category: "performance",
        severity: "low",
        status: "Optimization Opportunity",
        title: "Deep clone via JSON",
        detail: "Expensive and drops types/functions",
        suggestion: "Use structuredClone or explicit mapping",
      })
    );
  }
  return out;
}

export function scanAccessibility(code: string): CodeFinding[] {
  const out: CodeFinding[] = [];
  if (/<img(?![^>]*alt=)/i.test(code)) {
    out.push(
      finding({
        category: "accessibility",
        severity: "medium",
        status: "Missing",
        title: "Image without alt",
        detail: "img tag missing alt attribute",
        suggestion: "Add meaningful alt text",
        autoFixable: true,
      })
    );
  }
  if (/onClick\s*=/.test(code) && /<div[^>]*onClick|<span[^>]*onClick/.test(code)) {
    out.push(
      finding({
        category: "accessibility",
        severity: "medium",
        status: "Risk",
        title: "Clickable non-interactive element",
        detail: "Prefer button with keyboard support",
        suggestion: "Use <button> or add role and key handlers",
      })
    );
  }
  return out;
}

export function scanSeo(code: string): CodeFinding[] {
  const out: CodeFinding[] = [];
  if (/<html[\s\S]*?>/i.test(code) && !/<title[\s>]/i.test(code)) {
    out.push(
      finding({
        category: "seo",
        severity: "medium",
        status: "Missing",
        title: "Missing document title",
        detail: "HTML without <title>",
        suggestion: "Add unique descriptive title",
      })
    );
  }
  if (/<img/i.test(code) && !/loading\s*=\s*["']lazy["']/.test(code)) {
    out.push(
      finding({
        category: "seo",
        severity: "low",
        status: "Optimization Opportunity",
        title: "Images may lack lazy loading",
        detail: "Consider loading=\"lazy\" for below-fold images",
        suggestion: "Add loading=\"lazy\" where appropriate",
      })
    );
  }
  return out;
}

export function mapRequirements(
  requirements: string[],
  code: string
): RequirementItem[] {
  return requirements.map((text, i) => {
    const terms = text.toLowerCase().split(/\W+/).filter((t) => t.length > 3);
    const hits = terms.filter((t) => code.toLowerCase().includes(t)).length;
    const ratio = terms.length ? hits / terms.length : 0;
    let status: ImplementationStatus = "Missing";
    if (ratio >= 0.6) status = "Implemented";
    else if (ratio >= 0.25) status = "Partial";
    return {
      id: `req_${i + 1}`,
      text,
      status,
      evidence: ratio > 0 ? `Term overlap ${(ratio * 100).toFixed(0)}%` : "No lexical evidence in code",
    };
  });
}

/** Apply safe auto-fixes only */
export function applySafeFixes(code: string, findings: CodeFinding[]): { code: string; applied: string[] } {
  let next = code;
  const applied: string[] = [];
  for (const f of findings) {
    if (!f.autoFixable) continue;
    if (f.title === "Loose equality") {
      const before = next;
      next = next.replace(/([^=!])={2}([^=])/g, "$1===$2").replace(/!={1}([^=])/g, "!==$1");
      if (next !== before) applied.push(f.id);
    }
    if (f.title === "Image without alt") {
      const before = next;
      next = next.replace(/<img(?![^>]*alt=)/gi, '<img alt=""');
      if (next !== before) applied.push(f.id);
    }
  }
  return { code: next, applied };
}

export function reviewCode(input: {
  code: string;
  filename?: string;
  requirements?: string[];
  applyFixes?: boolean;
}): ReviewReport {
  fid = 0;
  const findings = [
    ...scanSecurity(input.code),
    ...scanBugs(input.code),
    ...scanPerformance(input.code),
    ...scanAccessibility(input.code),
    ...scanSeo(input.code),
  ];

  const requirements = mapRequirements(input.requirements ?? [], input.code);

  let fixedCode: string | undefined;
  let verified = false;
  let verificationNote =
    "Fixes are proposals until re-scanned and tests executed with real tool evidence.";

  if (input.applyFixes) {
    const { code, applied } = applySafeFixes(input.code, findings);
    fixedCode = code;
    if (applied.length) {
      const again = [
        ...scanSecurity(code),
        ...scanBugs(code),
        ...scanAccessibility(code),
      ];
      const remaining = again.filter((f) => applied.includes(f.id) || f.autoFixable);
      verified = remaining.length === 0;
      verificationNote = verified
        ? `Re-scan clean for ${applied.length} auto-fixed finding(s). Run automated tests separately for behavioral verification.`
        : `Re-scan still reports issues. Applied: ${applied.join(", ")}`;
    }
  }

  const counts: Record<string, number> = {};
  for (const f of findings) {
    counts[f.severity] = (counts[f.severity] ?? 0) + 1;
    counts[f.category] = (counts[f.category] ?? 0) + 1;
  }

  const critical = findings.filter((f) => f.severity === "critical" || f.severity === "high").length;
  const summary = `Reviewed ${input.filename ?? "snippet"}: ${findings.length} finding(s), ${critical} high/critical. Requirements: ${requirements.filter((r) => r.status === "Implemented").length}/${requirements.length} implemented (lexical).`;

  return {
    summary,
    findings,
    requirements,
    counts,
    fixedCode,
    verified,
    verificationNote,
  };
}

/** Intentionally analyze broken sample for acceptance demos */
export function reviewBrokenFixture(): ReviewReport {
  const code = `
function login(user, password) {
  const api_key = "sk-live-hardcoded-secret-key-123456";
  if (user == null) return;
  try {
  } catch (e) {}
  document.getElementById("x").innerHTML = user;
  eval(password);
}
`;
  return reviewCode({
    code,
    filename: "broken-login.js",
    requirements: [
      "Validate user input",
      "Use parameterized authentication",
      "No hardcoded secrets",
      "Handle errors explicitly",
    ],
    applyFixes: true,
  });
}
