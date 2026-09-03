import { describe, it, expect } from "vitest";
import { detectSourceContradictions } from "../contradictions";
import { sourcesFromSearchHits, formatBibliography, citeClaims } from "../citations";

describe("detectSourceContradictions", () => {
  it("flags two sources with opposing sentiment on the same topic", () => {
    const result = detectSourceContradictions([
      { title: "Sales growth continues", url: "https://a.example", snippet: "Revenue increase this quarter, leading the market" },
      { title: "Sales decline reported", url: "https://b.example", snippet: "A steep decline was noted, failure to meet targets" },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]?.reason).toMatch(/[Oo]pposing/);
  });

  it("does not flag two sources that agree", () => {
    const result = detectSourceContradictions([
      { title: "Growth continues", url: "https://a.example", snippet: "Strong growth and success this year" },
      { title: "Another growth report", url: "https://b.example", snippet: "Leading performance, best quarter yet" },
    ]);
    expect(result).toHaveLength(0);
  });

  it("does not flag sources with no polarity language at all", () => {
    const result = detectSourceContradictions([
      { title: "Quarterly report", url: "https://a.example", snippet: "The company released its Q3 numbers" },
      { title: "Another report", url: "https://b.example", snippet: "Analysts reviewed the filing" },
    ]);
    expect(result).toHaveLength(0);
  });

  it("checks every pair, not just adjacent ones, across 3+ sources", () => {
    const result = detectSourceContradictions([
      { title: "Neutral", url: "https://a.example", snippet: "A report was released" },
      { title: "Positive", url: "https://b.example", snippet: "Best growth ever, success" },
      { title: "Negative", url: "https://c.example", snippet: "Total failure, steep decline" },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]?.a.url).toBe("https://b.example");
    expect(result[0]?.b.url).toBe("https://c.example");
  });
});

describe("sourcesFromSearchHits", () => {
  it("only accepts real http(s) URLs, silently dropping anything else", () => {
    const sources = sourcesFromSearchHits([
      { title: "Valid", url: "https://example.com/page" },
      { title: "No URL", url: "" },
      { title: "Not a URL", url: "not-a-real-url" },
      { title: "javascript scheme", url: "javascript:alert(1)" },
    ]);
    expect(sources).toHaveLength(1);
    expect(sources[0]?.url).toBe("https://example.com/page");
  });

  it("marks every source reliability as 'observed', never fabricated", () => {
    const sources = sourcesFromSearchHits([{ title: "A", url: "https://a.example" }]);
    expect(sources[0]?.reliability).toBe("observed");
  });
});

describe("formatBibliography", () => {
  it("numbers entries starting at 1 and includes the URL for each", () => {
    const sources = sourcesFromSearchHits([
      { title: "First", url: "https://a.example" },
      { title: "Second", url: "https://b.example" },
    ]);
    const bib = formatBibliography(sources);
    expect(bib).toContain("[1] First — https://a.example");
    expect(bib).toContain("[2] Second — https://b.example");
  });
});

describe("citeClaims — never fabricates a citation for an unsupported claim", () => {
  const sources = sourcesFromSearchHits([
    {
      title: "Electric vehicle adoption report",
      url: "https://ev-report.example",
      snippet: "Electric vehicle adoption accelerated significantly across major markets in 2025",
    },
  ]);

  it("cites a claim that has strong lexical overlap with a real source", () => {
    const { citations, unsupported } = citeClaims(
      ["Electric vehicle adoption accelerated across major markets"],
      sources
    );
    expect(citations).toHaveLength(1);
    expect(citations[0]?.url).toBe("https://ev-report.example");
    expect(unsupported).toHaveLength(0);
  });

  it("marks a claim unsupported rather than inventing a citation when overlap is too weak", () => {
    const { citations, unsupported } = citeClaims(
      ["The moon landing happened in 1969"],
      sources
    );
    expect(citations).toHaveLength(0);
    expect(unsupported).toEqual(["The moon landing happened in 1969"]);
  });

  it("every citation's url traces back to an actual provided source, never invented", () => {
    const { citations } = citeClaims(
      ["Electric vehicle adoption accelerated across major markets"],
      sources
    );
    const validUrls = new Set(sources.map((s) => s.url));
    for (const c of citations) {
      expect(validUrls.has(c.url)).toBe(true);
    }
  });

  it("returns nothing but unsupported claims when given zero sources", () => {
    const { citations, unsupported } = citeClaims(["Any claim at all here"], []);
    expect(citations).toHaveLength(0);
    expect(unsupported).toHaveLength(1);
  });
});
