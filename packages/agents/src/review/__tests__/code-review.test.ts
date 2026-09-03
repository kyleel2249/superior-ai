import { describe, it, expect } from "vitest";
import {
  scanSecurity,
  scanBugs,
  mapRequirements,
  applySafeFixes,
  reviewCode,
  reviewBrokenFixture,
} from "../code-review";

describe("scanSecurity", () => {
  it("flags eval, hardcoded secrets, and innerHTML in one pass", () => {
    const code = `
      const api_key = "sk-live-abcdefghij1234567890";
      function run(password) {
        document.getElementById("x").innerHTML = password;
        eval(password);
      }
    `;
    const findings = scanSecurity(code);
    const titles = findings.map((f) => f.title);
    expect(titles).toContain("Use of eval");
    expect(titles).toContain("Hardcoded API key");
    expect(titles).toContain("innerHTML assignment");
    expect(findings.some((f) => f.severity === "critical")).toBe(true);
  });

  it("does not flag clean, parameterized code", () => {
    const code = `
      export async function getUser(db, id) {
        return db.query("SELECT * FROM users WHERE id = $1", [id]);
      }
    `;
    expect(scanSecurity(code)).toHaveLength(0);
  });

  it("flags insecure http URLs at low severity, not critical", () => {
    const findings = scanSecurity('fetch("http://example.com/api")');
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("low");
  });
});

describe("scanBugs", () => {
  it("flags loose equality as auto-fixable", () => {
    const findings = scanBugs("if (x == null) { y = 1; }");
    const eq = findings.find((f) => f.title === "Loose equality");
    // x == null is an intentional idiom the regex explicitly excludes;
    // use a real coercion bug instead.
    expect(eq).toBeUndefined();

    const findings2 = scanBugs("if (count == 5) { doThing(); }");
    expect(findings2.some((f) => f.title === "Loose equality" && f.autoFixable)).toBe(true);
  });

  it("flags empty catch blocks", () => {
    const findings = scanBugs("try { risky(); } catch (e) {}");
    expect(findings.some((f) => f.title === "Empty catch block")).toBe(true);
  });

  it("does not flag a well-formed try/catch with real handling", () => {
    const findings = scanBugs('try { risky(); } catch (e) { logger.error(e); throw e; }');
    expect(findings.some((f) => f.title === "Empty catch block")).toBe(false);
  });
});

describe("mapRequirements", () => {
  it("marks a requirement Implemented when the code has strong lexical overlap", () => {
    const code = "export function validateUserInput(input) { return input.trim().length > 0; }";
    const [req] = mapRequirements(["Validate user input before processing"], code);
    expect(req?.status).toBe("Implemented");
  });

  it("marks a requirement Missing when there is no overlap at all", () => {
    const code = "export function sendEmail(to, subject) { /* ... */ }";
    const [req] = mapRequirements(["Encrypt data at rest using AES-256"], code);
    expect(req?.status).toBe("Missing");
  });
});

describe("applySafeFixes", () => {
  it("rewrites loose equality to strict equality only for auto-fixable findings", () => {
    const code = "if (count == 5) { done = true; }";
    const findings = scanBugs(code);
    const { code: fixed, applied } = applySafeFixes(code, findings);
    expect(fixed).toContain("count === 5");
    expect(applied.length).toBeGreaterThan(0);
  });

  it("leaves code untouched when no finding is auto-fixable", () => {
    const code = "try { risky(); } catch (e) {}";
    const findings = scanBugs(code);
    const { code: fixed, applied } = applySafeFixes(code, findings);
    expect(fixed).toBe(code);
    expect(applied).toHaveLength(0);
  });
});

describe("reviewCode (integration)", () => {
  it("produces a coherent report: findings, counts, and a truthful summary", () => {
    const report = reviewCode({
      code: 'eval(x); if (n == 1) { ok = true; }',
      filename: "sample.js",
      requirements: ["Validate input safely"],
    });
    expect(report.findings.length).toBeGreaterThan(0);
    expect(report.counts.critical).toBeGreaterThanOrEqual(1);
    expect(report.summary).toContain("sample.js");
    expect(report.verified).toBe(false); // applyFixes not requested
  });

  it("verified=true only after a real re-scan confirms the fix resolved the finding", () => {
    const report = reviewCode({
      code: "if (count == 5) { done = true; }",
      applyFixes: true,
    });
    expect(report.fixedCode).toContain("count === 5");
    expect(report.verified).toBe(true);
    expect(report.verificationNote).toMatch(/Re-scan clean/);
  });

  it("reviewBrokenFixture always surfaces its intentional demo issues (regression guard)", () => {
    const report = reviewBrokenFixture();
    const titles = report.findings.map((f) => f.title);
    expect(titles).toContain("Use of eval");
    expect(titles).toContain("Hardcoded API key");
    expect(titles).toContain("innerHTML assignment");
    expect(titles).toContain("Empty catch block");
  });
});
