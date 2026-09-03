import { describe, it, expect, vi, afterEach } from "vitest";
import { auditUrl } from "../audit";

function mockFetchOk(html: string, opts: { status?: number; url?: string } = {}) {
  return vi.fn().mockResolvedValue({
    ok: (opts.status ?? 200) < 400,
    status: opts.status ?? 200,
    url: opts.url ?? "https://example.com/",
    text: async () => html,
  });
}

const GOOD_HTML = `
<!doctype html>
<html lang="en">
<head>
  <title>Superior AI — Multi-Model Autonomous Expert Platform</title>
  <meta name="description" content="A production-grade AI operating system covering marketing, sales, and engineering workflows for growing teams." />
  <link rel="canonical" href="https://example.com/" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script type="application/ld+json">{"@type":"Organization"}</script>
</head>
<body>
  <h1>Superior AI</h1>
  <h2>What it does</h2>
  <p>${"word ".repeat(200)}</p>
  <img src="/hero.png" alt="Dashboard screenshot" />
  <a href="/pricing">Pricing</a>
  <a href="/docs">Docs</a>
  <a href="/privacy">Privacy</a>
  <form><button>Get started</button></form>
</body>
</html>`;

const BAD_HTML = `
<!doctype html>
<html>
<head><meta name="robots" content="noindex" /></head>
<body><img src="/x.png"><p>too short</p></body>
</html>`;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("auditUrl (live fetch)", () => {
  it("scores a well-formed page highly and reports observed signals, not fabricated ones", async () => {
    vi.stubGlobal("fetch", mockFetchOk(GOOD_HTML));
    const result = await auditUrl("https://example.com");

    expect(result.dataQuality).toBe("Observed Data");
    expect(result.seoScore).toBeGreaterThan(70);
    expect(result.accessibilityScore).toBeGreaterThan(70);
    expect(result.trustScore).toBeGreaterThan(70); // https + privacy link
    expect(result.technicalSignals.h1Count).toBe(1);
    expect(result.technicalSignals.imagesMissingAlt).toBe(0);
    expect(result.technicalSignals.hasStructuredData).toBe(true);
  });

  it("penalizes noindex, missing title/description, and thin content", async () => {
    vi.stubGlobal("fetch", mockFetchOk(BAD_HTML));
    const result = await auditUrl("https://example.com/bad");

    expect(result.seoScore).toBeLessThan(50);
    expect(result.recommendations.some((r) => /noindex/i.test(r))).toBe(true);
    expect(result.recommendations.some((r) => /title/i.test(r))).toBe(true);
    expect(result.technicalSignals.imagesMissingAlt).toBe(1);
  });

  it("never fabricates data when the fetch fails — falls back to the honest zero-confidence shell", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network unreachable"))
    );
    const result = await auditUrl("https://unreachable.example");

    expect(result.seoScore).toBe(0);
    expect(result.dataQuality).toBe("Model Inference");
    expect(result.confidence).toBeLessThanOrEqual(10);
    expect(result.recommendations.some((r) => /fetch failed/i.test(r))).toBe(true);
  });

  it("flags non-HTTPS pages", async () => {
    vi.stubGlobal("fetch", mockFetchOk(GOOD_HTML, { url: "http://example.com/" }));
    const result = await auditUrl("http://example.com");
    expect(result.technicalSignals.https).toBe(false);
    expect(result.recommendations.some((r) => /HTTPS/i.test(r))).toBe(true);
  });
});
